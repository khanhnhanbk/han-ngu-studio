import type { VocabData } from "@/lib/vocab/lookup";

import { MAX_WORDS } from "./buildDeck";

/** HSK 3.0 levels as vocab.json writes them. */
export const HSK_LEVELS = ["1", "2", "3", "4", "5", "6", "7-9"] as const;
export type HskLevel = (typeof HSK_LEVELS)[number];

/**
 * The words first listed at `level` (a word listed at several levels counts
 * at its lowest, as the deck's HSK column does), in vocab.json order.
 */
export function wordsOfLevel(vocab: VocabData, level: HskLevel): string[] {
  const out: string[] = [];
  for (const [word, entries] of Object.entries(vocab)) {
    const lowest = entries.reduce((a, b) => (Number.parseInt(b[0], 10) < Number.parseInt(a, 10) ? b[0] : a), entries[0][0]);
    if (lowest === level) out.push(word);
  }
  return out;
}

/** Split into the fewest even parts of at most `max` words (HSK 7-9 → 6 parts of ~940). */
export function splitParts<T>(items: readonly T[], max = MAX_WORDS): T[][] {
  if (items.length === 0) return [[]];
  const parts = Math.ceil(items.length / max);
  const size = Math.ceil(items.length / parts);
  return Array.from({ length: parts }, (_, i) => items.slice(i * size, (i + 1) * size));
}

export type PickResult = {
  /** The new word list (current words first, then the added ones). */
  words: string[];
  added: number;
  /** Left out because they are marked known in Đọc hiểu. */
  known: number;
  /** Already in the list. */
  already: number;
  /** Left out because the list would pass MAX_WORDS. */
  overLimit: number;
};

/**
 * Add `candidates` to `current` (all Simplified), skipping words already
 * there, words in `known` when `skipKnown`, and anything past `max`.
 */
export function addWords(
  current: readonly string[],
  candidates: readonly string[],
  known: Readonly<Record<string, unknown>>,
  skipKnown: boolean,
  max = MAX_WORDS,
): PickResult {
  const words = [...current];
  const seen = new Set(current);
  const result = { added: 0, known: 0, already: 0, overLimit: 0 };
  for (const word of candidates) {
    if (seen.has(word)) result.already++;
    else if (skipKnown && Object.hasOwn(known, word)) result.known++;
    else if (words.length >= max) result.overLimit++;
    else {
      words.push(word);
      seen.add(word);
      result.added++;
    }
  }
  return { words, ...result };
}
