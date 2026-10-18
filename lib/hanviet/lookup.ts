/** { char: [[tone3, readings], …] } in first-seen order (see build-data.mjs). */
export type HanvietData = Record<string, Array<[string, string[]]>>;

/**
 * Convert a pinyin-pro "num" syllable to the data's TONE3 form:
 * neutral tone 0 → 5, ü → u: (nü3 → nu:3, le0 → le5).
 */
export function toTone3(syllable: string): string {
  return syllable.replace(/ü/g, "u:").replace(/0$/, "5");
}

/**
 * Hán Việt readings for one character, as in get_hanviet_for_word:
 * the exact (char, pinyin) entry, else the "*" (any reading) entry, else the
 * character's first entry. [] when the character is not in the data.
 */
export function lookupChar(data: HanvietData, char: string, tone3: string): string[] {
  const entries = data[char];
  if (!entries) return [];
  return (
    entries.find(([p]) => p === tone3)?.[1] ??
    entries.find(([p]) => p === "*")?.[1] ??
    entries[0]?.[1] ??
    []
  );
}

/** Every Hán Việt reading of a character, in data order, without repeats. */
export function allCharReadings(data: HanvietData | null, char: string): string[] {
  const out: string[] = [];
  for (const [, readings] of data?.[char] ?? []) {
    for (const r of readings) if (!out.includes(r)) out.push(r);
  }
  return out;
}

/**
 * Hán Việt for a word: readings of one character joined by "/", characters
 * joined by "_"; a character with no reading stays as is (trung_quốc).
 */
export function hanvietForWord(
  data: HanvietData,
  chars: readonly string[],
  tone3s: readonly string[],
): string {
  return chars
    .map((ch, i) => {
      const readings = lookupChar(data, ch, tone3s[i] ?? "");
      return readings.length ? readings.join("/") : ch;
    })
    .join("_");
}
