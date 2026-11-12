/**
 * Keep filled text inside the template's text boxes. The web cannot run
 * PowerPoint's layout, so it estimates: the box size (a:xfrm), the insets
 * (a:bodyPr) and the font size (sz) are in the slide XML, and the text width
 * is the sum of rough per-character widths (a CJK character is 1 em, Latin
 * letters about Arial's widths). When the filled text needs more lines than
 * the box was drawn for (its height in the template), runs into a picture,
 * or a short field like
 * {{chu}} would break onto a second line, every font size in the box is made
 * smaller until it fits. The estimate is kept on the safe side.
 */

/** A box whose text was made smaller (or still does not fit). */
export type FitNote = {
  /** Fields in the box, e.g. ["chu"]. */
  fields: string[];
  /** The filled text of the box. */
  text: string;
  /** New size / template size, 0.4–1. */
  scale: number;
  /** True when even the smallest allowed size does not fit. */
  overflow: boolean;
};

/**
 * Short fields should stay on one line: a word split in two (大学 / 生) reads
 * as two words. Value: the smallest scale accepted to keep one line; below
 * it the text may wrap, within the box's height.
 */
const ONE_LINE: Readonly<Record<string, number>> = {
  chu: 0.4,
  so: 0.4,
  hsk: 0.4,
  pinyin: 0.6,
  hanviet: 0.6,
  bai: 0.6,
  nghia: 0.75,
};
/** Never go below this; smaller text is unreadable on a projector. */
const MIN_SCALE = 0.4;
/** Estimates are rough: keep this much room spare. */
const SAFETY = 0.95;
/** Line height as a share of the font size (PowerPoint's single spacing). */
const LINE = 1.2;
const EMU_PER_HUNDREDTH_PT = 127;
const DEFAULT_SZ = 1800;

const CJK = /[⺀-〿぀-鿿가-힯豈-﫿︰-﹏＀-｠￠-￦]|[\u{20000}-\u{3FFFF}]/u;

