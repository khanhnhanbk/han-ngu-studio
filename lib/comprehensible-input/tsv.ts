export const TSV_FILENAME = "sentence_sorted.tsv";

export interface TsvRow {
  /** Original 0-based line index of the sentence (the script's `sentence["id"]`). */
  idx: number;
  sentence: string;
  /** Joined with "," when given as an array (Python `",".join(sorted(...))`). */
  newWords: string[] | string;
  unknownCount: number;
}

const HEADER = ["idx", "sentence", "new_words", "unknown_count"];

// pandas QUOTE_MINIMAL: quote only when the field has delimiter, quotechar or line break.
function escapeField(value: string): string {
  return /[\t"\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Same columns and order as the script's `pd.DataFrame(output_rows).to_csv(sep="\t", index=False)`. */
export function toTsv(rows: TsvRow[]): string {
  const lines = [HEADER.join("\t")];
  rows.forEach((row) => {
    const words = Array.isArray(row.newWords) ? row.newWords.join(",") : row.newWords;
    lines.push([row.idx, row.sentence, words, row.unknownCount].map((v) => escapeField(String(v))).join("\t"));
  });
  return "﻿" + lines.join("\n") + "\n";
}
