import { lookupChar, toTone3, type HanvietData } from "@/lib/hanviet/lookup";
import { convertLine } from "@/lib/pinyin/convert";
import type { Tokenizer } from "@/lib/segment/tokenizer";

import type { Meanings, Sentences, WubiTable } from "./load";
import { wubiLine } from "./wubi";

/** Columns in anki_desk.py's order, so existing note types still line up. */
export const COLUMNS = [
  "word",
  "pinyin",
  "meaning",
  "sentence",
  "sentence_pinyin",
  "sentence_meaning",
  "wubi",
  "hanviet",
] as const;

export type Column = (typeof COLUMNS)[number];
export type DeckRow = Record<Column, string>;

export type DeckData = {
  tokenizer: Tokenizer;
  hanviet: HanvietData;
  meanings: Meanings;
  sentences: Sentences;
  wubi: WubiTable;
};

export const MAX_WORDS = 1000;

/** One word per line, trimmed, empty lines dropped; duplicates removed. */
export function parseWords(text: string): { words: string[]; duplicates: number } {
  const seen = new Set<string>();
  let duplicates = 0;
  for (const line of text.split("\n")) {
    const word = line.trim();
    if (!word) continue;
    if (seen.has(word)) duplicates++;
    else seen.add(word);
  }
  return { words: [...seen], duplicates };
}

/**
 * Hán Việt like anki_desk.py's get_hanviet_line: each character's readings
 * joined by "/", characters joined by spaces, characters with no reading
 * left out.
 */
function hanvietLine(data: DeckData, word: string): string {
  const nums = convertLine(data.tokenizer, word, { toneStyle: "number", spacing: "syllable" });
  const parts: string[] = [];
  for (const seg of nums.segments) {
    if (seg.kind !== "han") continue;
    seg.chars.forEach((ch, i) => {
      const readings = lookupChar(data.hanviet, ch, toTone3(seg.syllables[i]));
      if (readings.length) parts.push(readings.join("/"));
    });
  }
  return parts.join(" ");
}

/** Build one Anki row (port of batch_search_and_export, per word). */
export function buildRow(data: DeckData, word: string): DeckRow {
  const syllableOpts = { toneStyle: "mark", spacing: "syllable" } as const;
  const id = Object.hasOwn(data.sentences.index, word) ? data.sentences.index[word] : undefined;
  const [sentence, vi, en] = id === undefined ? ["", "", ""] : data.sentences.rows[id];

  return {
    word,
    // Syllables separated by spaces, as get_pinyin_line produced ("dà xué").
    pinyin: convertLine(data.tokenizer, word, syllableOpts).text,
    meaning: Object.hasOwn(data.meanings, word) ? data.meanings[word] : "",
    sentence,
    // Generated from the whole sentence (owner decision): the sheet's own
    // Pinyin column has errors.
    sentence_pinyin: sentence
      ? convertLine(data.tokenizer, sentence, { toneStyle: "mark", spacing: "word" }).text
      : "",
    // Vietnamese first (owner decision); Python preferred English.
    sentence_meaning: vi || en,
    wubi: wubiLine(data.wubi, word),
    hanviet: hanvietLine(data, word),
  };
}

export function buildDeck(data: DeckData, words: readonly string[]): DeckRow[] {
  return words.map((w) => buildRow(data, w));
}

/** Words with no meaning / no example sentence, for the "not found" box. */
export function missing(rows: readonly DeckRow[]) {
  return {
    meaning: rows.filter((r) => !r.meaning).map((r) => r.word),
    sentence: rows.filter((r) => !r.sentence).map((r) => r.word),
  };
}

/**
 * TSV for Anki. Tabs and line breaks inside a field become spaces so a row
 * stays one note. The optional header lines are read by Anki 2.1.55+.
 */
export function toTsv(rows: readonly DeckRow[], columns: readonly Column[], header: boolean): string {
  const clean = (s: string) => s.replace(/[\t\r\n]+/g, " ");
  const lines = rows.map((r) => columns.map((c) => clean(r[c])).join("\t"));
  if (header) {
    lines.unshift("#separator:tab", "#html:false", `#columns:${columns.join("\t")}`);
  }
  return lines.join("\n") + "\n";
}
