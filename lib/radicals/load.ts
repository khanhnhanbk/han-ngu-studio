import { memoJson } from "@/lib/fetchJson";

import type { Radical } from "./types";

export const RADICALS_FILE = "/data/radicals.json";

/** Fetch the radical table once (memoised; retried after a failure). */
export const loadRadicals = memoJson<Radical[]>(RADICALS_FILE);