/** Rough advance width of one character, in em (Arial-like for Latin). */
export function charWidth(ch: string): number {
  if (CJK.test(ch)) return 1;
  if (ch === " " || ch === " ") return 0.28;
  const base = ch.normalize("NFD")[0].replace(/đ/, "d").replace(/Đ/, "D");
  if (/[iljI.,;:'!|]/.test(base)) return 0.28;
  if (/[ftr()[\]\-]/.test(base)) return 0.36;
  if (/[mw]/.test(base)) return 0.83;
  if (/[MW]/.test(base)) return 0.9;
  if (/[a-z0-9?]/.test(base)) return 0.56;
  if (/[A-Z]/.test(base)) return 0.7;
  if (/\p{M}/u.test(base)) return 0;
  return 0.6;
}

export const textWidth = (text: string) => Array.from(text).reduce((sum, ch) => sum + charWidth(ch), 0);

/** Pieces a line may break between: one CJK character, or a Latin word with its trailing spaces. */
function breakUnits(text: string): { w: number; trail: number }[] {
  const out: { w: number; trail: number }[] = [];
  for (const m of text.matchAll(/[⺀-鿿豈-﫿＀-￯]|[\u{20000}-\u{3FFFF}]|[^\s⺀-鿿豈-﫿＀-￯\u{20000}-\u{3FFFF}]+\s*|\s+/gu)) {
    const piece = m[0];
    const word = piece.trimEnd();
    out.push({ w: textWidth(word), trail: textWidth(piece.slice(word.length)) });
  }
  return out;
}

/** Lines a paragraph needs in a box `width` em wide (greedy, like PowerPoint). */
export function linesNeeded(text: string, width: number): number {
  if (!text) return 1;
  let lines = 1;
  let x = 0;
  for (const u of breakUnits(text)) {
    if (x > 0 && x + u.w > width) {
      lines++;
      x = 0;
    }
    // A unit wider than the box is split anywhere.
    if (u.w > width) {
      lines += Math.ceil(u.w / width) - 1;
      x = u.w % width;
    } else x += u.w;
    x += u.trail;
  }
  return lines;
}

const attr = (tag: string, name: string) => new RegExp(`\\b${name}="(-?\\d+)"`).exec(tag)?.[1];

type Para = { text: string; sz: number };

/**
 * Shrink the text of one filled shape (<p:sp>) if it would not fit.
 * `fields`: the fields that were filled into it; `paras`: its paragraphs.
 * Returns the shape unchanged when nothing can be measured.
 */
export function fitShape(
  sp: string,
  fields: readonly string[],
  paras: readonly Para[],
  notes?: FitNote[],
  /** Free room from the box's left edge, when something covers its right part. */
  freeWidth?: number,
): string {
  const ext = /<a:xfrm\b[^>]*>[\s\S]*?<a:ext\b[^>]*\bcx="(\d+)"[^>]*\bcy="(\d+)"/.exec(sp);
  if (!ext) return sp;
  const body = /<a:bodyPr\b[^>]*>/.exec(sp)?.[0] ?? "";
  if (/\bvert="(?!horz)/.test(body)) return sp;
  const ins = (name: string, def: number) => Number(attr(body, name) ?? def);
  const width = Math.min(Number(ext[1]), freeWidth ?? Infinity) - ins("lIns", 91440) - ins("rIns", 91440);
  const height = Number(ext[2]) - ins("tIns", 45720) - ins("bIns", 45720);
  const live = paras.filter((p) => p.text.trim());
  if (width <= 0 || height <= 0 || live.length === 0) return sp;

  const em = (sz: number, scale: number) => sz * EMU_PER_HUNDREDTH_PT * scale;
  // Lines the box was drawn for: its height in the template over one line of the largest text.
  const lineH = Math.max(...paras.map((p) => p.sz)) * EMU_PER_HUNDREDTH_PT * LINE;
  const room = Math.max(paras.length, Math.round(height / lineH)) * lineH;
  const needH = (scale: number) =>
    paras.reduce((h, p) => h + linesNeeded(p.text, (width * SAFETY) / em(p.sz, scale)) * em(p.sz, scale) * LINE, 0);
  const oneLineScale = Math.min(1, ...live.map((p) => (width * SAFETY) / (textWidth(p.text) * em(p.sz, 1))));

  const floors = fields.filter((f) => Object.hasOwn(ONE_LINE, f)).map((f) => ONE_LINE[f]);
  const oneLine = floors.length === fields.length;
  let scale = 1;
  let overflow = false;
  if (oneLine && oneLineScale < 1 && oneLineScale >= Math.max(...floors)) {
    scale = oneLineScale;
  } else if (needH(1) > room) {
    // Largest scale (in 2 % steps) that fits the box's height.
    scale = MIN_SCALE;
    for (let s = 0.98; s >= MIN_SCALE; s -= 0.02) {
      if (needH(s) <= room) {
        scale = s;
        break;
      }
    }
    // A short field that had to wrap (a word split over two lines) is worth a look too.
    overflow = needH(scale) > room || (oneLine && oneLineScale < Math.min(...floors));
  }
  if (scale >= 1) return sp;

  notes?.push({ fields: [...fields], text: live.map((p) => p.text).join(" "), scale: Math.floor(scale * 100) / 100, overflow });
  const sized = (sz: number) => String(Math.max(100, Math.floor((sz * scale) / 100) * 100));
  // Every size in the box shrinks together; runs without their own size get one.
  let out = sp.replace(/(<a:(?:rPr|endParaRPr|defRPr)\b[^>]*\bsz=")(\d+)"/g, (_, head: string, sz: string) => `${head}${sized(Number(sz))}"`);
  const fallback = sized(paras[0]?.sz ?? DEFAULT_SZ);
  out = out
    .replace(/<a:rPr\b(?![^>]*\bsz=)([^>]*?)(\/?)>/g, (_, rest: string, close: string) => `<a:rPr${rest} sz="${fallback}"${close}>`)
    .replace(/<a:r>(\s*)<a:t\b/g, `<a:r>$1<a:rPr sz="${fallback}"/><a:t`);
  return out;
}

/** One line per box and text (the same word fills {{chu}} on several slides); the smallest size wins. */
export function groupFitted(notes: readonly FitNote[]): FitNote[] {
  const byKey = new Map<string, FitNote>();
  for (const n of notes) {
    const key = `${n.fields.join(",")}\u0000${n.text}`;
    const seen = byKey.get(key);
    if (!seen || n.scale < seen.scale) byKey.set(key, { ...n, overflow: n.overflow || !!seen?.overflow });
  }
  return [...byKey.values()];
}

/** The font size of a paragraph, in hundredths of a point (its first sized run, then the box's default). */
export function paragraphSize(para: string, sp: string): number {
  const own = /<a:(?:rPr|endParaRPr)\b[^>]*\bsz="(\d+)"/.exec(para)?.[1];
  const level = /<a:lstStyle>[\s\S]*?<a:defRPr\b[^>]*\bsz="(\d+)"/.exec(sp)?.[1];
  return Number(own ?? level ?? DEFAULT_SZ);
}
