import { memoJson } from "@/lib/fetchJson";
import { resolveSound, syllableSequence, wordPart, type AudioEntry, type AudioIndex, type Recording } from "@/lib/speech/resolve";

/**
 * Recordings inside the .apkg (Anki "Nghe" card and the sound on every back):
 * the same human recordings as the 🔊 buttons (audio-cmn, CC BY-SA, packed by
 * scripts/build-audio.mjs into public/data/audio/), cut out of their shards
 * in the browser. Nothing is uploaded.
 */

/** Average size of one audio shard file, for the download estimate. */
export const AUDIO_SHARD_BYTES = 32 * 1024;

/**
 * The recordings for a word, in play order: its own recording, else (one
 * character) its syllable, else its characters' syllables one after another
 * (河内 → he2 + nei4). Null when there is none (the card gets no sound).
 */
export function recordingsFor(index: AudioIndex, word: string, tone3: readonly string[]): Recording[] | null {
  const sound = resolveSound(index, { word, tone3 });
  if (sound.kind === "recording") return [sound.recording];
  return syllableSequence(index, { word, tone3 });
}

/** Files the recordings live in ("w-12.bin"). */
export function shardPath(rec: Recording): string {
  return `/data/audio/${rec.set === "words" ? "w" : "s"}-${rec.entry[0]}.bin`;
}

/** One MP3 cut out of its shard; several are joined (MP3 frames play back to back). */
export function joinRecordings(recs: readonly Recording[], shards: ReadonlyMap<string, Uint8Array>): Uint8Array | null {
  const parts: Uint8Array[] = [];
  for (const rec of recs) {
    const shard = shards.get(shardPath(rec));
    const [, offset, length] = rec.entry;
    if (!shard || offset + length > shard.length) return null;
    parts.push(shard.subarray(offset, offset + length));
  }
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

/** Stable media file name for a word ("hns-3f9a….mp3"): the same word reuses the file on re-import. */
export async function audioFileName(word: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-1", new TextEncoder().encode(`hns-audio:${word}`)));
  return `hns-${Array.from(digest.slice(0, 8), (b) => b.toString(16).padStart(2, "0")).join("")}.mp3`;
}

type Entries = Record<string, AudioEntry>;
const wordParts = new Map<number, () => Promise<Entries>>();
const loadSyllables = memoJson<Entries>("/data/audio/index-s.json");

/** The index entries `words` need: their word-index parts and the syllable index. */
export async function loadAudioIndex(words: readonly string[]): Promise<AudioIndex> {
  const parts = Array.from(new Set(words.map(wordPart)));
  const loaded = await Promise.all(
    parts.map((p) => {
      if (!wordParts.has(p)) wordParts.set(p, memoJson<Entries>(`/data/audio/index-w-${p}.json`));
      return wordParts.get(p)!().catch(() => ({}) as Entries);
    }),
  );
  const syllables = await loadSyllables().catch(() => ({}) as Entries);
  return { words: Object.assign({}, ...loaded) as Entries, syllables };
}

/** Download the shards (in small batches) and return path → bytes; failed ones are left out. */
export async function loadShards(paths: readonly string[], onProgress?: (done: number) => void): Promise<Map<string, Uint8Array>> {
  const out = new Map<string, Uint8Array>();
  const BATCH = 6;
  for (let i = 0; i < paths.length; i += BATCH) {
    await Promise.all(
      paths.slice(i, i + BATCH).map(async (path) => {
        try {
          const res = await fetch(path);
          if (res.ok) out.set(path, new Uint8Array(await res.arrayBuffer()));
        } catch {
          // A missing shard only leaves its words without sound.
        }
      }),
    );
    onProgress?.(Math.min(i + BATCH, paths.length));
  }
  return out;
}
