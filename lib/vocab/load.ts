import { memoJson } from "@/lib/fetchJson";

import type { VocabData } from "./lookup";

export const VOCAB_FILE = "/data/vocab.json";

/** Fetch the HSK vocabulary once (memoised; retried after a failure). */
export const loadVocab = memoJson<VocabData>(VOCAB_FILE);
