import type { WubiTable } from "./load";

// pywubi's RE_HANS: 〇 and U+4E00–U+FA29. Anything else is not looked up.
const WUBI_HAN = /^[〇一-﨩]$/;

/**
 * Port of pywubi's wubi(text) (single-character mode) joined by spaces, as
 * anki_desk.py's generate_wubi_line did: each Han character becomes its
 * longest code (or stays as is if the table has none); runs of other
 * characters are kept together as one item.
 */
export function wubiLine(table: WubiTable, text: string): string {
  const out: string[] = [];
  let other = "";
  for (const ch of text) {
    if (WUBI_HAN.test(ch)) {
      if (other) {
        out.push(other);
        other = "";
      }
      out.push(table[ch] ?? ch);
    } else {
      other += ch;
    }
  }
  if (other) out.push(other);
  return out.join(" ");
}
