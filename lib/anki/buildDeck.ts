import { rankExamples } from "@/lib/examples/rank";
import type { ExampleBank } from "@/lib/examples/types";
import { lookupChar, toTone3, type HanvietData } from "@/lib/hanviet/lookup";
import { convertLine } from "@/lib/pinyin/convert";
import type { Tokenizer } from "@/lib/segment/tokenizer";
import { vocabFor, type VocabData } from "@/lib/vocab/lookup";

import type { Meanings, WubiTable } from "./load";
import { wubiLine } from "./wubi";

/**
 * Columns in anki_desk.py's order, so existing note types still line up.
 * The HSK columns come last for the same reason.
 */
export const COLUMNS = [
  "word",
  "pinyin",
  "meaning",
  "sentence",
  "sentence_pinyin",
  "sentence_meaning",
  "wubi",
  "hanviet",
  "hsk_level",
  "meaning_vi",
] as const;

export type Column = (typeof COLUMNS)[number];
export type DeckRow = Record<Column, string> & {
  /** The example's translation is machine output (shown as a tag, not exported). */
  machineTranslated: boolean;
};

export type DeckData = {
  tokenizer: Tokenizer;
  hanviet: HanvietData;
  meanings: Meanings;
  /** Candidate example sentences per word (lib/examples). */
  examples: ExampleBank;
  wubi: WubiTable;
  vocab: VocabData;
};

export const MAX_WORDS = 1000;

/** How many example sentences a card can carry. */
export const EXAMPLE_COUNTS = [1, 2, 3] as const;
export type ExampleCount = (typeof EXAMPLE_COUNTS)[number];

/** Several examples share one field, one per line (Anki renders the HTML). */
export const EXAMPLE_SEPARATOR = "<br>";

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
export function hanvietLine(data: Pick<DeckData, "tokenizer" | "hanviet">, word: string): string {
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

/**
 * Build one Anki row (port of batch_search_and_export, per word). The example
 * is the easiest of the word's candidates (lib/examples/rank.ts), not the
 * first in file order as in anki_desk.py (owner decision, phase 10).
 */
export function buildRow(data: DeckData, word: string, exampleCount: ExampleCount = 1): DeckRow {
  const syllableOpts = { toneStyle: "mark", spacing: "syllable" } as const;
  const candidates = Object.hasOwn(data.examples, word) ? data.examples[word] : [];
  const picked = rankExamples(data, word, candidates).slice(0, exampleCount);
  const join = (f: (ex: (typeof picked)[number]) => string) => picked.map(f).join(EXAMPLE_SEPARATOR);
  // Syllables separated by spaces, as get_pinyin_line produced ("dà xué").
  const pinyin = convertLine(data.tokenizer, word, syllableOpts).text;
  // The word's own reading picks the HSK entry (好 hǎo, not hào).
  const hsk = vocabFor(data.vocab, word, pinyin);

  return {
    word,
    pinyin,
    meaning: Object.hasOwn(data.meanings, word) ? data.meanings[word] : "",
    sentence: join((ex) => ex.hanzi),
    // Generated from the whole sentence (owner decision): the sheet's own
    // Pinyin column has errors, and the Tatoeba file has none.
    sentence_pinyin: join((ex) => convertLine(data.tokenizer, ex.hanzi, { toneStyle: "mark", spacing: "word" }).text),
    // Vietnamese first (owner decision); Python preferred English.
    sentence_meaning: join((ex) => ex.vi || ex.en),
    wubi: wubiLine(data.wubi, word),
    hanviet: hanvietLine(data, word),
    hsk_level: hsk?.level ?? "",
    meaning_vi: hsk?.meaning ?? "",
    machineTranslated: picked.some((ex) => ex.machine),
  };
}

export function buildDeck(data: DeckData, words: readonly string[], exampleCount: ExampleCount = 1): DeckRow[] {
  return words.map((w) => buildRow(data, w, exampleCount));
}

/** Words with no meaning / no example sentence, for the "not found" box. */
export function missing(rows: readonly DeckRow[]) {
  return {
    meaning: rows.filter((r) => !r.meaning).map((r) => r.word),
    sentence: rows.filter((r) => !r.sentence).map((r) => r.word),
    vocab: rows.filter((r) => !r.hsk_level).map((r) => r.word),
  };
}

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * TSV for Anki. Tabs and line breaks inside a field become spaces so a row
 * stays one note. The optional header lines are read by Anki 2.1.55+.
 * With several examples per card the fields are HTML, so EXAMPLE_SEPARATOR
 * becomes a line break and any other "<", ">" or "&" is escaped.
 */
export function toTsv(
  rows: readonly DeckRow[],
  columns: readonly Column[],
  header: boolean,
  html = false,
): string {
  const clean = (s: string) => {
    const flat = s.replace(/[\t\r\n]+/g, " ");
    return html ? flat.split(EXAMPLE_SEPARATOR).map(escapeHtml).join(EXAMPLE_SEPARATOR) : flat;
  };
  const lines = rows.map((r) => columns.map((c) => clean(r[c])).join("\t"));
  if (header) {
    lines.unshift("#separator:tab", `#html:${html}`, `#columns:${columns.join("\t")}`);
  }
  return lines.join("\n") + "\n";
}
