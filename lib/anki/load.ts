import { memoJson } from "@/lib/fetchJson";

/** { word: English definitions } (see scripts/build-data.mjs). */
export type Meanings = Record<string, string>;
/** { char: Wubi 86 code } from pywubi's table. */
export type WubiTable = Record<string, string>;

export const MEANINGS_FILE = "/data/meanings.json";
export const WUBI_FILE = "/data/wubi.json";

export const loadMeanings = memoJson<Meanings>(MEANINGS_FILE);
export const loadWubi = memoJson<WubiTable>(WUBI_FILE);
