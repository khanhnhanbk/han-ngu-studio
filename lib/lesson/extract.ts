import { segment, type Tokenizer } from "@/lib/segment/tokenizer";

const HAN = /\p{Script=Han}/u;

/**
 * The words of a text, in order of first appearance, once each: the
 * tokenizer's tokens that contain a Chinese character (punctuation, Latin and
 * numbers are left out). The teacher then removes the words they do not want.
 */
export function extractWords(tokenizer: Tokenizer, text: string): string[] {
  const seen = new Set<string>();
  for (const line of segment(tokenizer, text)) {
    for (const token of line) {
      const word = token.trim();
      if (word && HAN.test(word)) seen.add(word);
    }
  }
  return [...seen];
}

/** Words of `add` not already in `words`, appended in order. */
export function appendWords(words: readonly string[], add: readonly string[]): string[] {
  const seen = new Set(words);
  const out = [...words];
  for (const w of add) {
    if (!seen.has(w)) {
      seen.add(w);
      out.push(w);
    }
  }
  return out;
}
