export interface HighlightPart {
  text: string;
  highlighted: boolean;
}

/** Split a sentence into plain / highlighted parts (by code points, longest new word first). */
export function splitHighlight(sentence: string, newWords: string[]): HighlightPart[] {
  const chars = Array.from(sentence);
  const words = newWords
    .filter((w) => w)
    .map((w) => Array.from(w))
    .sort((a, b) => b.length - a.length);
  const parts: HighlightPart[] = [];
  let plain = "";
  let i = 0;
  while (i < chars.length) {
    const hit = words.find(
      (w) => i + w.length <= chars.length && w.every((c, k) => chars[i + k] === c),
    );
    if (hit) {
      if (plain) parts.push({ text: plain, highlighted: false });
      plain = "";
      parts.push({ text: hit.join(""), highlighted: true });
      i += hit.length;
    } else {
      plain += chars[i];
      i++;
    }
  }
  if (plain) parts.push({ text: plain, highlighted: false });
  return parts;
}
