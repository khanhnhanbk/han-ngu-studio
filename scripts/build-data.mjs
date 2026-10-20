// Convert raw data in assets/dictionary/ into compact JSON under public/data/.
// Run by hand after changing the source data: `pnpm build:data`.
// Output is committed; nothing here runs at deploy time or in the browser.

import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

import * as cn2t from "opencc-js/cn2t";
import * as t2cn from "opencc-js/t2cn";
import { pinyin } from "pinyin-pro";

import { readCsvFrom } from "./lib/csv.mjs";
import { checkMnemonics } from "./lib/mnemonics.mjs";
import { normalizeSentence, readMachineTranslations, tatoebaRows } from "./lib/sentences.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "assets/dictionary");
const OUT = join(ROOT, "public/data");

const readCsv = (name, delimiter = ",") => readCsvFrom(SRC, name, delimiter);

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

// An old sheet row with English words in the sentence ("中国 popular 运动")
// is a generation error. Short Latin runs (T恤, IT, AI) are real Chinese.
const LATIN_WORD = /[A-Za-z]{3,}/;
// Bit flags in an example row.
const MACHINE_TRANSLATED = 1;
const MAX_EXAMPLE_SHARD_BYTES = 1024 * 1024;

/**
 * examples/<shard>.json: { rows: [[hanzi, vi, en, flags]], index: { word: rowIds } }
 * and examples/manifest.json: { shards: { name: level }, words: { word: shard } }.
 *
 * Every candidate sentence per word, from sentences.tsv (hand-checked
 * translations) and the Tatoeba file (CC BY 2.0 FR; translations by Google
 * Translate from translate-sentences.mjs, flagged MACHINE_TRANSLATED). The
 * browser ranks them (lib/examples/rank.ts); here they keep file order, old
 * sheet first. A sentence in both files keeps the hand-checked translation.
 * Words are sharded by their lowest HSK level (vocab.json), "other" for words
 * outside the list, and a shard over MAX_EXAMPLE_SHARD_BYTES is split.
 */
function buildExamples(vocab) {
  const sentences = new Map(); // hanzi → [hanzi, vi, en, flags]
  const byWord = new Map(); // word → Set(hanzi)
  const add = (word, hanzi) => {
    if (!byWord.has(word)) byWord.set(word, new Set());
    byWord.get(word).add(hanzi);
  };
  let skipped = 0;
  for (const r of readCsv("sentences.tsv", "\t")) {
    const hanzi = normalizeSentence(r.Hanzi ?? "");
    const words = (r.NewWord ?? "").split(NEW_WORD_SPLIT).map((t) => t.trim()).filter((t) => t && hanzi.includes(t));
    if (!hanzi || LATIN_WORD.test(hanzi) || words.length === 0) {
      skipped++;
      continue;
    }
    if (!sentences.has(hanzi)) {
      const vi = r.Vietnamese ?? "";
      sentences.set(hanzi, [hanzi, HANVIET_NOT_TRANSLATION.test(vi) ? "" : vi.trim(), (r.English ?? "").trim(), 0]);
    }
    for (const w of words) add(w, hanzi);
  }
  const mt = readMachineTranslations(SRC);
  let untranslated = 0;
  for (const r of tatoebaRows(readCsv)) {
    if (!sentences.has(r.hanzi)) {
      const t = mt.get(r.hanzi);
      if (!t) untranslated++;
      sentences.set(r.hanzi, t ? [r.hanzi, t.vi, t.en, MACHINE_TRANSLATED] : [r.hanzi, "", "", 0]);
    }
    add(r.word, r.hanzi);
  }

  // "7-9" parses as 7, after 6.
  const levelOf = (word) =>
    Object.hasOwn(vocab, word)
      ? vocab[word].reduce((a, [l]) => (Number.parseInt(l, 10) < Number.parseInt(a, 10) ? l : a), vocab[word][0][0])
      : "other";
  const groups = new Map();
  for (const word of byWord.keys()) {
    const level = levelOf(word);
    if (!groups.has(level)) groups.set(level, []);
    groups.get(level).push(word);
  }

  const outDir = join(OUT, "examples");
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir);
  const manifest = { shards: {}, words: {} };
  const sizes = [];
  const levels = [...VOCAB_LEVELS, "other"].filter((l) => groups.has(l));
  for (const level of levels) {
    const parts = [];
    let part = null;
    for (const word of groups.get(level)) {
      if (!part) part = { rows: [], index: {}, ids: new Map(), bytes: 0 };
      part.index[word] = [...byWord.get(word)].map((hanzi) => {
        if (!part.ids.has(hanzi)) {
          part.ids.set(hanzi, part.rows.length);
          part.rows.push(sentences.get(hanzi));
          part.bytes += Buffer.byteLength(JSON.stringify(sentences.get(hanzi)));
        }
        return part.ids.get(hanzi);
      });
      if (part.bytes > MAX_EXAMPLE_SHARD_BYTES * 0.9) {
        parts.push(part);
        part = null;
      }
    }
    if (part) parts.push(part);
    for (const [i, p] of parts.entries()) {
      const name = parts.length === 1 ? level : `${level}.${i}`;
      const json = JSON.stringify({ rows: p.rows, index: p.index });
      const bytes = Buffer.byteLength(json);
      if (bytes > MAX_EXAMPLE_SHARD_BYTES) throw new Error(`examples/${name}.json is ${bytes} bytes`);
      writeFileSync(join(outDir, `${name}.json`), json);
      manifest.shards[name] = level;
      for (const word of Object.keys(p.index)) manifest.words[word] = name;
      sizes.push(`${name} ${Math.round(bytes / 1024)} KB`);
    }
  }
  writeFileSync(join(outDir, "manifest.json"), JSON.stringify(manifest));
  console.log(
    `examples/: ${sentences.size} sentences for ${byWord.size} words (${sizes.join(", ")}); ` +
      `${untranslated} Tatoeba sentences not translated yet, ${skipped} sheet rows skipped`,
  );
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

