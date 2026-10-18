import { memoJson } from "@/lib/fetchJson";

import type { DecomposeData } from "./types";

export const DECOMPOSE_FILE = "/data/decompose.json";

/** Fetch the decomposition table once (memoised; retried after a failure). */
export const loadDecompose = memoJson<DecomposeData>(DECOMPOSE_FILE);
