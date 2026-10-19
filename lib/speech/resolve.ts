/**
 * Which sound to play for a word (lib/speech). Human recordings first
 * (audio-cmn, packed by scripts/build-audio.mjs), the device voice last.
 */

/** [shard, byte offset, byte length] of one MP3 inside a shard. */
export type AudioEntry = [number, number, number];

/**
 * The index entries a lookup needs. Built from the split index files
 * (index-w-<part>.json for words, index-s.json for syllables): a click
 * fetches only the part its word falls in.
 */
export type AudioIndex = {
  /** Simplified word or character → recording (speaker Yue Tan). */
  words: Record<string, AudioEntry>;
  /** Toned syllable, tones 1–4, ü written v ("hang2", "nv3") → recording (speaker Chen Wang). */
  syllables: Record<string, AudioEntry>;
};

/** Number of word-index files. Must match scripts/build-audio.mjs. */
export const WORD_PARTS = 32;

/** Which index-w-<part>.json holds a word: FNV-1a over its code points (as the build script). */
export function wordPart(word: string): number {
  let h = 0x811c9dc5;
  for (const ch of word) {
    h ^= ch.codePointAt(0)!;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h % WORD_PARTS;
}

export type Recording = { set: "words" | "syllables"; key: string; entry: AudioEntry };
export type Sound = { kind: "recording"; recording: Recording } | { kind: "voice"; text: string };

/**
 * audio-cmn's syllable file name for one TONE3 syllable ("hang2" → "hang2",
 * "nu:3" → "nv3"). Null for the neutral tone (5): there are no neutral-tone
 * recordings, and a tone-1 copy would be wrong.
 */
export function syllableKey(tone3: string): string | null {
  const key = tone3.toLowerCase().replace(/u:/g, "v").replace(/ü/g, "v");
  return /^[a-z]+[1-4]$/.test(key) ? key : null;
}

export type SoundRequest = {
  /** The word in Simplified characters (recordings are keyed that way). */
  word: string;
  /** TONE3 reading per character, when known ("hang2"). */
  tone3?: readonly string[];
  /**
   * The reading comes from the sentence (Đọc hiểu): a single character then
   * plays the syllable for exactly that reading (行 in 银行 → háng) before
   * the character's own recording, which has one fixed reading.
   */
  contextual?: boolean;
};

/**
 * Last resort for a word with no recording on a device with no Chinese
 * voice: the human syllable recordings of its characters, one after another
 * (河内 → he2 + nei4). Null unless every character has a reading with a
 * syllable recording (no neutral tones).
 */
export function syllableSequence(index: AudioIndex | null, req: SoundRequest): Recording[] | null {
  const chars = Array.from(req.word);
  if (!index || !req.tone3 || req.tone3.length !== chars.length || chars.length < 2) return null;
  const out: Recording[] = [];
  for (const t of req.tone3) {
    const key = syllableKey(t);
    if (!key || !Object.hasOwn(index.syllables, key)) return null;
    out.push({ set: "syllables", key, entry: index.syllables[key] });
  }
  return out;
}

/**
 * The most reliable sound for a word:
 * 1. single character read in context (tone 1–4) → its syllable recording;
 * 2. the word's (or character's) own recording;
 * 3. single character with a known reading → its syllable recording;
 * 4. otherwise the device voice.
 */
export function resolveSound(index: AudioIndex | null, req: SoundRequest): Sound {
  const chars = Array.from(req.word);
  const syllable = chars.length === 1 && req.tone3?.length === 1 ? syllableKey(req.tone3[0]) : null;
  const fromSyllable = (): Sound | null =>
    index && syllable && Object.hasOwn(index.syllables, syllable)
      ? { kind: "recording", recording: { set: "syllables", key: syllable, entry: index.syllables[syllable] } }
      : null;
  const fromWord = (): Sound | null =>
    index && Object.hasOwn(index.words, req.word)
      ? { kind: "recording", recording: { set: "words", key: req.word, entry: index.words[req.word] } }
      : null;
  const sound = req.contextual ? (fromSyllable() ?? fromWord()) : (fromWord() ?? fromSyllable());
  return sound ?? { kind: "voice", text: req.word };
}
