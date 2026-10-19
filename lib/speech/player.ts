import { markLoaded } from "@/lib/data/loaded";
import { memoJson } from "@/lib/fetchJson";

import { readSpeechPrefs } from "./prefs";
import {
  resolveSound,
  syllableSequence,
  wordPart,
  type AudioEntry,
  type AudioIndex,
  type Recording,
  type SoundRequest,
} from "./resolve";
import { setSpeechState as set } from "./store";
import { pickVoice } from "./voices";

/**
 * Plays one word at a time: a human recording through an AudioContext, or
 * the device voice as a fallback. Nothing loads until the first click; then
 * only the index part the word needs (~3 KB) and one ~32 KB shard.
 */

type Entries = Record<string, AudioEntry>;
const wordParts = new Map<number, () => Promise<Entries>>();
const loadWordPart = (part: number) => {
  if (!wordParts.has(part)) wordParts.set(part, memoJson<Entries>(`/data/audio/index-w-${part}.json`));
  return wordParts.get(part)!();
};
const loadSyllables = memoJson<Entries>("/data/audio/index-s.json");

/** The index entries for one request; a missing part reads as empty (falls back to the voice). */
async function indexFor(req: SoundRequest, syllables: boolean): Promise<AudioIndex> {
  const [w, s] = await Promise.all([
    loadWordPart(wordPart(req.word)).catch((): Entries => ({})),
    syllables ? loadSyllables().catch((): Entries => ({})) : Promise.resolve<Entries>({}),
  ]);
  return { words: w, syllables: s };
}

/* ---------- recordings ---------- */

let ctx: AudioContext | null = null;

/**
 * Create or resume the AudioContext. Must run synchronously inside the click:
 * iOS Safari only unlocks audio during a user gesture, and an `await` before
 * this would lose it. Once unlocked, later playback works after awaits.
 */
function audioContext(): AudioContext | null {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

const shards = new Map<string, Promise<ArrayBuffer>>();

function loadShard(rec: Recording): Promise<ArrayBuffer> {
  const path = `/data/audio/${rec.set === "words" ? "w" : "s"}-${rec.entry[0]}.bin`;
  let p = shards.get(path);
  if (!p) {
    p = fetch(path)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.arrayBuffer();
      })
      .then((buf) => {
        markLoaded(path);
        return buf;
      })
      .catch((err: unknown) => {
        shards.delete(path);
        throw err;
      });
    shards.set(path, p);
  }
  return p;
}

// Decoded sounds, most recent last; a word clicked again plays at once.
const decoded = new Map<string, AudioBuffer>();
const MAX_DECODED = 60;

async function decode(actx: AudioContext, rec: Recording): Promise<AudioBuffer> {
  const id = `${rec.set}:${rec.key}`;
  const hit = decoded.get(id);
  if (hit) {
    decoded.delete(id);
    decoded.set(id, hit);
    return hit;
  }
  const [, offset, length] = rec.entry;
  // slice() copies: decodeAudioData detaches the buffer it is given.
  const bytes = (await loadShard(rec)).slice(offset, offset + length);
  const buffer = await actx.decodeAudioData(bytes);
  decoded.set(id, buffer);
  if (decoded.size > MAX_DECODED) decoded.delete(decoded.keys().next().value as string);
  return buffer;
}

/* ---------- playback ---------- */

let source: AudioBufferSourceNode | null = null;
let token = 0;

/** Stop whatever is playing. */
export function stopSpeech(): void {
  token++;
  try {
    source?.stop();
  } catch {
    // Already stopped.
  }
  source = null;
  if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
  set({ id: null, status: "idle" });
}

/** Device voices, waiting briefly for Chrome, which loads them late. */
async function deviceVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof speechSynthesis === "undefined") return [];
  const now = speechSynthesis.getVoices();
  if (now.length) return now;
  return new Promise((resolve) => {
    const done = () => resolve(speechSynthesis.getVoices());
    speechSynthesis.addEventListener("voiceschanged", done, { once: true });
    setTimeout(done, 1000);
  });
}

async function speakWithVoice(id: string, text: string, my: number): Promise<"ok" | "unavailable"> {
  const prefs = readSpeechPrefs();
  const voice = pickVoice(await deviceVoices(), prefs.allowOnline, prefs.voiceURI);
  if (my !== token) return "ok";
  if (!voice) {
    set({ id: null, status: "idle" });
    return "unavailable";
  }
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = prefs.rate;
  u.onend = u.onerror = () => my === token && set({ id: null, status: "idle" });
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
  set({ id, status: "playing" });
  return "ok";
}

function start(actx: AudioContext, buffers: AudioBuffer[], id: string, my: number): void {
  let at = actx.currentTime + 0.02;
  buffers.forEach((buffer, i) => {
    const src = actx.createBufferSource();
    src.buffer = buffer;
    src.connect(actx.destination);
    if (i === buffers.length - 1) {
      src.onended = () => my === token && set({ id: null, status: "idle" });
      source = src;
    }
    src.start(at);
    // Chained syllables: the recordings have silence at both ends; overlap them a little.
    at += Math.max(0.2, buffer.duration - 0.25);
  });
  set({ id, status: "playing" });
}

/**
 * Play a word. Call it straight from the click handler (see audioContext).
 * Resolves "unavailable" when there is neither a recording nor a usable voice.
 */
export async function playWord(id: string, req: SoundRequest): Promise<"ok" | "unavailable"> {
  stopSpeech();
  const my = token;
  const actx = audioContext();
  const single = Array.from(req.word).length === 1;
  set({ id, status: "loading" });
  // Syllables matter for single characters; words need only their index part.
  const index = await indexFor(req, single);
  if (my !== token) return "ok";
  const sound = resolveSound(index, req);
  if (sound.kind === "recording" && actx) {
    try {
      const buffer = await decode(actx, sound.recording);
      if (my !== token) return "ok";
      start(actx, [buffer], id, my);
      return "ok";
    } catch {
      // A shard failed to load or decode: try the device voice instead.
    }
  }
  const spoken = await speakWithVoice(id, req.word, my);
  if (spoken === "ok" || my !== token) return "ok";
  // No device voice: chain the syllable recordings (河内 → hé + nèi).
  if (!actx) return "unavailable";
  try {
    set({ id, status: "loading" });
    const parts = syllableSequence(await indexFor(req, true), req);
    if (!parts) throw new Error("no syllables");
    const buffers = await Promise.all(parts.map((p) => decode(actx, p)));
    if (my !== token) return "ok";
    start(actx, buffers, id, my);
    return "ok";
  } catch {
    set({ id: null, status: "idle" });
    return "unavailable";
  }
}
