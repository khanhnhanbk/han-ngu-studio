import { markLoaded } from "@/lib/data/loaded";
import { memoJson } from "@/lib/fetchJson";

import { readSpeechPrefs } from "./prefs";
import { resolveSound, syllableSequence, type AudioIndex, type Recording, type SoundRequest } from "./resolve";
import { pickVoice } from "./voices";

/**
 * Plays one word at a time: a human recording through an AudioContext, or
 * the device voice as a fallback. A small store tells every 🔊 button which
 * word is loading or playing, and whether the voice settings are open.
 */

export const AUDIO_INDEX_FILE = "/data/audio/index.json";
const loadIndex = memoJson<AudioIndex>(AUDIO_INDEX_FILE);
let index: AudioIndex | null = null;

/** Fetch the recording index early (~100 KB) so a click can resolve at once. */
export function preloadAudioIndex(): void {
  if (!index) loadIndex().then((i) => (index = i), () => undefined);
}

/* ---------- store ---------- */

export type SpeechState = {
  /** Id of the button whose word is loading or playing. */
  id: string | null;
  status: "idle" | "loading" | "playing";
  /** Voice settings dialog: closed, or open (because a word had no sound). */
  settings: "closed" | "open" | "unavailable";
};

let state: SpeechState = { id: null, status: "idle", settings: "closed" };
const listeners = new Set<() => void>();
const set = (next: Partial<SpeechState>) => {
  state = { ...state, ...next };
  for (const l of listeners) l();
};
export const subscribeSpeech = (l: () => void) => (listeners.add(l), () => void listeners.delete(l));
export const speechState = () => state;
export const SERVER_SPEECH_STATE: SpeechState = state;

export function openSpeechSettings(reason: "open" | "unavailable" = "open") {
  set({ settings: reason });
}
export function closeSpeechSettings() {
  set({ settings: "closed" });
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

/**
 * Play a word. Call it straight from the click handler (see audioContext).
 * Resolves "unavailable" when there is neither a recording nor a usable voice.
 */
export async function playWord(id: string, req: SoundRequest): Promise<"ok" | "unavailable"> {
  stopSpeech();
  const my = token;
  const actx = audioContext();
  if (!index) {
    set({ id, status: "loading" });
    try {
      index = await loadIndex();
    } catch {
      // Offline or blocked: fall through to the device voice.
    }
  }
  if (my !== token) return "ok";
  const sound = resolveSound(index, req);
  if (sound.kind === "recording" && actx) {
    set({ id, status: "loading" });
    try {
      const buffer = await decode(actx, sound.recording);
      if (my !== token) return "ok";
      const src = actx.createBufferSource();
      src.buffer = buffer;
      src.connect(actx.destination);
      src.onended = () => my === token && set({ id: null, status: "idle" });
      source = src;
      src.start();
      set({ id, status: "playing" });
      return "ok";
    } catch {
      // A shard failed to load or decode: try the device voice instead.
    }
  }
  const spoken = await speakWithVoice(id, req.word, my);
  if (spoken === "ok" || my !== token) return "ok";
  // No device voice: chain the syllable recordings (河内 → hé + nèi).
  const parts = syllableSequence(index, req);
  if (!parts || !actx) return "unavailable";
  try {
    set({ id, status: "loading" });
    const buffers = await Promise.all(parts.map((p) => decode(actx, p)));
    if (my !== token) return "ok";
    let at = actx.currentTime + 0.05;
    buffers.forEach((buffer, i) => {
      const src = actx.createBufferSource();
      src.buffer = buffer;
      src.connect(actx.destination);
      if (i === buffers.length - 1) {
        src.onended = () => my === token && set({ id: null, status: "idle" });
        source = src;
      }
      src.start(at);
      // The recordings have some silence at both ends; overlap them a little.
      at += Math.max(0.2, buffer.duration - 0.25);
    });
    set({ id, status: "playing" });
    return "ok";
  } catch {
    set({ id: null, status: "idle" });
    return "unavailable";
  }
}
