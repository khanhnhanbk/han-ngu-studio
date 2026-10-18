/** A row of examples/<shard>.json: [hanzi, vietnamese, english, flags]. */
export type ExampleRow = [string, string, string, number];

/** examples/<shard>.json (see buildExamples in scripts/build-data.mjs). */
export type ExampleShard = { rows: ExampleRow[]; index: Record<string, number[]> };

/** examples/manifest.json: shard name → HSK level, word → shard name. */
export type ExampleManifest = { shards: Record<string, string>; words: Record<string, string> };

/** Bit set in a row's flags when vi/en are Google Translate output. */
export const MACHINE_TRANSLATED = 1;

export type Example = {
  hanzi: string;
  vi: string;
  en: string;
  /** vi/en are machine translations, not checked by hand. */
  machine: boolean;
  /** Position in the word's candidate list (file order), the last tie-break. */
  order: number;
};

/** Candidate example sentences per word, unranked. */
export type ExampleBank = Record<string, Example[]>;
