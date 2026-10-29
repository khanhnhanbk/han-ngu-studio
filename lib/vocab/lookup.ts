/**
 * { word: [[level, pinyin, meaning, pos?, classifiers?], …] } from
 * vocab_hsk30.csv (see build-data.mjs); meaning may be "". `pos` is the HSK
 * list's part of speech ("V/N"), `classifiers` the CVDICT measure words
 * ("门 mén|个 gè"); both are left off when empty.
 */
export type VocabEntry = [level: string, pinyin: string, meaning: string, pos?: string, classifiers?: string];
export type VocabData = Record<string, VocabEntry[]>;

/** A measure word for the word: 个 gè (一个老师). */
export type Classifier = { hanzi: string; pinyin: string };

export type VocabInfo = {
  /** "HSK 1" … "HSK 7-9": the lowest level the word is listed at. */
  level: string;
  /** Vietnamese meanings (CVDICT), distinct, joined with "; "; "" when there is none. */
  meaning: string;
  /** Part-of-speech codes of the HSK list (see pos.ts), distinct, in list order; [] for phrases. */
  pos: string[];
  /** Measure words from CVDICT, distinct; [] when it lists none. */
  classifiers: Classifier[];
};

/** "7-9" sorts after 6. */
function levelRank(level: string): number {
  return Number.parseInt(level, 10);
}

/**
 * Compare Pinyin loosely: case, spaces, apostrophes and the erhua spelling
 * ("wánr" vs "wán er", or "wán ér" as pinyin-pro writes it) do not count.
 */
function pinyinKey(pinyin: string): string {
  return pinyin
    .normalize("NFC")
    .toLowerCase()
    .replace(/[\s'’]+/g, "")
    .replace(/[eé]r$/, "r");
}

/**
 * HSK level and Vietnamese meaning of a word. With `pinyin`, only the entries
 * for that reading are used (好 hǎo vs hào); if none matches, all entries are,
 * so the data is still shown rather than dropped. Null when the word is not
 * in the list.
 */
export function vocabFor(data: VocabData, word: string, pinyin?: string): VocabInfo | null {
  const all = Object.hasOwn(data, word) ? data[word] : [];
  if (all.length === 0) return null;
  const key = pinyin ? pinyinKey(pinyin) : "";
  const matching = key ? all.filter(([, p]) => pinyinKey(p) === key) : [];
  const entries = matching.length ? matching : all;

  const lowest = entries.reduce((a, b) => (levelRank(b[0]) < levelRank(a[0]) ? b : a))[0];
  const meanings: string[] = [];
  const pos: string[] = [];
  const classifiers: Classifier[] = [];
  for (const [, , m, p = "", cl = ""] of entries) {
    if (m && !meanings.includes(m)) meanings.push(m);
    for (const code of p.split("/")) if (code && !pos.includes(code)) pos.push(code);
    for (const item of cl.split("|")) {
      const [hanzi, pinyin = ""] = item.split(" ");
      if (hanzi && !classifiers.some((c) => c.hanzi === hanzi)) classifiers.push({ hanzi, pinyin });
    }
  }
  return { level: `HSK ${lowest}`, meaning: meanings.join("; "), pos, classifiers };
}
