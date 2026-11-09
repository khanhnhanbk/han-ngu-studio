import { memoJson } from "@/lib/fetchJson";

/**
 * public/data/variants.json (phase 12b, built by `pnpm build:data` from the
 * OpenCC data in opencc-js, Apache-2.0): one row per Simplified + Traditional
 * pair, with the Japanese (shinjitai) form, only where the three are not all
 * the same. 发 has two rows (發 発, 髮 髪).
 */
export type VariantRow = [simp: string, trad: string, jp: string];

export const VARIANTS_FILE = "/data/variants.json";

export const loadVariants = memoJson<VariantRow[]>(VARIANTS_FILE);

export type VariantIndex = Map<string, VariantRow[]>;

/** Every form (Giản, Phồn or Nhật) → the rows it appears in. */
export function indexVariants(rows: readonly VariantRow[]): VariantIndex {
  const out: VariantIndex = new Map();
  for (const row of rows) {
    for (const form of new Set(row)) {
      const list = out.get(form) ?? [];
      list.push(row);
      out.set(form, list);
    }
  }
  return out;
}

/**
 * The Giản · Phồn · Nhật rows for a character. A character typed in one of
 * its Traditional forms gets that form's row only (髮 → 发 髮 髪, not 發); a
 * Simplified or Japanese one gets all its rows. A character found as some
 * other row's Traditional or Japanese form only (後 for 后) still gets that row.
 */
export function variantsOf(index: VariantIndex | null, char: string): VariantRow[] {
  const rows = index?.get(char) ?? [];
  const asTrad = rows.filter((r) => r[1] === char);
  if (asTrad.length && !rows.some((r) => r[0] === char)) return asTrad;
  return rows;
}
