import { memoJson } from "@/lib/fetchJson";

/** { word: English definitions } (see scripts/build-data.mjs). */
export type Meanings = Record<string, string>;
/** { char: Wubi 86 code } from pywubi's table. */
export type WubiTable = Record<string, string>;

export const loadMeanings = memoJson<Meanings>("/data/meanings.json");
export const loadWubi = memoJson<WubiTable>("/data/wubi.json");
