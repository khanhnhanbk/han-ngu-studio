/**
 * "Lộ trình 1000 chữ" (phase 12e): which characters, in which order, in
 * which stages. Pure logic; the page feeds it decompose.json (keys in
 * frequency order) and the HSK list.
 */

export const PATH_SIZE = 1000;
export const STAGE_SIZE = 100;

/**
 * The path's characters: every `required` character (HSK 1–3) that is in
 * `byFrequency`, then the most frequent others until there are `size`.
 * Returned in frequency order.
 */
export function pickChars(byFrequency: readonly string[], required: ReadonlySet<string>, size = PATH_SIZE): string[] {
  const must = byFrequency.filter((c) => required.has(c));
  const room = Math.max(0, size - must.length);
  const extra = byFrequency.filter((c) => !required.has(c)).slice(0, room);
  const chosen = new Set([...must, ...extra]);
  return byFrequency.filter((c) => chosen.has(c));
}

/**
 * Order the characters so that a component which is itself on the path
 * comes before every character built from it (人 before 你, 青 before 清),
 * while keeping frequent characters early: go through the characters in
 * frequency order and, just before each one, place its components that are
 * not placed yet (each of them the same way, most frequent first). Stable
 * for the same input. `componentsOf` lists a character's parts at every depth.
 */
export function orderPath(chars: readonly string[], componentsOf: (c: string) => readonly string[]): string[] {
  const rank = new Map(chars.map((c, i) => [c, i]));
  const out: string[] = [];
  const placed = new Set<string>();
  const visiting = new Set<string>();
  const place = (c: string) => {
    if (placed.has(c) || visiting.has(c)) return; // visiting: a cycle in the data, ignore that edge
    visiting.add(c);
    const deps = componentsOf(c)
      .filter((p) => p !== c && rank.has(p))
      .sort((a, b) => rank.get(a)! - rank.get(b)!);
    for (const d of deps) place(d);
    visiting.delete(c);
    placed.add(c);
    out.push(c);
  };
  for (const c of chars) place(c);
  return out;
}

/** Stages of `size` characters (the last may be shorter). */
export function toStages<T>(items: readonly T[], size = STAGE_SIZE): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * Characters of one stage grouped by a shared phonetic part (青 → 清 晴 情),
 * families of two or more first, in the order they appear; `phoneticOf`
 * gives a character's phonetic part or "".
 */
export function phoneticFamilies(stage: readonly string[], phoneticOf: (c: string) => string): { phonetic: string; chars: string[] }[] {
  const groups = new Map<string, string[]>();
  for (const c of stage) {
    const p = phoneticOf(c);
    if (!p) continue;
    groups.set(p, [...(groups.get(p) ?? []), c]);
  }
  return [...groups].filter(([, cs]) => cs.length >= 2).map(([phonetic, chars]) => ({ phonetic, chars }));
}
