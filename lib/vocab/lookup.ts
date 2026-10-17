/** { word: [[level, pinyin, meaning], …] } from vocab_hsk_vi.csv (see build-data.mjs). */
export type VocabData = Record<string, Array<[string, string, string]>>;

export type VocabInfo = {
  /** "HSK 1" … "HSK 7-9": the lowest level the word is listed at. */
  level: string;
  /** Vietnamese meanings, distinct, joined with "; ". */
  meaning: string;
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
  for (const [, , m] of entries) if (!meanings.includes(m)) meanings.push(m);
  return { level: `HSK ${lowest}`, meaning: meanings.join("; ") };
}
