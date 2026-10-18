import type { VocabData } from "@/lib/vocab/lookup";

/** HSK 3.0 levels the sentence bank is split by. */
export const BANK_LEVELS = ["1", "2", "3", "4", "5", "6", "7-9"] as const;
export type BankLevel = (typeof BANK_LEVELS)[number];
export const BANK_COUNTS = [50, 100, 200] as const;

/** "7-9" counts as 7, after 6. */
const rank = (level: string) => Number.parseInt(level, 10);

/**
 * Up to `count` distinct sentences, shortest first (counted in characters,
 * not UTF-16 units), ties kept in bank order. Short sentences are the easiest
 * place to start an N+1 sequence.
 */
export function pickBankSentences(sentences: readonly string[], count: number): string[] {
  const unique = [...new Set(sentences.map((s) => s.trim()).filter(Boolean))];
  return unique
    .map((text, i) => ({ text, i, len: Array.from(text).length }))
    .sort((a, b) => a.len - b.len || a.i - b.i)
    .slice(0, count)
    .map((s) => s.text);
}

/** Every HSK word whose lowest level is below `level`, in list order. */
export function wordsBelow(vocab: VocabData, level: BankLevel): string[] {
  const limit = rank(level);
  return Object.keys(vocab).filter((w) => Math.min(...vocab[w].map(([l]) => rank(l))) < limit);
}
