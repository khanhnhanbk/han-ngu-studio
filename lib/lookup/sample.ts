import type { LookupCard } from "./card";
import sample from "./sample.json";

/** The word Tra từ shows when it opens without a #w= link. */
export const SAMPLE_WORD = "亲戚";

/**
 * Its card, built ahead of time by the same pipeline (lib/lookup/sample.test.ts
 * fails when the two differ; `UPDATE_SAMPLES=1 pnpm test` rewrites it), so the
 * page shows it without downloading the dictionaries (~1.8 MB) on open.
 */
export const SAMPLE_CARD = sample as LookupCard;