// Stroke shards group 8 consecutive code points (codepoint >> 3), about 11 KB
// each, so a page fetches little more than its own characters (64-point
// shards cost ~1.9 MB for 20 characters of ordinary text). Must match
// shardKey() in lib/strokes/load.ts.
const STROKE_SHARD_BITS = 3;
const MAX_SHARD_BYTES = 1.5 * 1024 * 1024;

/**
 * strokes/<hex>.json: { char: { strokes, medians, radStrokes?, matches? } }
 * from hanzi-writer-data 2.0.1 (Arphic Public License, derived from Make Me a
 * Hanzi; see assets/dictionary/LICENSE-arphic.txt). Each entry is copied
 * unchanged, in the format Hanzi Writer's charDataLoader expects, plus
 * `matches` from Make Me a Hanzi's dictionary (stroke → component path) when
 * its stroke count agrees with the stroke data.
 */
function buildStrokes(mmah) {
  const dir = dirname(createRequire(import.meta.url).resolve("hanzi-writer-data/package.json"));
  const shards = new Map();
  let mismatched = 0;
  for (const file of readdirSync(dir).sort()) {
    if (!file.endsWith(".json") || file === "package.json") continue;
    const char = file.slice(0, -".json".length);
    if (Array.from(char).length !== 1) throw new Error(`unexpected file: ${file}`);
    const data = JSON.parse(readFileSync(join(dir, file), "utf-8"));
    if (!Array.isArray(data.strokes) || !Array.isArray(data.medians)) {
      throw new Error(`bad stroke data: ${file}`);
    }
    const matches = mmah.get(char)?.matches;
    if (matches?.length === data.strokes.length) data.matches = matches;
    else if (matches) mismatched++;
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
      `(${Math.round(total / 1024)} KB, largest ${Math.round(largest / 1024)} KB); ` +
      `component matches skipped for ${mismatched} (stroke count differs)`,
  );
}

/** Make Me a Hanzi dictionary.txt (LGPL-3.0+): one JSON object per line. */
function readMakeMeAHanzi() {
  const out = new Map();
  const lines = readFileSync(join(SRC, "makemeahanzi-dictionary.txt"), "utf-8").split("\n");
  for (const line of lines) {
    if (!line.trim()) continue;
    const entry = JSON.parse(line);
    out.set(entry.character, entry);
  }
  return out;
}

// IDS operators, keep in sync with ARITY in lib/decompose/ids.ts.
const IDS_ARITY = { "⿰": 2, "⿱": 2, "⿲": 3, "⿳": 3, "⿴": 2, "⿵": 2, "⿶": 2, "⿷": 2, "⿸": 2, "⿹": 2, "⿺": 2, "⿻": 2 };

/** Throws unless `ids` is one well-formed IDS (same rules as parseIds). */
function checkIds(ids) {
  const glyphs = Array.from(ids);
  let need = 1;
  for (const g of glyphs) {
    if (need === 0) throw new Error(`trailing text in IDS ${ids}`);
    need += (IDS_ARITY[g] ?? 0) - 1;
  }
  if (need !== 0) throw new Error(`incomplete IDS ${ids}`);
}

