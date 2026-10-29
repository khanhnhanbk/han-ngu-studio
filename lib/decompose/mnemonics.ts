import { memoJson } from "@/lib/fetchJson";

/**
 * Suggested memory stories ("Gợi ý ghi nhớ"), keyed by the Simplified
 * character: [story, reviewed 0|1, source?]. A row with a source explains the
 * character from its origin (etymology); one without is a memory trick made
 * up to help remember. Our own content, built by `pnpm build:data` from
 * assets/dictionary/mnemonics.tsv.
 */
export type Mnemonics = Record<string, [story: string, reviewed: 0 | 1, source?: string]>;

export const MNEMONICS_FILE = "/data/mnemonics.json";

export const loadMnemonics = memoJson<Mnemonics>(MNEMONICS_FILE);

/** "goc": from the character's origin, with a source; "meo": a memory trick, not history. */
export type SuggestionKind = "goc" | "meo";
export type Suggestion = { story: string; reviewed: boolean; kind: SuggestionKind; source: string };

/** The suggestion for a character (look it up with its Simplified form), or null. */
export function suggestionFor(data: Mnemonics | null, simpChar: string): Suggestion | null {
  const row = data && Object.hasOwn(data, simpChar) ? data[simpChar] : undefined;
  if (!row) return null;
  const source = row[2] ?? "";
  return { story: row[0], reviewed: row[1] === 1, kind: source ? "goc" : "meo", source };
}
