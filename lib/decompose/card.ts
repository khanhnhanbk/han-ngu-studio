/**
 * "Thẻ chữ" share card (phase 12g): the content of the portrait PNG that
 * Chiết tự draws in the browser (components/decompose/ShareCard.tsx). Pure
 * logic here so it can be tested without a canvas.
 */
import type { SuggestionKind } from "@/lib/decompose/mnemonics";

/** Portrait size, the shape most phone galleries and social posts show in full. */
export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;

/** Printed at the bottom of every card. */
export const CARD_SITE = "han-ngu-studio.vercel.app";

/** Longest meaning shown for the character or a part, in characters. */
export const MAX_MEANING = 40;

export type CardPart = { char: string; hanviet: string; meaning: string };

/** Which story the card carries: our suggestion (with its badge) or the learner's own note. */
export type CardStory =
  | { from: "suggestion"; text: string; kind: SuggestionKind; reviewed: boolean; source: string }
  | { from: "own"; text: string };

export type CardModel = {
  char: string;
  pinyin: string;
  hanviet: string;
  meaning: string;
  parts: CardPart[];
  /** "氵 + 青 = 清", or "" when a part is unknown or there is only one part. */
  formula: string;
  story: CardStory | null;
};

/**
 * First sense of a "; "-joined meaning (vocabFor) or "Name · meaning"
 * (radicals), cut to `max` characters with an ellipsis.
 */
export function shortMeaning(meaning: string, max = MAX_MEANING): string {
  const first = meaning.split(/[;；]/)[0].trim();
  const chars = Array.from(first);
  return chars.length > max ? chars.slice(0, max - 1).join("").trimEnd() + "…" : first;
}

/** "氵 + 青 = 清": only when there are two or more parts and none is unknown. */
export function formulaOf(char: string, parts: readonly (string | null)[]): string {
  if (parts.length < 2 || parts.some((p) => !p)) return "";
  return `${parts.join(" + ")} = ${char}`;
}

/**
 * The story to print. The learner's own note goes on the card only when they
 * ticked "Dùng ghi chú của tôi" (useOwn); otherwise the suggestion, if any.
 */
export function pickStory(
  suggestion: { story: string; kind: SuggestionKind; reviewed: boolean; source: string } | null,
  own: string,
  useOwn: boolean,
): CardStory | null {
  if (useOwn && own.trim()) return { from: "own", text: own.trim() };
  if (suggestion) {
    const { story, kind, reviewed, source } = suggestion;
    return { from: "suggestion", text: story, kind, reviewed, source };
  }
  return null;
}

const HAN = /\p{Script=Han}/u;

/**
 * Space runs, and the pieces between them, cut further only between two Han
 * characters ("一二" → 一 | 二). Punctuation stays with its neighbour, so a
 * line never starts with ")" or "，" ("(亻)" is one piece).
 */
function tokenize(paragraph: string): string[] {
  const out: string[] = [];
  for (const run of paragraph.split(/(\s+)/)) {
    if (!run) continue;
    let piece = "";
    let prev = "";
    for (const ch of run) {
      if (piece && HAN.test(prev) && HAN.test(ch)) {
        out.push(piece);
        piece = "";
      }
      piece += ch;
      prev = ch;
    }
    out.push(piece);
  }
  return out;
}

/**
 * Break text into lines no wider than maxWidth. Splits at spaces (Vietnamese)
 * and between Han characters, which have no spaces; a run with neither that is
 * still too wide is broken by character. `measure` is the canvas measureText
 * width. Explicit newlines are kept.
 */
export function wrapText(text: string, maxWidth: number, measure: (s: string) => number): string[] {
  const out: string[] = [];
  for (const paragraph of text.split(/\r?\n/)) {
    const tokens = tokenize(paragraph);
    let line = "";
    for (const token of tokens) {
      const next = line + token;
      if (measure(next.trimEnd()) <= maxWidth) {
        line = next;
        continue;
      }
      if (line.trim()) out.push(line.trimEnd());
      line = token.trim() ? token : "";
      // A single token wider than the line: break it by character.
      while (line && measure(line) > maxWidth) {
        const chars = Array.from(line);
        let n = chars.length - 1;
        while (n > 1 && measure(chars.slice(0, n).join("")) > maxWidth) n--;
        out.push(chars.slice(0, n).join(""));
        line = chars.slice(n).join("");
      }
    }
    if (line.trim() || !paragraph.trim()) out.push(line.trimEnd());
  }
  return out;
}

/** Lines that fit in maxLines; the last one ends with "…" when text was cut. */
export function clampLines(lines: string[], maxLines: number, maxWidth: number, measure: (s: string) => number): string[] {
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1];
  while (last && measure(last + "…") > maxWidth) last = Array.from(last).slice(0, -1).join("");
  kept[maxLines - 1] = last.trimEnd() + "…";
  return kept;
}

/** "the-chu-清.png": the character stays in the name (browsers accept it). */
export function cardFileName(char: string): string {
  return `the-chu-${char}.png`;
}
