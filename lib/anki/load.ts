/** { word: English definitions } (see scripts/build-data.mjs). */
export type Meanings = Record<string, string>;
/** First example sentence per word: rows are [hanzi, vietnamese, english]. */
export type Sentences = { rows: Array<[string, string, string]>; index: Record<string, number> };
/** { char: Wubi 86 code } from pywubi's table. */
export type WubiTable = Record<string, string>;

function memoJson<T>(url: string): () => Promise<T> {
  let pending: Promise<T> | null = null;
  return () => {
    if (!pending) {
      pending = fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json() as Promise<T>;
        })
        .catch((err: unknown) => {
          // Allow a retry on the next call.
          pending = null;
          throw err;
        });
    }
    return pending;
  };
}

export const loadMeanings = memoJson<Meanings>("/data/meanings.json");
export const loadSentences = memoJson<Sentences>("/data/sentences.json");
export const loadWubi = memoJson<WubiTable>("/data/wubi.json");
