/**
 * freq_rank from the raw word list lines: rank = 1-based line number.
 * Blank lines are skipped but still counted; later duplicates overwrite.
 * Note: Python `strip()` and JS `trim()` differ slightly on some Unicode
 * whitespace (e.g. U+001C-U+001F are stripped by Python only, U+FEFF by JS
 * only); irrelevant for normal word lists.
 */
export function buildFreqRank(lines: string[]): Map<string, number> {
  const rank = new Map<string, number>();
  lines.forEach((line, i) => {
    const w = line.trim();
    if (w) rank.set(w, i + 1);
  });
  return rank;
}
