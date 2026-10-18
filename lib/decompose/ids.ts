import type { DecomposeEntry, Etymology, IdsNode } from "./types";

/** IDS operators and how many parts each takes (keep in sync with build-data.mjs). */
export const ARITY: Readonly<Record<string, number>> = {
  "⿰": 2,
  "⿱": 2,
  "⿲": 3,
  "⿳": 3,
  "⿴": 2,
  "⿵": 2,
  "⿶": 2,
  "⿷": 2,
  "⿸": 2,
  "⿹": 2,
  "⿺": 2,
  "⿻": 2,
};

/** Make Me a Hanzi marks a part it could not identify with a full-width ？. */
export const UNKNOWN_PART = "？";

/**
 * Parse an Ideographic Description Sequence such as "⿰氵青" or "⿱⿰木木一".
 * Iterates code points, so parts outside the BMP stay whole. Throws on
 * malformed input (missing parts or trailing text).
 */
export function parseIds(ids: string): IdsNode {
  const glyphs = Array.from(ids);
  let pos = 0;
  function node(): IdsNode {
    const g = glyphs[pos++];
    if (g === undefined) throw new Error(`incomplete IDS: ${ids}`);
    if (g === UNKNOWN_PART) return { kind: "unknown" };
    const arity = ARITY[g];
    if (arity === undefined) return { kind: "char", char: g };
    const children: IdsNode[] = [];
    for (let i = 0; i < arity; i++) children.push(node());
    return { kind: "op", op: g, children };
  }
  const root = node();
  if (pos !== glyphs.length) throw new Error(`trailing text in IDS: ${ids}`);
  return root;
}

function hasKnownPart(node: IdsNode): boolean {
  if (node.kind === "char") return true;
  if (node.kind === "op") return node.children.some(hasKnownPart);
  return false;
}

/**
 * How `char` splits into parts, or null when it is a basic part: its IDS is
 * the character itself, or every part in it is unknown (氵 is "⿱？？").
 */
export function splitOf(char: string, entry: DecomposeEntry | undefined): IdsNode | null {
  if (!entry) return null;
  const node = parseIds(entry[0]);
  if (node.kind === "char" && node.char === char) return null;
  return hasKnownPart(node) ? node : null;
}

export function etymologyOf(entry: DecomposeEntry): Etymology {
  return {
    type: entry[2] ?? "",
    semantic: entry[3] ?? "",
    phonetic: entry[4] ?? "",
    hint: entry[5] ?? "",
  };
}
