import { createTokenizer, type Tokenizer } from "./tokenizer";

const WORD_LIST_URL = "/data/word_list.txt";

let pending: Promise<Tokenizer> | null = null;

/** Fetch the word list once and build the tokenizer (memoised). */
export function loadTokenizer(): Promise<Tokenizer> {
  if (!pending) {
    pending = fetch(WORD_LIST_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => createTokenizer(text.split("\n")))
      .catch((err: unknown) => {
        // Allow a retry on the next call.
        pending = null;
        throw err;
      });
  }
  return pending;
}
