/**
 * Sentence parsing and word extraction for comprehensible-input ordering.
 *
 * Mirrors the owner's Python script: strip the sentence, run the tokenizer
 * on the whole stripped text, keep tokens matching `\w+`.
 *
 * Python vs JS: Python 3's `\w` is Unicode-aware: a character matches when
 * str.isalnum() is true, or it is "_". isalnum() covers letters (Lu/Ll/Lt/Lm/Lo
 * = \p{L}) and numbers (Nd/Nl/No = \p{N}). Combining marks (\p{M}) are NOT
 * alphanumeric, so e.g. "e\u0301" fails in Python and must fail here too.
 * JS `\w` is ASCII-only, hence the explicit classes. 一-鿿 is kept to mirror
 * the Python pattern (already covered by \p{L}).
 */
import { pyStrip } from "../segment/tokenizer";

import type { Sentence } from "./types";

export type WordTokenizer = { tokenize(text: string): string[] };

const PY_WORD_RE = /^[一-鿿\p{L}\p{N}_]+$/u;

/** True if the whole token is word characters (Python `\w+` full match). */
export function pyWordMatch(token: string): boolean {
  return PY_WORD_RE.test(token);
}

// Python reads text files with universal newlines: \r\n, \r and \n all end a line.
const LINE_BREAK = /\r\n|\r|\n/;

/**
 * Split into lines, skip blank ones, keep each line's 0-based index
 * (Python `enumerate` over the file), so `idx` matches the script's output.
 */
export function parseSentences(text: string): Sentence[] {
  const out: Sentence[] = [];
  text.split(LINE_BREAK).forEach((line, i) => {
    const t = pyStrip(line);
    if (t) out.push({ idx: i, text: t });
  });
  return out;
}

/** One known word per line; blanks skipped. */
export function parseKnownWords(text: string): Set<string> {
  const words = new Set<string>();
  for (const line of text.split(LINE_BREAK)) {
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