const ETYMOLOGY_CODE = { pictophonetic: "p", ideographic: "i", pictographic: "g" };
const MAX_DATA_BYTES = 1.5 * 1024 * 1024;

/**
 * decompose.json: { char: [ids, radical, type?, semantic?, phonetic?, hint?] }
 * from Make Me a Hanzi (LGPL-3.0+, assets/dictionary/LICENSE-makemeahanzi-lgpl.txt).
 * type: p = pictophonetic (hình thanh), i = ideographic (hội ý),
 * g = pictographic (tượng hình), "" = unknown. Trailing empty fields are dropped.
 * Keys are ordered by frequency (char_hanviet.csv, most frequent first, then
 * the rest in file order), so the page lists component families in that
 * order without shipping a separate frequency table.
 */
function buildDecompose(mmah) {
  const freq = new Map();
  for (const row of readCsv("char_hanviet.csv")) {
    const char = row.simp_char.trim();
    const f = Number(row.frequency) || 0;
    if (Array.from(char).length === 1 && f >= (freq.get(char) ?? -1)) freq.set(char, f);
  }
  const order = [...mmah.keys()];
  const pos = new Map(order.map((c, i) => [c, i]));
  order.sort((a, b) => {
    const fa = freq.get(a) ?? -1;
    const fb = freq.get(b) ?? -1;
    return fb - fa || pos.get(a) - pos.get(b);
  });

  const out = {};
  let unknown = 0;
  for (const char of order) {
    const { decomposition: ids, radical, etymology } = mmah.get(char);
    checkIds(ids);
    for (const g of Array.from(ids)) {
      if (!IDS_ARITY[g] && g !== "？" && !mmah.has(g)) throw new Error(`${char}: unknown component ${g}`);
    }
    if (ids.includes("？")) unknown++;
    const row = [
      ids,
      radical ?? "",
      ETYMOLOGY_CODE[etymology?.type] ?? "",
      etymology?.semantic ?? "",
      etymology?.phonetic ?? "",
      etymology?.hint ?? "",
    ];
    while (row.length > 2 && row[row.length - 1] === "") row.pop();
    out[char] = row;
  }
  const covered = [...freq.keys()].filter((c) => mmah.has(c)).length;
  console.log(
    `decompose: ${unknown} entries with unknown (？) parts; ` +
      `covers ${covered} of ${freq.size} characters in char_hanviet.csv`,
  );
  return out;
}

/**
 * Hán Việt for a lone character, chosen like the Hán Việt tool does
 * (lookupChar in lib/hanviet/lookup.ts): the reading for its pinyin-pro
 * Pinyin, else the "*" entry, else the first entry; readings joined by "/".
 */
function hanvietOfChar(hanviet, char) {
  const entries = hanviet[char];
  if (!entries) return "";
  const tone3 = pinyin(char, { toneType: "num" }).replace(/ü/g, "u:").replace(/0$/, "5");
  const hit = entries.find(([p]) => p === tone3) ?? entries.find(([p]) => p === "*") ?? entries[0];
  return hit[1].join("/");
}

// Example characters shown per radical, most frequent first.
const RADICAL_EXAMPLES = 12;

/**
 * radicals.json: the 214 Kangxi radicals from radicals.tsv (names and
 * meanings curated by hand), each with up to 12 frequent characters filed
 * under it, and all of them in `members` for search. A character's radical
 * is the first value of its Unihan kRSUnicode ("149'.7": radical 149,
 * simplified form, 7 more strokes).
 */
