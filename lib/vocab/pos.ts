/**
 * Part-of-speech codes used by the HSK 3.0 list (ivankra/hsk30 `POS` column,
 * from GF 0025-2021). "Pr" is the list's shorter spelling of "Pron" (谁, 有些).
 * The labels live in i18n (`vocab.pos`); a code not listed here is shown as is.
 */
export const POS_CODES = [
  "N",
  "V",
  "Adj",
  "Adv",
  "M",
  "Num",
  "Pron",
  "Prep",
  "Conj",
  "Aux",
  "Intj",
  "Prefix",
  "Suffix",
  "Name",
  "Phonetic",
] as const;

export type PosCode = (typeof POS_CODES)[number];

const ALIASES: Record<string, PosCode> = { Pr: "Pron" };

/** The canonical code for a list code, or null when it is not one we know. */
export function posCode(code: string): PosCode | null {
  if (Object.hasOwn(ALIASES, code)) return ALIASES[code];
  return (POS_CODES as readonly string[]).includes(code) ? (code as PosCode) : null;
}

/** Label for a code from `labels` (i18n `vocab.pos`); unknown codes are kept, never dropped. */
export function posLabel(labels: Record<PosCode, string>, code: string): string {
  const known = posCode(code);
  return known ? labels[known] : code;
}

/** Labels for a word's codes, with aliases merged ("Pr" and "Pron" give one "Đại từ"). */
export function posLabels(labels: Record<PosCode, string>, codes: readonly string[]): string[] {
  const out: string[] = [];
  for (const c of codes) {
    const label = posLabel(labels, c);
    if (!out.includes(label)) out.push(label);
  }
  return out;
}
