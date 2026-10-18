// CSV/TSV reading shared by the data scripts.

import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Minimal CSV/TSV parser with Python csv-module quoting rules: a quote only
 * opens a quoted field at the very start of the field ("" escapes inside);
 * a quote anywhere else is literal text (e.g. `Từ "Chúa" …` in a TSV cell).
 */
export function parseCsv(text, delimiter = ",") {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  let fieldHadQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"' && field === "" && !fieldHadQuotes) {
      quoted = true;
      fieldHadQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = "";
      fieldHadQuotes = false;
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      fieldHadQuotes = false;
    } else {
      field += ch;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((f) => f !== ""));
}

export function readCsvFrom(dir, name, delimiter = ",") {
  const text = readFileSync(join(dir, name), "utf-8").replace(/^\uFEFF/, "");
  const [header, ...rows] = parseCsv(text, delimiter);
  return rows.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}
