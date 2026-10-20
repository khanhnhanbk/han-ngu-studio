import { memoJson } from "@/lib/fetchJson";

/**
 * Suggested memory stories ("Mẹo nhớ gợi ý"), keyed by the Simplified
 * character: [story, reviewed 0|1]. Our own content, built by
 * `pnpm build:data` from assets/dictionary/mnemonics.tsv.
 */
export type Mnemonics = Record<string, [string, 0 | 1]>;

export const MNEMONICS_FILE = "/data/mnemonics.json";

export const loadMnemonics = memoJson<Mnemonics>(MNEMONICS_FILE);

export type Suggestion = { story: string; reviewed: boolean };

/** The suggestion for a character (look it up with its Simplified form), or null. */
export function suggestionFor(data: Mnemonics | null, simpChar: string): Suggestion | null {
  const row = data && Object.hasOwn(data, simpChar) ? data[simpChar] : undefined;
  return row ? { story: row[0], reviewed: row[1] === 1 } : null;
}
