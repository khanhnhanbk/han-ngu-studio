/**
 * Sentence parsing and word extraction for comprehensible-input ordering.
 *
 * Mirrors the owner's Python script: strip the sentence, run the tokenizer
 * on the whole stripped text, keep tokens matching `\w+`.
 *
 * Python vs JS: Python 3's `\w` is Unicode-aware (str.isalnum() plus "_":
 * letters, digits Nd/Nl/No), whereas JS `\w` is ASCII-only. We emulate it with
 * \p{L}\p{N}\p{M}_ (\p{N} = Nd/Nl/No). \p{M} (combining marks) is included
 * by design choice, so marks inside a token do not reject it; 一-鿿 is
 * kept explicitly for Han (already covered by \p{L}, harmless).
 */
import { pyStrip } from "../segment/tokenizer";

import type { Sentence } from "./types";

export type WordTokenizer = { tokenize(text: string): string[] };

const PY_WORD_RE = /^[一-鿿\p{L}\p{N}\p{M}_]+$/u;

/** True if the whole token is word characters (Python `\w+` full match). */
export function pyWordMatch(token: string): boolean {
  return PY_WORD_RE.test(token);
}

/** Split on newlines, keep 1-based line numbers, skip blank lines. */
export function parseSentences(text: string): Sentence[] {
  const out: Sentence[] = [];
  text.split(/\r?\n/).forEach((line, i) => {
    const t = pyStrip(line);
    if (t) out.push({ idx: i + 1, text: t });
  });
  return out;
}

/** One known word per line; blanks skipped. */
export function parseKnownWords(text: string): Set<string> {
  const words = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    const w = pyStrip(line);
    if (w) words.add(w);
  }
  return words;
}

/** Distinct word tokens of a sentence. */
export function extractWords(tokenizer: WordTokenizer, text: string): Set<string> {
  const words = new Set<string>();
  for (const token of tokenizer.tokenize(pyStrip(text))) {
    if (pyWordMatch(token)) words.add(token);
  }
  return words;
}
