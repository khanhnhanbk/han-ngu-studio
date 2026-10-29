/** cvdict/<n>.json: { simp: [[trad, pinyin, senses, classifiers?], …] } (see buildCvdict in build-data.mjs). */
export type CvdictRow = [trad: string, pinyin: string, senses: string[], classifiers?: string];
export type CvdictShard = Record<string, CvdictRow[]>;

export type CvdictEntry = {
  /** Traditional forms, more than one when CVDICT lists variants (復習, 複習). */
  trad: string[];
  /** Pinyin with tone marks, one syllable per space ("qīn qi"). */
  pinyin: string;
  /** Vietnamese senses in CVDICT order (machine-translated from CC-CEDICT, then checked). */
  senses: string[];
  /** Measure words "门 mén" → { hanzi, pinyin }. */
  classifiers: Array<{ hanzi: string; pinyin: string }>;
};

/** Number of shard files. Must match CVDICT_SHARDS in scripts/build-data.mjs. */
export const CVDICT_SHARDS = 64;

/** Which cvdict/<n>.json holds a word: FNV-1a over its first character's code point (as the build script). */
export function cvdictShard(word: string): number {
  let h = 0x811c9dc5;
  h ^= word.codePointAt(0)!;
  h = Math.imul(h, 0x01000193) >>> 0;
  return h % CVDICT_SHARDS;
}

function toEntry([trad, pinyin, senses, classifiers = ""]: CvdictRow): CvdictEntry {
  return {
    trad: trad.split("|"),
    pinyin,
    senses,
    classifiers: classifiers
      .split("|")
      .filter(Boolean)
      .map((item) => {
        const [hanzi, reading = ""] = item.split(" ");
        return { hanzi, pinyin: reading };
      }),
  };
}

/** Compare Pinyin loosely: case, spaces and apostrophes do not count ("qīn qi" = "qīnqi"). */
const pinyinKey = (p: string) => p.normalize("NFC").toLowerCase().replace(/[\s'’]+/g, "");

/**
 * The CVDICT entries of a Simplified word, from the shard `cvdictShard(word)`
 * names. With `pinyin`, only that reading's entries when any match (好 hǎo vs
 * hào); otherwise all of them, so nothing is dropped. [] when not listed.
 */
export function lookupCvdict(shard: CvdictShard, word: string, pinyin?: string): CvdictEntry[] {
  const rows = Object.hasOwn(shard, word) ? shard[word] : [];
  const key = pinyin ? pinyinKey(pinyin) : "";
  const matching = key ? rows.filter((r) => pinyinKey(r[1]) === key) : [];
  return (matching.length ? matching : rows).map(toEntry);
}

/** Vietnamese senses of the entries, distinct, joined with "; " (as vocabFor's meaning). */
export function cvdictMeaning(entries: readonly CvdictEntry[]): string {
  const out: string[] = [];
  for (const e of entries) for (const s of e.senses) if (!out.includes(s)) out.push(s);
  return out.join("; ");
}

/**
 * Words that start with `prefix` and are longer than it, from the same shard
 * (every word in it shares its first character). Shorter words first, then
 * in `rank` order (lower is earlier; unranked last), then by code point.
 */
export function wordsStartingWith(
  shard: CvdictShard,
  prefix: string,
  rank: (word: string) => number = () => Infinity,
): string[] {
  const len = Array.from(prefix).length;
  return Object.keys(shard)
    .filter((w) => w.startsWith(prefix) && Array.from(w).length > len)
    .sort((a, b) => Array.from(a).length - Array.from(b).length || rank(a) - rank(b) || (a < b ? -1 : a > b ? 1 : 0));
}
