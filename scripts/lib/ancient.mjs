// Shared by scripts/fetch-ancient.mjs and scripts/build-data.mjs (and tested
// from lib/ancient/ancient.test.ts): old glyph forms from the Wikimedia
// Commons "Ancient Chinese characters project" (phase 12d).

/** File-name suffixes on Commons, oldest first: 人-oracle.svg … 人-seal.svg. */
export const ANCIENT_FORMS = ["oracle", "bronze", "bigseal", "seal"];

/** Licences we accept (LicenseShortName on the file page). Anything else is skipped. */
export const ANCIENT_LICENCES = new Set(["Public domain", "CC0"]);

// Must match ANCIENT_SHARDS and ancientShard() in lib/ancient/load.ts.
export const ANCIENT_SHARDS = 128;

/** FNV-1a over the character's code point, modulo ANCIENT_SHARDS (as cvdictShard). */
export function ancientShard(char) {
  let h = 0x811c9dc5;
  h ^= char.codePointAt(0);
  h = Math.imul(h, 0x01000193) >>> 0;
  return h % ANCIENT_SHARDS;
}

const number = (s) => {
  const n = Number.parseFloat(s ?? "");
  return Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * Strip an ACC SVG down to what draws: no XML declaration, comments,
 * metadata, editor (Inkscape/Sodipodi) elements or attributes, ids, titles.
 * Adds a viewBox from width/height when missing and drops width/height so
 * the image scales. Returns null for anything that could reach outside the
 * file or run code (image, script, foreignObject, style, href, url(), on…),
 * which the ACC drawings never need.
 */
export function cleanSvg(text) {
  // A plain DOCTYPE line (potrace writes one) is dropped; one with an
  // internal subset ("[ … ]", where entities live) is refused.
  if (/<(image|script|foreignObject|style|use|a)\b|href\s*=|url\(|\son\w+\s*=|<!ENTITY|<!DOCTYPE[^>]*\[/i.test(text)) return null;
  let svg = text
    .replace(/<\?xml[\s\S]*?\?>/g, "")
    .replace(/<!DOCTYPE[^>[]*>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<metadata\b[\s\S]*?<\/metadata>/g, "")
    .replace(/<(title|desc)\b[\s\S]*?<\/\1>/g, "")
    .replace(/<sodipodi:namedview\b[\s\S]*?(\/>|<\/sodipodi:namedview>)/g, "")
    .replace(/<defs\b[^>]*\/>/g, "")
    .replace(/<defs\b[^>]*>\s*<\/defs>/g, "")
    .trim();
  const open = svg.match(/<svg\b[^>]*>/);
  if (!open || !svg.endsWith("</svg>")) return null;
  const attr = (name) => open[0].match(new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`))?.[1];
  let viewBox = attr("viewBox");
  if (!viewBox) {
    const w = number(attr("width"));
    const h = number(attr("height"));
    if (!w || !h) return null;
    viewBox = `0 0 ${w} ${h}`;
  }
  const body = svg
    .slice(open.index + open[0].length, -"</svg>".length)
    .replace(/\s(inkscape|sodipodi|xmlns|xml|dc|cc|rdf):?[\w-]*\s*=\s*"[^"]*"/g, "")
    .replace(/\s(id|class|aria-label)\s*=\s*"[^"]*"/g, "")
    .replace(/<\/?(inkscape|sodipodi):[^>]*>/g, "")
    // One decimal is a tenth of a pixel on the 300-unit canvas.
    .replace(/(\d\.\d)\d+/g, "$1")
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (!/<(path|polygon|polyline|rect|circle|ellipse|line)\b/.test(body)) return null;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body}</svg>`;
}
