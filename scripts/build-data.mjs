// Convert raw data in assets/dictionary/ into compact JSON under public/data/.
// Run by hand after changing the source data: `pnpm build:data`.
// Output is committed; nothing here runs at deploy time or in the browser.

import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "assets/dictionary");
const OUT = join(ROOT, "public/data");

/**
 * Minimal CSV/TSV parser with Python csv-module quoting rules: a quote only
 * opens a quoted field at the very start of the field ("" escapes inside);
 * a quote anywhere else is literal text (e.g. `Từ "Chúa" …` in a TSV cell).
 */
function parseCsv(text, delimiter = ",") {
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

function readCsv(name, delimiter = ",") {
  const text = readFileSync(join(SRC, name), "utf-8").replace(/^\uFEFF/, "");
  const [header, ...rows] = parseCsv(text, delimiter);
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

/**
 * meanings.json: { word: definitions } for the Anki deck.
 *
 * Port of anki_desk.py's meaning_map (Simplified, then Traditional keys), with
 * two fixes: a Traditional key never overwrites another word's Simplified
 * entry (Python gave 著 the meaning of 着), and empty definitions are skipped
 * (pandas exported them as the text "nan").
 */
function buildMeanings() {
  const rows = readCsv("chinese_dict.csv");
  const meanings = {};
  for (const r of rows) {
    if (r.Simplified && r.Definitions.trim()) meanings[r.Simplified] = r.Definitions;
  }
  for (const r of rows) {
    if (r.Traditional && r.Definitions.trim() && !Object.hasOwn(meanings, r.Traditional)) {
      meanings[r.Traditional] = r.Definitions;
    }
  }
  return meanings;
}

// Rows idx 10001–12008 of sentences.tsv hold Hán Việt output in the
// Vietnamese column ("thông_quá lệ cú …"), not a translation. Such a cell is
// treated as empty so the deck falls back to the English translation.
const HANVIET_NOT_TRANSLATION = /\S_\S|\s。$/;

// normalize_new_word_tokens in anki_desk.py.
const NEW_WORD_SPLIT = /[\s,，。！？、;；:：]+/;

/**
 * sentences.json: { rows: [[hanzi, vi, en]], index: { token: rowIndex } }.
 * A token points to the first row (file order) listing it in NewWord, like
 * anki_desk.py's scan, which stops looking for a word after its first match.
 * Rows that are no word's first match are left out.
 */
function buildSentences() {
  const rows = [];
  const index = {};
  for (const r of readCsv("sentences.tsv", "\t")) {
    const fresh = (r.NewWord ?? "")
      .split(NEW_WORD_SPLIT)
      .map((t) => t.trim())
      .filter((t) => t && !Object.hasOwn(index, t));
    if (fresh.length === 0) continue;
    const id = rows.length;
    const vi = r.Vietnamese ?? "";
    rows.push([r.Hanzi ?? "", HANVIET_NOT_TRANSLATION.test(vi) ? "" : vi, r.English ?? ""]);
    for (const t of fresh) index[t] = id;
  }
  return { rows, index };
}

// pywubi's RE_HANS: only these characters get a Wubi code.
const WUBI_HAN = /^[\u3007\u4e00-\ufa29]$/;

/**
 * wubi.json: { char: code } from pywubi 0.3.0's wubi_86.json (MIT, see
 * assets/dictionary/LICENSE-pywubi.txt). Codes are listed longest first;
 * pywubi's wubi() returns the first one.
 */
function buildWubi() {
  const table = JSON.parse(readFileSync(join(SRC, "wubi_86.json"), "utf-8"));
  const out = {};
  for (const [char, codes] of Object.entries(table)) {
    if (WUBI_HAN.test(char) && codes.length) out[char] = codes[0];
  }
  return out;
}

// Stroke shards group 64 consecutive code points (codepoint >> 6), so a page
// fetches only the few small files its characters fall in. Must match
// shardKey() in lib/strokes/load.ts.
const STROKE_SHARD_BITS = 6;
const MAX_SHARD_BYTES = 1.5 * 1024 * 1024;

/**
 * strokes/<hex>.json: { char: { strokes, medians, radStrokes? } } from
 * hanzi-writer-data 2.0.1 (Arphic Public License, derived from Make Me a
 * Hanzi; see assets/dictionary/LICENSE-arphic.txt). Each entry is copied
 * unchanged, in the format Hanzi Writer's charDataLoader expects.
 */
function buildStrokes() {
  const dir = dirname(createRequire(import.meta.url).resolve("hanzi-writer-data/package.json"));
  const shards = new Map();
  for (const file of readdirSync(dir).sort()) {
    if (!file.endsWith(".json") || file === "package.json") continue;
    const char = file.slice(0, -".json".length);
    if (Array.from(char).length !== 1) throw new Error(`unexpected file: ${file}`);
    const data = JSON.parse(readFileSync(join(dir, file), "utf-8"));
    if (!Array.isArray(data.strokes) || !Array.isArray(data.medians)) {
      throw new Error(`bad stroke data: ${file}`);
    }
    const key = (char.codePointAt(0) >> STROKE_SHARD_BITS).toString(16);
    if (!shards.has(key)) shards.set(key, {});
    shards.get(key)[char] = data;
  }
  const outDir = join(OUT, "strokes");
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir);
  let chars = 0;
  let total = 0;
  let largest = 0;
  for (const [key, data] of shards) {
    const json = JSON.stringify(data);
    const bytes = Buffer.byteLength(json);
    if (bytes > MAX_SHARD_BYTES) throw new Error(`strokes/${key}.json is ${bytes} bytes`);
    writeFileSync(join(outDir, `${key}.json`), json);
    chars += Object.keys(data).length;
    total += bytes;
    largest = Math.max(largest, bytes);
  }
  console.log(
    `strokes/: ${chars} characters in ${shards.size} shards ` +
      `(${Math.round(total / 1024)} KB, largest ${Math.round(largest / 1024)} KB)`,
  );
}

function write(name, data, summary) {
  const json = JSON.stringify(data);
  writeFileSync(join(OUT, name), json);
  console.log(`${name}: ${summary} (${Math.round(Buffer.byteLength(json) / 1024)} KB)`);
}

const hanviet = buildHanviet();
write("hanviet.json", hanviet, `${Object.keys(hanviet).length} characters`);
const meanings = buildMeanings();
write("meanings.json", meanings, `${Object.keys(meanings).length} words`);
const wubi = buildWubi();
write("wubi.json", wubi, `${Object.keys(wubi).length} characters`);
const sentences = buildSentences();
write(
  "sentences.json",
  sentences,
  `${sentences.rows.length} sentences, ${Object.keys(sentences.index).length} words`,
);
buildStrokes();
