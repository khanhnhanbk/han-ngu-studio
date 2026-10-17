export const TSV_FILENAME = "sentence_sorted.tsv";

export interface TsvRow {
  sentence: string;
  /** Joined with a single space when given as an array. */
  newWords: string[] | string;
  unknownCount: number;
}

const HEADER = ["idx", "sentence", "new_words", "unknown_count"];

// pandas QUOTE_MINIMAL: quote only when the field has delimiter, quotechar or line break.
function escapeField(value: string): string {
  return /[\t"\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** idx is derived: the 0-based position in the list (pandas default index). */
export function toTsv(rows: TsvRow[]): string {
  const lines = [HEADER.join("\t")];
  rows.forEach((row, i) => {
    const words = Array.isArray(row.newWords) ? row.newWords.join(" ") : row.newWords;
    lines.push([i, row.sentence, words, row.unknownCount].map((v) => escapeField(String(v))).join("\t"));
  });
  return "﻿" + lines.join("\n") + "\n";
}
