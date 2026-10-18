// Shared by build-data.mjs and translate-sentences.mjs, so a sentence has the
// same text (and therefore the same translation key) in both.

import { readFileSync } from "node:fs";
import { join } from "node:path";

// CJK ideographs, full-width punctuation and CJK quotes: an ASCII mark next to
// one of these is Chinese punctuation typed on a Latin keyboard.
const WIDE = "\\u3000-\\u303f\\u3400-\\u9fff\\uf900-\\ufaff\\uff00-\\uffef“”‘’";
const WIDE_RE = new RegExp(`[${WIDE}]`, "u");

const FULL = { ",": "，", "?": "？", "!": "！", ":": "：", ";": "；", "(": "（", ")": "）" };

/**
 * Normalise a Tatoeba sentence typed with ASCII punctuation
 * ("王小明说英语,但英语书不多.") to the full-width marks the rest of the data
 * uses ("王小明说英语，但英语书不多。"). Numbers keep their marks (1,000 /
 * 3:00 / 1.5), and Latin text keeps its spaces.
 */
export function normalizeSentence(text) {
  let s = text.trim();
  s = s.replace(/\.{3,}|…+/g, "……");
  // Between two digits, "," ":" and "." belong to the number.
  s = s.replace(/[,?!:;()]/g, (ch, at) => {
    const before = s[at - 1] ?? "";
    const after = s[at + 1] ?? "";
    if (/[,:]/.test(ch) && /\d/.test(before) && /\d/.test(after)) return ch;
    return FULL[ch];
  });
  s = s.replace(/\./g, (ch, at) => (/[\dA-Za-z]/.test(s[at - 1] ?? "") ? ch : "。"));
  // Straight double quotes alternate open/close; an odd count is left alone.
  const quotes = s.match(/"/g)?.length ?? 0;
  if (quotes > 0 && quotes % 2 === 0) {
    let open = true;
    s = s.replace(/"/g, () => {
      const q = open ? "“" : "”";
      open = !open;
      return q;
    });
  }
  // A space only matters between two Latin words or numbers.
  s = s.replace(/ +/g, (sp, at) => {
    const before = s[at - 1] ?? "";
    const after = s[at + sp.length] ?? "";
    return WIDE_RE.test(before) || WIDE_RE.test(after) ? "" : " ";
  });
  return s;
}

/** "好玩{儿}" → "好玩": the HSK list marks an optional 儿 this way. */
export function wordKey(word) {
  return word.trim().replace(/\{儿\}$/u, "");
}

export const TATOEBA_FILE = "100000sentences.csv";
export const MT_FILE = "sentences_tatoeba_mt.tsv";
export const MT_HEADER = ["tatoeba_id", "hanzi", "vi", "en"];

/**
 * Tatoeba rows that can be used: the word (without its optional 儿) occurs in
 * the normalised sentence. `readCsv` is build-data.mjs's parser.
 */
export function tatoebaRows(readCsv) {
  const out = [];
  for (const r of readCsv(TATOEBA_FILE)) {
    const word = wordKey(r.word);
    const hanzi = normalizeSentence(r.sentence);
    if (!word || !hanzi.includes(word)) continue;
    const id = r.source.replace(/^tatoeba:/, "");
    if (!/^\d+$/.test(id)) throw new Error(`unexpected source: ${r.source}`);
    out.push({ level: r.level.trim(), word, hanzi, id });
  }
  return out;
}

/** { hanzi: { vi, en } } from the machine-translation cache, if it exists. */
export function readMachineTranslations(srcDir) {
  let text;
  try {
    text = readFileSync(join(srcDir, MT_FILE), "utf-8");
  } catch {
    return new Map();
  }
  const out = new Map();
  for (const [i, line] of text.split("\n").entries()) {
    if (i === 0 || !line) continue;
    const [, hanzi, vi, en] = line.split("\t");
    if (hanzi) out.set(hanzi, { vi: vi ?? "", en: en ?? "" });
  }
  return out;
}

/** A TSV cell must not break the row. */
export function tsvCell(text) {
  return text.replace(/[\t\r\n]+/g, " ").trim();
}
