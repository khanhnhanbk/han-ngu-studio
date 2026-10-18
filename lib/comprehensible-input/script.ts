import { createAligner, type ScriptConverter } from "@/lib/script/convert";

import { splitHighlight, type HighlightPart } from "./highlight";
import type { OrderedRow } from "./order";

export type ShownRow = OrderedRow & { parts: HighlightPart[] };

/** Known words in Simplified, like the sentences the sort runs on. */
export function simpKnown(conv: ScriptConverter, known: ReadonlySet<string>): Set<string> {
  return conv.script === "simp" ? new Set(known) : new Set([...known].map((w) => conv.toSimp(w)));
}

/**
 * A sorted row (Simplified) shown in the chosen script. `source` is the
 * sentence as the user typed it. The highlight is split on the Simplified
 * text, then each part is sliced from the shown sentence, so a new word keeps
 * the form it has in its sentence. Giản thể mode only adds the parts.
 */
export function showRow(row: OrderedRow, source: string, conv: ScriptConverter): ShownRow {
  const parts = splitHighlight(row.text, row.newWords);
  if (conv.script === "simp") return { ...row, parts };
  const text = conv.toShown(source);
  const take = createAligner(row.text, text);
  const shownParts = parts.map((p) => ({ ...p, text: take(p.text) }));
  const seen = new Map<string, string>();
  parts.forEach((p, i) => {
    if (p.highlighted && !seen.has(p.text)) seen.set(p.text, shownParts[i].text);
  });
  const newWords = row.newWords.map((w) => seen.get(w) ?? conv.toShown(w));
  return { ...row, text, newWords, parts: shownParts };
}
