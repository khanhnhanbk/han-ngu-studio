import { pinyin } from "pinyin-pro";

import { toTone3 } from "@/lib/hanviet/lookup";

/**
 * TONE3 of a word's most common reading, for pages with no sentence context
 * (stroke order, Chiết tự, radicals): used only when the character has no
 * recording of its own, to pick the syllable recording.
 */
export function defaultTone3(word: string): string[] {
  return pinyin(word, { toneType: "num", type: "array" }).map(toTone3);
}
