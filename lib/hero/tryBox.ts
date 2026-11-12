// No import from lib/practiceSheet here: it pulls in pinyin-pro, which the
// homepage only downloads once someone types (see components/Hero.tsx).
const HAN = /\p{Script=Han}/u;

/** Characters the homepage try-box starts with. */
export const TRY_DEFAULT = "永和九年";

/** How many cells the homepage preview shows. */
export const TRY_CELLS = 6;

/**
 * Pinyin of TRY_DEFAULT, written out so the homepage does not download
 * pinyin-pro until someone types. `tryBox.test.ts` checks it against getPinyin.
 */
export const TRY_DEFAULT_PINYIN = "yǒng hé jiǔ nián";

/** The Han characters typed in the try-box, in order (same filter as the sheet). */
export function tryChars(text: string): string[] {
  return Array.from(text).filter((c) => HAN.test(c));
}

/** Link to the practice sheet with the characters in the hash, never the query. */
export function practiceSheetLink(base: string, chars: string[]): string {
  return `${base}#chars=${encodeURIComponent(chars.join(""))}`;
}
