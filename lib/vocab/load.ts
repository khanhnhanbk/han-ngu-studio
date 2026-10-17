import type { VocabData } from "./lookup";

let pending: Promise<VocabData> | null = null;

/** Fetch the HSK vocabulary once (memoised; retried after a failure). */
export function loadVocab(): Promise<VocabData> {
  if (!pending) {
    pending = fetch("/data/vocab.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<VocabData>;
      })
      .catch((err: unknown) => {
        pending = null;
        throw err;
      });
  }
  return pending;
}
