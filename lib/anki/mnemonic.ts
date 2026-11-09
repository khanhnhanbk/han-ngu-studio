import { suggestionFor, type Mnemonics } from "@/lib/decompose/mnemonics";

import { EXAMPLE_SEPARATOR } from "./buildDeck";

export type MnemonicLabels = { goc: string; draft: string };

/**
 * The "mnemonic" field of a card: the suggested memory story of each
 * character of the (Simplified) word that has one, "学: …", one per line.
 * Origin-based stories are marked, and so are stories not yet reviewed, as
 * on Chiết tự. The learner's own notes are not used (they stay on the page).
 */
export function wordMnemonic(data: Mnemonics | null, word: string, labels: MnemonicLabels): string {
  const lines: string[] = [];
  for (const char of new Set(Array.from(word))) {
    const s = suggestionFor(data, char);
    if (!s) continue;
    const tags = [s.kind === "goc" ? labels.goc : "", s.reviewed ? "" : labels.draft].filter(Boolean);
    lines.push(`${char}: ${s.story}${tags.length ? ` (${tags.join(", ")})` : ""}`);
  }
  return lines.join(EXAMPLE_SEPARATOR);
}
