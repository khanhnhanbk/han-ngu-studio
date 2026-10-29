// CVDICT (ph0ngp/CVDICT, CC BY-SA 4.0): parsing and sense cleanup shared by
// scripts/build-vocab-source.mjs (HSK meanings and the full cvdict.tsv).

import { convert } from "pinyin-pro";

/**
 * CC-CEDICT numbered Pinyin to tone marks: "nu:3 er2" → "nǚ ér", "qin1 qi5"
 * → "qīn qi", "wan2 r5" → "wánr", "E2" → "É". pinyin-pro leaves the
 * neutral-tone 5 in place, so it is removed here.
 */
export function toMarks(numbered) {
  return numbered
    .split(" ")
    .map((syllable) => {
      // pinyin-pro misreads capitals ("E2", "Er4"), so convert lower case and restore the capital.
      const lower = syllable.replace(/u:/g, "ü").toLowerCase();
      const marked = convert(lower, { format: "numToSymbol" }).replace(/^(\p{L}+)5$/u, "$1");
      return syllable[0] !== lower[0] ? marked[0].toUpperCase() + marked.slice(1) : marked;
    })
    .join(" ")
    .replace(/ r(?= |$)/g, "r");
}

// Classifier notes: "LT:个[ge4]", "Lượng từ: 个[ge4]", or the same in brackets.
const CLASSIFIER = /^(?:CL|LT|lượng từ):/iu;
const CLASSIFIER_NOTE = /\s*\((?:CL|LT|lượng từ):[^()]*\)/giu;
// A sense that only points at another entry: "biến thể er hoá của 好玩[hao3 wan2]".
const POINTER = /^(?:biến thể(?: er hoá| cũ| cổ)? của|xem(?: thêm)?|viết tắt của) (\S+?)\[([^\]]+)\]$/u;

// One measure word in a classifier note: "門|门[men2]" or "位[wei4]".
const CLASSIFIER_ITEM = /(?:[^\s,:|[\]]+\|)?([^\s,:|[\]]+)\[([^\]]+)\]/gu;

/** "LT:門|门[men2],個|个[ge4]" → ["门 mén", "个 gè"] (Simplified, tone marks). */
export function classifiersIn(note) {
  return [...note.matchAll(CLASSIFIER_ITEM)].map(
    ([, simp, pinyin]) => `${simp} ${toMarks(pinyin)}`,
  );
}

/**
 * CVDICT: { entries: "trad|simp[pin yin]" → senses, classifiers: key → measure
 * words, bySimp: "simp[pin yin]" → entry keys, heads: key → { trad, simp, pinyin } }.
 */
export function readCvdict(text) {
  const entries = new Map();
  const heads = new Map();
  const classifiers = new Map();
  const bySimp = new Map();
  for (const line of text.split("\n")) {
    const m = /^(\S+) (\S+) \[([^\]]*)\] \/(.*)\/\s*$/.exec(line);
    if (!m) continue;
    const raw = m[4].split("/");
    const senses = raw.map((s) => s.replace(CLASSIFIER_NOTE, "").trim()).filter((s) => s && !CLASSIFIER.test(s));
    const notes = raw.flatMap((s) => [
      ...(CLASSIFIER.test(s.trim()) ? [s] : []),
      ...(s.match(CLASSIFIER_NOTE) ?? []),
    ]);
    const key = `${m[1]}|${m[2]}[${m[3]}]`;
    entries.set(key, senses);
    heads.set(key, { trad: m[1], simp: m[2], pinyin: m[3], raw: senses });
    if (notes.length) classifiers.set(key, notes.flatMap(classifiersIn));
    const simp = `${m[2]}[${m[3]}]`;
    if (!bySimp.has(simp)) bySimp.set(simp, []);
    bySimp.get(simp).push(key);
  }
  return { entries, classifiers, bySimp, heads };
}

export const ownSenses = (cvdict, key) => (cvdict.entries.get(key) ?? []).filter((s) => !POINTER.test(s));

/**
 * The senses of one entry. Pointer senses are dropped when the entry has
 * others; an entry that only points elsewhere ("复习: variant of 復習|复习")
 * takes the target's senses. A target written with one form ("好玩[hao3 wan2]")
 * is the first entry of that Simplified form and reading that has senses.
 */
export function sensesOf(cvdict, key) {
  const own = ownSenses(cvdict, key);
  if (own.length) return own;
  return (cvdict.entries.get(key) ?? []).flatMap((s) => {
    const [, ref, pinyin] = POINTER.exec(s);
    const targets = ref.includes("|") ? [`${ref}[${pinyin}]`] : (cvdict.bySimp.get(`${ref}[${pinyin}]`) ?? []);
    const target = targets.find((t) => t !== key && ownSenses(cvdict, t).length);
    return target ? ownSenses(cvdict, target) : [];
  });
}

/**
 * Every CVDICT entry as [simp, trad, pinyin (tone marks), senses, classifiers]
 * in file order: senses joined with " / " (pointer senses resolved as for
 * the HSK list; an entry whose pointer cannot be resolved keeps it as text),
 * measure words "门 mén|个 gè". Entries with neither are left out.
 */
export function cvdictRows(cvdict) {
  const clean = (s) => s.replace(/[\t\r\n]+/g, " ");
  const out = [];
  for (const [key, head] of cvdict.heads) {
    let senses = sensesOf(cvdict, key);
    if (!senses.length) senses = head.raw;
    const classifiers = [...new Set(cvdict.classifiers.get(key) ?? [])];
    if (!senses.length && !classifiers.length) continue;
    out.push([head.simp, head.trad, toMarks(head.pinyin), senses.map(clean).join(" / "), classifiers.join("|")]);
  }
  return out;
}