function buildRadicals(hanviet) {
  const radicals = readCsv("radicals.tsv", "\t").map((r) => ({
    no: Number(r.no),
    radical: r.radical,
    variants: r.variants ? r.variants.split(" ") : [],
    strokes: Number(r.strokes),
    name: r.name,
    meaning: r.meaning,
    pinyin: r.pinyin,
    count: 0,
    chars: [],
    members: "",
    countTrad: 0,
    charsTrad: [],
    membersTrad: "",
  }));
  radicals.forEach((r, i) => {
    const kangxi = String.fromCodePoint(0x2f00 + i).normalize("NFKC");
    if (r.no !== i + 1 || r.radical !== kangxi || !r.name || !r.meaning || !r.pinyin) {
      throw new Error(`radicals.tsv row ${i + 1} is wrong: ${JSON.stringify(r)}`);
    }
  });
  if (radicals.length !== 214) throw new Error(`radicals.tsv has ${radicals.length} rows`);

  // "#" lines are the file's source note; the first other line is the header.
  const radicalOf = new Map();
  const lines = readFileSync(join(SRC, "unihan_radicals.tsv"), "utf-8").split("\n");
  for (const line of lines.filter((l) => l && !l.startsWith("#")).slice(1)) {
    const [char, rs] = line.split("\t");
    radicalOf.set(char, Number.parseInt(rs.split(" ")[0], 10));
  }

  // Simplified characters by frequency (highest of their rows).
  const freq = new Map();
  for (const row of readCsv("char_hanviet.csv")) {
    const char = row.simp_char.trim();
    const f = Number(row.frequency) || 0;
    if (Array.from(char).length === 1 && f >= (freq.get(char) ?? -1)) freq.set(char, f);
  }
  const byFreq = [...freq.keys()].sort((a, b) => freq.get(b) - freq.get(a) || a.codePointAt(0) - b.codePointAt(0));

  const forms = radicals.map((r) => new Set([r.radical, ...r.variants]));
  for (const char of byFreq) {
    const no = radicalOf.get(char);
    if (!no) continue;
    const r = radicals[no - 1];
    if (forms[no - 1].has(char)) continue;
    r.count++;
    r.members += char;
    if (r.chars.length < RADICAL_EXAMPLES) r.chars.push([char, hanvietOfChar(hanviet, char)]);
  }

  // Phồn thể list (Taiwan characters): each Simplified character's OpenCC
  // Taiwan form, plus the file's trad_char when it is a standard Taiwan form
  // of it (头发 → 髮; variants such as 麽 are left out) or the character
  // itself, if Taiwan text uses it too: it survives OpenCC in some word of
  // the word list (皇后 keeps 后, 公里 keeps 里, but 从 always becomes 從). A Traditional character is
  // filed under its own radical (頭 → 181 頁) with the frequency and Hán
  // Việt of its most frequent Simplified source.
  const toTw = cn2t.Converter({ from: "cn", to: "tw" });
  const toCn = t2cn.Converter({ from: "tw", to: "cn" });
  const twChars = new Set();
  for (const line of readFileSync(join(ROOT, "public/data/word_list.txt"), "utf-8").split("\n")) {
    const word = line.split(/\s/)[0];
    if (word) for (const ch of toTw(word)) twChars.add(ch);
  }
  const tradSource = new Map();
  for (const row of readCsv("char_hanviet.csv")) {
    const simp = row.simp_char.trim();
    const trad = row.trad_char.trim();
    if (Array.from(simp).length !== 1) continue;
    const f = Number(row.frequency) || 0;
    const forms = new Set([toTw(simp)]);
    if (Array.from(trad).length === 1 && (trad === simp ? twChars.has(trad) : toTw(trad) === trad && toCn(trad) === simp)) forms.add(trad);
    for (const t of forms) {
      if (Array.from(t).length !== 1) continue;
      const prev = tradSource.get(t);
      if (!prev || f > prev.f) tradSource.set(t, { simp, f });
    }
  }
  const tradByFreq = [...tradSource.keys()].sort(
    (a, b) => tradSource.get(b).f - tradSource.get(a).f || a.codePointAt(0) - b.codePointAt(0),
  );
  for (const char of tradByFreq) {
    const no = radicalOf.get(char);
    if (!no) continue;
    const r = radicals[no - 1];
    if (forms[no - 1].has(char)) continue;
    r.countTrad++;
    r.membersTrad += char;
    if (r.charsTrad.length < RADICAL_EXAMPLES) r.charsTrad.push([char, hanvietOfChar(hanviet, tradSource.get(char).simp)]);
  }
  return radicals;
}

const VOCAB_LEVELS = new Set(["1", "2", "3", "4", "5", "6", "7-9"]);

/**
 * vocab.json: { word: [[level, pinyin, meaning], …] } from vocab_hsk30.csv
 * (scripts/build-vocab-source.mjs: HSK 3.0 levels and Pinyin from ivankra/hsk30,
 * MIT; Vietnamese meanings from CVDICT, CC BY-SA 4.0; the meaning is empty for
 * the few words CVDICT lacks). Entries keep file order, lowest level first. A
 * word with an optional 儿 ("好玩{儿}") is stored under both forms, each only
 * when no row already has that exact word.
 */
