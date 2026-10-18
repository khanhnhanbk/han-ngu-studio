import { segment, type Tokenizer } from "@/lib/segment/tokenizer";
import type { VocabData } from "@/lib/vocab/lookup";

import type { Example } from "./types";

export type RankData = { tokenizer: Tokenizer; vocab: VocabData };

/** Words outside the HSK list (names such as 汤姆, rare words) rank as hardest. */
const UNLISTED = 10;
/** Punctuation, numbers and spaces say nothing about difficulty. */
const NEUTRAL = /^[\p{P}\p{S}\p{N}\s]+$/u;

/** Lowest HSK level of a word as a number ("7-9" → 7), or null when unlisted. */
function listedLevel(vocab: VocabData, word: string): number | null {
  if (!Object.hasOwn(vocab, word)) return null;
  return Math.min(...vocab[word].map(([level]) => Number.parseInt(level, 10)));
}

/**
 * A token's level. A compound the tokenizer keeps whole but the HSK list does
 * not have (我的, 很多) is as hard as its hardest character.
 */
function tokenLevel(vocab: VocabData, token: string): number {
  const own = listedLevel(vocab, token);
  if (own !== null) return own;
  const chars = Array.from(token);
  if (chars.length < 2) return UNLISTED;
  return Math.max(...chars.map((c) => listedLevel(vocab, c) ?? UNLISTED));
}

type Key = [number, number, number, number, number, number];

function sortKey(data: RankData, word: string, target: number, ex: Example): Key {
  let above = 0;
  let hardest = 0;
  for (const token of segment(data.tokenizer, ex.hanzi).flat()) {
    if (token === word || NEUTRAL.test(token)) continue;
    const level = tokenLevel(data.vocab, token);
    if (level > target) above++;
    hardest = Math.max(hardest, level);
  }
  return [
    // A sentence nobody can read the meaning of is a last resort.
    ex.vi || ex.en ? 0 : 1,
    above,
    hardest,
    ex.machine ? 1 : 0,
    Array.from(ex.hanzi).length,
    ex.order,
  ];
}

function compare(a: Key, b: Key): number {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}

/**
 * The candidates easiest first: fewest other words above the word's own HSK
 * level, then the lowest hardest word, a hand-checked translation over a
 * machine one, the shorter sentence, and finally file order. Deterministic.
 * An unlisted word is ranked as if it were HSK 7-9.
 */
export function rankExamples(data: RankData, word: string, candidates: readonly Example[]): Example[] {
  const target = Math.min(listedLevel(data.vocab, word) ?? 7, 7);
  return candidates
    .map((ex) => ({ ex, key: sortKey(data, word, target, ex) }))
    .sort((a, b) => compare(a.key, b.key))
    .map(({ ex }) => ex);
}
