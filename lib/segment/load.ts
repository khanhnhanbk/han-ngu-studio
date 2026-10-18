import { markLoaded } from "@/lib/data/loaded";

import { createTokenizer, type Tokenizer } from "./tokenizer";

const WORD_LIST_URL = "/data/word_list.txt";

/** Files loadTokenizer / loadWordListLines download (for lib/data/budget.ts). */
export const TOKENIZER_FILES = [WORD_LIST_URL];

let pendingLines: Promise<string[]> | null = null;
let pending: Promise<Tokenizer> | null = null;

/** Fetch the raw word list lines once (memoised; failures are not cached). */
export function loadWordListLines(): Promise<string[]> {
  if (!pendingLines) {
    pendingLines = fetch(WORD_LIST_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        markLoaded(WORD_LIST_URL);
        return text;
      })
      .then((text) => text.split("\n"))
      .catch((err: unknown) => {
        // Allow a retry on the next call.
        pendingLines = null;
        throw err;
      });
  }
  return pendingLines;
}

/** Build the tokenizer from the shared word list (memoised). */
export function loadTokenizer(): Promise<Tokenizer> {
  if (!pending) {
    pending = loadWordListLines()
      .then((lines) => createTokenizer(lines))
      .catch((err: unknown) => {
        pending = null;
        throw err;
      });
  }
  return pending;
}
