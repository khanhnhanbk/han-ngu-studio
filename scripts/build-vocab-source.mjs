#!/usr/bin/env node
/**
 * pnpm build:vocab-source — make assets/dictionary/vocab_hsk30.csv, the
 * source of public/data/vocab.json (HSK 3.0 level, Pinyin, Vietnamese meaning).
 *
 * Sources, both at a pinned commit (downloaded into node_modules/.cache):
 *   - ivankra/hsk30 hsk30-expanded.csv (MIT, assets/dictionary/LICENSE-hsk30.txt):
 *     the HSK 3.0 word list of the PRC Ministry of Education (GF 0025-2021),
 *     with levels, Pinyin and the matching CC-CEDICT entry keys.
 *   - ph0ngp/CVDICT CVDICT.u8 (CC BY-SA 4.0, assets/dictionary/LICENSE-cvdict.txt):
 *     Vietnamese translation of CC-CEDICT by Phong Phan (mostly machine-translated
 *     with a fine-tuned model, then checked by hand).
 *
 * Also writes assets/dictionary/cvdict.tsv, the whole of CVDICT cleaned the
 * same way (scripts/lib/cvdict.mjs), for the word lookup (public/data/cvdict/).
 *
 * Each HSK word takes the CVDICT senses of its CC-CEDICT entries (classifier
 * notes dropped, "variant of X" senses resolved to X, at most MAX_SENSES per
 * entry). A word with no CVDICT entry keeps its level with an empty meaning.
 * Erhua words are written "好玩{儿}" so both forms are found. `pos` is the
 * list's part of speech ("V/N"; merged when a word is listed twice at one
 * level), `classifiers` the CVDICT measure words ("门 mén|个 gè|位 wèi").
 * Run once; the output is committed. Then run `pnpm build:data`.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { readCsvFrom } from "./lib/csv.mjs";
import { cvdictRows, readCvdict, sensesOf } from "./lib/cvdict.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CACHE = join(ROOT, "node_modules/.cache/vocab-source");
const OUT = join(ROOT, "assets/dictionary/vocab_hsk30.csv");
const OUT_CVDICT = join(ROOT, "assets/dictionary/cvdict.tsv");
const HSK30 = "https://raw.githubusercontent.com/ivankra/hsk30/4ff9e3915ce87baaecd7ebe263085573a4ea3192/hsk30-expanded.csv";
const CVDICT = "https://raw.githubusercontent.com/ph0ngp/CVDICT/c379d909e308343a247e51619f7839a2060a271c/CVDICT.u8";
const MAX_SENSES = 3;

/** Download `url` into the cache once. */
async function fetchOnce(url, name) {
  const path = join(CACHE, name);
  if (!existsSync(path)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    mkdirSync(CACHE, { recursive: true });
    writeFileSync(path, Buffer.from(await res.arrayBuffer()));
  }
}

const csvField = (s) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

await fetchOnce(CVDICT, "CVDICT.u8");
await fetchOnce(HSK30, "hsk30-expanded.csv");
const cvdict = readCvdict(readFileSync(join(CACHE, "CVDICT.u8"), "utf-8"));
const rows = readCsvFrom(CACHE, "hsk30-expanded.csv");
const seen = new Map();
const out = [];
let missing = 0;
const pushNew = (list, items) => {
  for (const x of items) if (x && !list.includes(x)) list.push(x);
};
for (const r of rows) {
  // Example words for an affix (子 → 桌子) are not on the list themselves.
  if (r.Example) continue;
  // "dì-èr" → "dì èr": lib/vocab compares Pinyin without spaces.
  const pinyin = r.Pinyin.replace(/-/g, " ").trim();
  const key = `${r.Level}\t${r.Simplified}\t${pinyin}`;
  const pos = r.POS.split("/").map((p) => p.trim());
  // 省 shěng is listed at level 2 as N and again as V: one row, POS "N/V".
  if (seen.has(key)) {
    pushNew(seen.get(key).pos, pos);
    continue;
  }
  const keys = r.CEDICT.split("/").filter(Boolean);
  const senses = [];
  const classifiers = [];
  for (const k of keys) {
    pushNew(senses, sensesOf(cvdict, k).slice(0, MAX_SENSES));
    pushNew(classifiers, cvdict.classifiers.get(k) ?? []);
  }
  if (!senses.length) missing++;
  // An erhua word (好玩儿 hǎowánr) is also written without 儿 in most texts:
  // "好玩{儿}" makes build-data store both forms (unless 好玩 has its own row).
  const erhua = r.Simplified.endsWith("儿") && keys.length > 0 && keys.every((k) => k.endsWith(" r5]"));
  const hanzi = erhua ? `${r.Simplified.slice(0, -1)}{儿}` : r.Simplified;
  const row = { cells: [r.Level, hanzi, pinyin, senses.join("; ")], pos: [], classifiers };
  pushNew(row.pos, pos);
  seen.set(key, row);
  out.push(row);
}
const lines = ["level,hanzi,pinyin,meaning,pos,classifiers"];
for (const { cells, pos, classifiers } of out) {
  lines.push([...cells, pos.join("/"), classifiers.join("|")].map(csvField).join(","));
}
writeFileSync(OUT, `${lines.join("\n")}\n`);
const full = cvdictRows(cvdict);
writeFileSync(OUT_CVDICT, `simp\ttrad\tpinyin\tsenses\tclassifiers\n${full.map((r) => r.join("\t")).join("\n")}\n`);
console.log(`cvdict.tsv: ${full.length} entries`);
console.log(`vocab_hsk30.csv: ${lines.length - 1} words, ${missing} without a CVDICT meaning`);
