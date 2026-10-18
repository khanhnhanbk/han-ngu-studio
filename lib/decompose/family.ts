import { splitOf } from "./ids";
import type { DecomposeData, IdsNode } from "./types";

/** component → characters containing it anywhere in their tree, most frequent first. */
export type ReverseIndex = Map<string, string[]>;

export type FamilyMember = {
  char: string;
  /** The component is this character's sound part (hình thanh). */
  phonetic: boolean;
  /** The component is this character's meaning part (hình thanh). */
  semantic: boolean;
};

/**
 * Build the reverse index in memory (about 10k characters, so it is not
 * shipped as a file). decompose.json keys are already in frequency order,
 * which each list keeps.
 */
export function buildReverseIndex(data: DecomposeData): ReverseIndex {
  const memo = new Map<string, ReadonlySet<string>>();

  function parts(char: string, ancestors: ReadonlySet<string>): ReadonlySet<string> {
    const cached = memo.get(char);
    if (cached) return cached;
    const out = new Set<string>();
    const ids = ancestors.has(char) ? null : splitOf(char, data[char]);
    if (ids) {
      const inside = new Set(ancestors).add(char);
      const visit = (node: IdsNode) => {
        if (node.kind === "op") node.children.forEach(visit);
        else if (node.kind === "char") {
          out.add(node.char);
          for (const p of parts(node.char, inside)) out.add(p);
        }
      };
      visit(ids);
    }
    out.delete(char);
    // The data has no cycles (checked in family.test.ts); the guard only
    // keeps a bad future data file from recursing forever.
    memo.set(char, out);
    return out;
  }

  const index: ReverseIndex = new Map();
  for (const char of Object.keys(data)) {
    for (const p of parts(char, new Set())) {
      const list = index.get(p);
      if (list) list.push(char);
      else index.set(p, [char]);
    }
  }
  return index;
}

/** Characters that contain `component`, most frequent first. */
export function familyOf(component: string, index: ReverseIndex, data: DecomposeData): FamilyMember[] {
  return (index.get(component) ?? []).map((char) => {
    const entry = data[char];
    return {
      char,
      phonetic: entry?.[2] === "p" && entry[4] === component,
      semantic: entry?.[2] === "p" && entry[3] === component,
    };
  });
}
