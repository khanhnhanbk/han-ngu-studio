/** One Kangxi radical (public/data/radicals.json, built from assets/dictionary/radicals.tsv). */
export type Radical = {
  /** Kangxi number, 1–214. */
  no: number;
  radical: string;
  /** Other forms: component (氵, 扌) and simplified (讠, 门) shapes. */
  variants: string[];
  strokes: number;
  /** Hán Việt name, e.g. "Thủy". */
  name: string;
  /** Vietnamese meaning. */
  meaning: string;
  pinyin: string;
  /** How many of our characters are filed under this radical. */
  count: number;
  /** The most frequent of them: [character, Hán Việt]. */
  chars: Array<[string, string]>;
  /** Every character filed under it, most frequent first (for search). */
  members: string;
  /** The same three lists for Taiwan Traditional characters (Phồn thể mode). */
  countTrad: number;
  charsTrad: Array<[string, string]>;
  membersTrad: string;
};
