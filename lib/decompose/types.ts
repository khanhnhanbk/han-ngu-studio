/**
 * public/data/decompose.json (built from Make Me a Hanzi, LGPL-3.0+):
 * { char: [ids, radical, type?, semantic?, phonetic?, hint?] }, keys ordered
 * most frequent first. See buildDecompose in scripts/build-data.mjs.
 */
export type DecomposeEntry = [
  ids: string,
  radical: string,
  type?: EtymologyCode,
  semantic?: string,
  phonetic?: string,
  hint?: string,
];
export type DecomposeData = Record<string, DecomposeEntry>;

/** p = pictophonetic (hình thanh), i = ideographic (hội ý), g = pictographic (tượng hình). */
export type EtymologyCode = "p" | "i" | "g" | "";

export type Etymology = {
  type: EtymologyCode;
  /** Part that hints at the meaning (pictophonetic only). */
  semantic: string;
  /** Part that hints at the sound (pictophonetic only). */
  phonetic: string;
  /** Short English note from Make Me a Hanzi. */
  hint: string;
};

/** A parsed Ideographic Description Sequence. */
export type IdsNode =
  | { kind: "char"; char: string }
  | { kind: "op"; op: string; children: IdsNode[] }
  | { kind: "unknown" };

/**
 * A component tree. `strokes` are indices into the root character's strokes
 * (null when the stroke mapping is unknown); `color` is set on the parts of
 * the root's own decomposition, which the coloured glyph paints.
 */
export type PartNode =
  | {
      kind: "char";
      char: string;
      strokes: number[] | null;
      color: number | null;
      /** How this component itself splits; null when it is a basic part. */
      parts: PartNode | null;
    }
  | { kind: "op"; op: string; strokes: number[] | null; children: PartNode[] }
  | { kind: "unknown"; strokes: number[] | null; color: number | null };
