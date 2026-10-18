import type { Script } from "@/lib/script/preference";

import type { Radical } from "./types";

/** Lower case without Vietnamese or Pinyin tone marks: "Thủy" → "thuy", "shuǐ" → "shui". */
export function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

/**
 * Radicals matching a query, in Kangxi order. A query that contains Chinese
 * matches a radical, one of its variants, or any character filed under it;
 * anything else matches the start of a word in the name, meaning or Pinyin,
 * ignoring tone marks, or the Kangxi number.
 */
export function searchRadicals(radicals: readonly Radical[], query: string): Radical[] {
  const q = query.trim();
  if (!q) return [...radicals];
  if (/\p{Script=Han}/u.test(q) || /[⺀-⿟]/u.test(q)) {
    const chars = new Set(Array.from(q.normalize("NFKC")));
    return radicals.filter(
      (r) =>
        chars.has(r.radical) || r.variants.some((v) => chars.has(v)) || Array.from(r.members).some((c) => chars.has(c)),
    );
  }
  if (/^\d+$/.test(q)) return radicals.filter((r) => r.no === Number(q));
  const needle = fold(q);
  const words = (s: string) => fold(s).split(/[^\p{L}\p{N}]+/u);
  return radicals.filter((r) =>
    [r.name, r.meaning, r.pinyin].some((field) => fold(field).startsWith(needle) || words(field).some((w) => w.startsWith(needle))),
  );
}

/**
 * The radicals with the character lists of the chosen script. A Traditional
 * character is filed under its own radical (頭 → 181 頁, while 头 → 37 大).
 * Giản thể mode returns the list unchanged.
 */
export function forScript(radicals: readonly Radical[], script: Script): Radical[] {
  if (script === "simp") return [...radicals];
  return radicals.map((r) => ({ ...r, count: r.countTrad, chars: r.charsTrad, members: r.membersTrad }));
}

/** Radicals grouped by stroke count, in order. */
export function groupByStrokes(radicals: readonly Radical[]): Array<[number, Radical[]]> {
  const groups = new Map<number, Radical[]>();
  for (const r of radicals) {
    const list = groups.get(r.strokes) ?? [];
    list.push(r);
    groups.set(r.strokes, list);
  }
  return [...groups.entries()].sort(([a], [b]) => a - b);
}