function buildVocab() {
  const rows = readCsv("vocab_hsk30.csv");
  const out = {};
  const add = (word, entry) => {
    if (!Object.hasOwn(out, word)) out[word] = [];
    out[word].push(entry);
  };
  const optional = [];
  for (const [i, r] of rows.entries()) {
    const word = r.hanzi.trim();
    const entry = [r.level.trim(), r.pinyin.trim(), r.meaning.trim()];
    if (!VOCAB_LEVELS.has(entry[0]) || !word || !entry[1]) {
      throw new Error(`vocab_hsk30.csv row ${i + 2} is wrong: ${JSON.stringify(r)}`);
    }
    if (word.includes("{")) optional.push([word, entry]);
    else add(word, entry);
  }
  const exact = new Set(Object.keys(out));
  for (const [word, entry] of optional) {
    if (!/^[^{}]+\{儿\}$/u.test(word)) throw new Error(`unexpected optional part: ${word}`);
    for (const form of [word.replace("{儿}", ""), word.replace("{儿}", "儿")]) {
      if (!exact.has(form)) add(form, entry);
    }
  }
  return out;
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
const mmah = readMakeMeAHanzi();
buildStrokes(mmah);
const decompose = buildDecompose(mmah);
write("decompose.json", decompose, `${Object.keys(decompose).length} characters`);
if (Buffer.byteLength(JSON.stringify(decompose)) > MAX_DATA_BYTES) throw new Error("decompose.json is too large");

/**
 * mnemonics.json: { char: [story, reviewed 0|1] }, the suggested memory
 * stories shown in Chiết tự (our own content, drafted with AI help and
 * reviewed by hand). Rows with an empty story are left out.
 */
function buildMnemonics() {
  const rows = readCsv("mnemonics.tsv", "\t");
  const errors = checkMnemonics(rows, decompose);
  if (errors.length) throw new Error(errors.join("\n"));
  const out = {};
  let reviewed = 0;
  for (const { char, story, status } of rows) {
    if (!story) continue;
    out[char] = [story, status === "reviewed" ? 1 : 0];
    if (status === "reviewed") reviewed++;
  }
  return { out, reviewed };
}
const mnemonics = buildMnemonics();
write(
  "mnemonics.json",
  mnemonics.out,
  `${Object.keys(mnemonics.out).length} stories, ${mnemonics.reviewed} reviewed`,
);
const radicals = buildRadicals(hanviet);
write("radicals.json", radicals, `${radicals.length} radicals`);
const vocab = buildVocab();
write("vocab.json", vocab, `${Object.keys(vocab).length} words`);
buildExamples(vocab);

/**
 * SQLite (sql.js, pinned) for the Anki .apkg export, self-hosted next to the
 * data so it is never fetched from a CDN and is counted in sizes.json.
 */
function copySqlWasm() {
  const src = join(ROOT, "node_modules/sql.js/dist/sql-wasm.wasm");
  mkdirSync(join(OUT, "vendor"), { recursive: true });
  writeFileSync(join(OUT, "vendor/sql-wasm.wasm"), readFileSync(src));
  console.log(`vendor/sql-wasm.wasm: sql.js (${Math.round(statSync(src).size / 1024)} KB)`);
}
copySqlWasm();

/**
 * sizes.json: { "/data/…": gzip bytes } for every data file, plus the OpenCC
 * chunks, so lib/data/budget.ts can tell how much an action would download
 * before it starts. Written last, after every other file.
 */
function buildSizes() {
  const sizes = {};
  const walk = (dir, prefix) => {
    for (const name of readdirSync(dir).sort()) {
      const path = join(dir, name);
      // Audio is fetched one small shard per click and never gated: keep it out.
      if (`${prefix}${name}` === "/data/audio") continue;
      if (statSync(path).isDirectory()) walk(path, `${prefix}${name}/`);
      else if (`${prefix}${name}` !== "/data/sizes.json") sizes[`${prefix}${name}`] = gzipSync(readFileSync(path)).length;
    }
  };
  walk(OUT, "/data/");
  // The bundles lib/script/convert.ts imports (the package hides package.json).
  for (const name of ["t2cn", "cn2t"]) {
    const file = join(ROOT, "node_modules/opencc-js/dist/esm", `${name}.js`);
    sizes[`opencc:${name}`] = gzipSync(readFileSync(file)).length;
  }
  return sizes;
}

const sizes = buildSizes();
write("sizes.json", sizes, `${Object.keys(sizes).length} files`);
