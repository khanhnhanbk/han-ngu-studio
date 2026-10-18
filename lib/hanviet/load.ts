import { memoJson } from "@/lib/fetchJson";

import type { HanvietData } from "./lookup";

export const HANVIET_FILE = "/data/hanviet.json";

/** Fetch the Hán Việt table once (memoised; retried after a failure). */
export const loadHanviet = memoJson<HanvietData>(HANVIET_FILE);
