import { splitOf } from "./ids";
import type { DecomposeData, IdsNode, PartNode } from "./types";

/** Per stroke, its path in the character's IDS tree (null when unassigned). */
export type Matches = ReadonlyArray<ReadonlyArray<number> | null>;

/** Stop expanding below this depth (deep trees only repeat basic strokes). */
const MAX_DEPTH = 8;

function startsWith(path: ReadonlyArray<number>, prefix: ReadonlyArray<number>): boolean {
  return prefix.every((v, i) => path[i] === v);
}

/**
 * The full component tree of `root`. Stroke indices refer to the root's
 * strokes: a component's strokes inside its parent are mapped onto the
 * component's own `matches` in writing order, which holds only when both
 * stroke counts agree, so a mismatch leaves `strokes` null below that point.
 * Each part of the root's own IDS gets a colour index 0, 1, 2… in order.
 */
export function buildTree(
  root: string,
  data: DecomposeData,
  matchesOf: (char: string) => Matches | undefined,
): PartNode {
  let nextColor = 0;
  const rootMatches = matchesOf(root);
  const rootStrokes = rootMatches ? rootMatches.map((_, i) => i) : null;

  function expand(
    char: string,
    strokes: number[] | null,
    depth: number,
    ancestors: ReadonlySet<string>,
    color: number | null,
  ): PartNode {
    const ids = depth < MAX_DEPTH && !ancestors.has(char) ? splitOf(char, data[char]) : null;
    if (!ids) return { kind: "char", char, strokes, color, parts: null };

    const matches = matchesOf(char);
    const usable = strokes !== null && matches !== undefined && matches.length === strokes.length;
    const inside = new Set(ancestors).add(char);

    function walk(node: IdsNode, path: number[]): PartNode {
      const own = usable
        ? strokes.filter((_, k) => {
            const m = matches[k];
            return m !== null && startsWith(m, path);
          })
        : null;
      if (node.kind === "op") {
        return {
          kind: "op",
          op: node.op,
          strokes: own,
          children: node.children.map((child, i) => walk(child, [...path, i])),
        };
      }
      const partColor = depth === 0 ? nextColor++ : null;
      if (node.kind === "unknown") return { kind: "unknown", strokes: own, color: partColor };
      return expand(node.char, own, depth + 1, inside, partColor);
    }

    return { kind: "char", char, strokes, color, parts: walk(ids, []) };
  }

  return expand(root, rootStrokes, 0, new Set(), null);
}

/** Colour index for each of the root's strokes (null: not in a coloured part). */
export function strokeColors(tree: PartNode, strokeCount: number): Array<number | null> {
  const out: Array<number | null> = Array.from({ length: strokeCount }, () => null);
  function visit(node: PartNode) {
    if (node.kind !== "op" && node.color !== null) {
      for (const s of node.strokes ?? []) out[s] = node.color;
      return;
    }
    if (node.kind === "op") node.children.forEach(visit);
    else if (node.kind === "char" && node.parts) visit(node.parts);
  }
  visit(tree);
  return out;
}

/** Every component glyph in the tree below the root, in tree order, without repeats. */
export function treeGlyphs(tree: PartNode): string[] {
  const out = new Set<string>();
  function visit(node: PartNode, isRoot: boolean) {
    if (node.kind === "op") node.children.forEach((c) => visit(c, false));
    else if (node.kind === "char") {
      if (!isRoot) out.add(node.char);
      if (node.parts) visit(node.parts, false);
    }
  }
  visit(tree, true);
  return [...out];
}
