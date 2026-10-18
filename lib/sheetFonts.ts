/** Font choices for the practice sheet's model and trace characters. */
export type SheetFontId =
  | "wenkai"
  | "mashanzheng"
  | "notoSerif"
  | "notoSans"
  | "local"
  | "upload";

/** Built-in fonts, served with the site (see app/tools/practice-sheet/fonts.ts). */
export const PRESET_FONTS = ["wenkai", "mashanzheng", "notoSerif", "notoSans"] as const;
export type PresetFontId = (typeof PRESET_FONTS)[number];

/** CSS variable each preset's next/font declaration sets. */
export const PRESET_VARS: Record<PresetFontId, string> = {
  wenkai: "--font-kai",
  mashanzheng: "--font-mashanzheng",
  notoSerif: "--font-noto-serif-sc",
  notoSans: "--font-hanzi",
};

/** Family name given to a font file the user uploads. */
export const UPLOAD_FAMILY = "HNS Uploaded Font";

/** Common Chinese fonts installed with Windows, macOS and Linux. */
export const LOCAL_FONT_SUGGESTIONS = [
  "KaiTi",
  "STKaiti",
  "Kaiti SC",
  "Kaiti TC",
  "BiauKai",
  "DFKai-SB",
  "SimSun",
  "STSong",
  "Songti SC",
  "Microsoft YaHei",
  "PingFang SC",
  "Heiti SC",
  "Noto Serif CJK SC",
  "AR PL UKai CN",
];

/** Phồn thể mode: presets that have a Traditional (Taiwan) cut of their own. */
const TRAD_VARS: Partial<Record<PresetFontId, string>> = {
  notoSerif: "--font-noto-serif-tc",
};

/** Presets with no Traditional glyphs (shown with the fallback font). */
export const SIMP_ONLY_FONTS: ReadonlySet<SheetFontId> = new Set(["mashanzheng"]);

// Fallback for glyphs the chosen font lacks (e.g. traditional characters in
// Ma Shan Zheng): the default Kai font, then system Kai fonts.
const FALLBACK = 'var(--font-kai), "KaiTi", "STKaiti", var(--font-hanzi), serif';

/** Quote a family name for CSS, escaping backslashes and quotes. */
export function quoteFamily(name: string): string {
  return `"${name.replace(/[\\"]/g, (c) => `\\${c}`)}"`;
}

/**
 * font-family stack for the sheet. In Phồn thể mode a preset with a TC cut
 * uses it first, with the SC cut behind it for Simplified-only characters.
 */
export function fontStack(id: SheetFontId, localName = "", trad = false): string {
  if (id === "local") {
    const name = localName.trim();
    return name ? `${quoteFamily(name)}, ${FALLBACK}` : FALLBACK;
  }
  if (id === "upload") return `${quoteFamily(UPLOAD_FAMILY)}, ${FALLBACK}`;
  const tc = trad ? TRAD_VARS[id] : undefined;
  if (tc) return `var(${tc}), var(${PRESET_VARS[id]}), ${FALLBACK}`;
  return `var(${PRESET_VARS[id]}), ${FALLBACK}`;
}

export function isSheetFontId(value: unknown): value is SheetFontId {
  return (
    typeof value === "string" &&
    (PRESET_FONTS as readonly string[]).concat(["local", "upload"]).includes(value)
  );
}
