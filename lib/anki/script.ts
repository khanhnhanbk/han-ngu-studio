import type { ScriptConverter } from "@/lib/script/convert";

import type { DeckRow } from "./buildDeck";
import type { WubiTable } from "./load";
import { wubiLine } from "./wubi";

/**
 * Words for the deck: looked up by their Simplified form (every data file is
 * keyed by Simplified). Converted one word at a time, then de-duplicated, so
 * 學習 and 学习 make one card. In Giản thể mode the words are unchanged.
 */
export function simpWords(conv: ScriptConverter, words: readonly string[]): string[] {
  return [...new Set(words.map((w) => conv.toSimp(w)))];
}

/**
 * Show a row built from Simplified data in the chosen script: the word and
 * example sentences are converted, and Wubi is coded from the shown
 * characters (Traditional characters have their own codes). Readings,
 * meanings and HSK data are unchanged. Giản thể mode returns the row as is.
 */
export function showRow(row: DeckRow, conv: ScriptConverter, wubi: WubiTable): DeckRow {
  if (conv.script === "simp") return row;
  const word = conv.toShown(row.word);
  return { ...row, word, sentence: conv.toShown(row.sentence), wubi: wubiLine(wubi, word) };
}
