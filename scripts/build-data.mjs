// Convert raw data in assets/dictionary/ into compact JSON under public/data/.
// Run by hand after changing the source data: `pnpm build:data`.
// Output is committed; nothing here runs at deploy time or in the browser.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "assets/dictionary");
const OUT = join(ROOT, "public/data");

/** Minimal RFC 4180 CSV parser (quoted fields, "" escapes, CRLF). */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
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
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
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

function readCsv(name) {
  const text = readFileSync(join(SRC, name), "utf-8").replace(/^﻿/, "");
  const [header, ...rows] = parseCsv(text);
  return rows.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}

/**
 * Parse a Python list literal such as "['lưỡng', 'lượng']" (never eval).
 * Mirrors hanviet.py: "[...]" is a list, anything else is a single reading.
 */
function parseReadings(text) {
  if (!(text.startsWith("[") && text.endsWith("]"))) return [text];
  const items = JSON.parse(text.replace(/'/g, '"'));
  if (!Array.isArray(items)) throw new Error(`not a list: ${text}`);
  return items.map(String);
}

/**
 * hanviet.json: { char: [[tone3, [readings…]], …] }
 *
 * Port of the hanviet_map build in hanviet.py, keyed by simp_char only.
 * Entries are an array (not an object) to keep first-seen order, which the
 * lookup's last fallback depends on, like a Python dict.
 *
 * One deliberate change (owner's decision): when several rows share the
 * same (char, pinyin), one per traditional variant, their readings are
 * merged in row order without repeats. Python let the later row overwrite,
 * which loses the common reading in 16 cases (当 dang1 → "đang" instead
 * of "đương/đang").
 */
function buildHanviet() {
  const map = new Map();
  for (const row of readCsv("char_hanviet.csv")) {
    const char = row.simp_char.trim();
    if (!char) continue;
    const tone3 = row.pinyin.trim();
    const raw = row.hanviet.trim();
    if (!raw) continue;
    const readings = parseReadings(raw)
      .map((r) => r.trim())
      .filter(Boolean);
    if (readings.length === 0) continue;

    if (!map.has(char)) map.set(char, new Map());
    const entries = map.get(char);
    const merged = entries.get(tone3) ?? [];
    for (const r of readings) if (!merged.includes(r)) merged.push(r);
    entries.set(tone3, merged);
  }
  const out = {};
  for (const [char, entries] of map) out[char] = [...entries];
  return out;
}

const hanviet = buildHanviet();
writeFileSync(join(OUT, "hanviet.json"), JSON.stringify(hanviet));
console.log(`hanviet.json: ${Object.keys(hanviet).length} characters`);
