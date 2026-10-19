/**
 * Passing a word list to another tool (Đọc hiểu → Anki, Quiz) in the URL
 * hash, "#words=学习%0A朋友". The hash is never sent to the server, so the
 * words stay on the device (same rule as #c= and #chars=).
 */
export function wordsHash(words: readonly string[]): string {
  return `#${new URLSearchParams({ words: words.join("\n") })}`;
}

/** The words of a "#words=…" hash, one per line; empty when there are none. */
export function parseWordsHash(hash: string): string[] {
  const value = new URLSearchParams(hash.replace(/^#/, "")).get("words") ?? "";
  return value
    .split("\n")
    .map((w) => w.trim())
    .filter(Boolean);
}
