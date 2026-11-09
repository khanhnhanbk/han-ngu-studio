import { memoJson } from "@/lib/fetchJson";

/**
 * Old glyph forms (phase 12d): SVG drawings from the Wikimedia Commons
 * "Ancient Chinese characters project" (public domain / CC0), fetched once by
 * `pnpm fetch:ancient` and sharded by `pnpm build:data` into
 * public/data/ancient/<n>.json, keyed by the HSK (Simplified) character.
 */
export const ANCIENT_FORMS = ["oracle", "bronze", "bigseal", "seal"] as const;
export type AncientForm = (typeof ANCIENT_FORMS)[number];

/** [cleaned SVG, the character in the Commons file name (車 for 車-oracle.svg)]. */
export type AncientGlyph = [svg: string, name: string];
export type AncientEntry = Partial<Record<AncientForm, AncientGlyph>>;
export type AncientShard = Record<string, AncientEntry>;

// Must match ANCIENT_SHARDS and ancientShard() in scripts/lib/ancient.mjs.
export const ANCIENT_SHARDS = 128;

/** FNV-1a over the character's code point, modulo ANCIENT_SHARDS. */
export function ancientShard(char: string): number {
  let h = 0x811c9dc5;
  h ^= char.codePointAt(0) ?? 0;
  h = Math.imul(h, 0x01000193) >>> 0;
  return h % ANCIENT_SHARDS;
}

export function ancientFile(char: string): string {
  return `/data/ancient/${ancientShard(char)}.json`;
}

const loaders = new Map<string, () => Promise<AncientShard>>();

/** The forms of a Simplified character, or null when there are none. */
export async function loadAncient(simp: string): Promise<AncientEntry | null> {
  const file = ancientFile(simp);
  let load = loaders.get(file);
  if (!load) {
    load = memoJson<AncientShard>(file);
    loaders.set(file, load);
  }
  const shard = await load();
  return Object.hasOwn(shard, simp) ? shard[simp] : null;
}

/** The Commons page of one form's file. */
export function commonsPage(name: string, form: AncientForm): string {
  return `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(`${name}-${form}.svg`)}`;
}

/**
 * The forms to show for the character on screen. A drawing filed under a
 * Traditional name belongs to that Traditional character: 车 has one
 * Traditional form, so 车 shows 車-oracle.svg; 发 merges 發 and 髮, so
 * 發-oracle.svg is shown for 發 only, never for 发 or 髮. `tradForms` are the
 * Traditional forms of `simp` (from variants.json; empty when it has none).
 */
export function formsFor(
  entry: AncientEntry | null,
  shown: string,
  simp: string,
  tradForms: readonly string[],
): { form: AncientForm; svg: string; name: string }[] {
  if (!entry) return [];
  const out: { form: AncientForm; svg: string; name: string }[] = [];
  for (const form of ANCIENT_FORMS) {
    const glyph = entry[form];
    if (!glyph) continue;
    const [svg, name] = glyph;
    // A Traditional character on screen takes only files named after itself
    // (後 must not get 后-oracle.svg, which is 后 "queen").
    const ok = name === shown || (shown === simp && tradForms.length === 1 && tradForms[0] === name);
    if (ok) out.push({ form, svg, name });
  }
  return out;
}

/** data: URL for an <img>, which cannot run scripts or load anything. */
export function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
