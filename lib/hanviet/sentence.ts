import { convertLine, joinSyllables } from "@/lib/pinyin/convert";
import type { Tokenizer } from "@/lib/segment/tokenizer";

import { hanvietForWord, lookupChar, toTone3, type HanvietData } from "./lookup";

export type HanvietWord =
  | {
      kind: "han";
      hanzi: string;
      chars: string[];
      /** Pinyin with tone marks, one per character. */
      pinyin: string[];
      /** TONE3 keys used for the lookup, one per character. */
      tone3: string[];
      hanviet: string;
    }
  | { kind: "other"; text: string };

export type HanvietLine = {
  source: string;
  words: HanvietWord[];
  /** Words separated by spaces, like hanviet.py ("Segmented (Space)"). */
  segmented: string;
  pinyin: string;
  hanviet: string;
};

/**
 * Port of process_sentence in hanviet.py: segment, then Pinyin and Hán Việt
 * per word, every column joined by single spaces so word i lines up.
 *
 * Pinyin comes from the whole line (see lib/pinyin/convert.ts) instead of
 * per word, so the right reading of polyphones is looked up (了 → le5).
 */
export function analyzeLine(
  tokenizer: Tokenizer,
  data: HanvietData,
  line: string,
): HanvietLine {
  const marks = convertLine(tokenizer, line, { toneStyle: "mark", spacing: "word" });
  const nums = convertLine(tokenizer, line, { toneStyle: "number", spacing: "word" });

  const words: HanvietWord[] = marks.segments.map((seg, i) => {
    const num = nums.segments[i];
    if (seg.kind !== "han" || num.kind !== "han") {
      return { kind: "other", text: seg.kind === "other" ? seg.text : seg.chars.join("") };
    }
    const tone3 = num.syllables.map(toTone3);
    return {
      kind: "han",
      hanzi: seg.chars.join(""),
      chars: seg.chars,
      pinyin: seg.syllables,
      tone3,
      hanviet: hanvietForWord(data, seg.chars, tone3),
    };
  });

  const col = (pick: (w: Extract<HanvietWord, { kind: "han" }>) => string) =>
    words.map((w) => (w.kind === "han" ? pick(w) : w.text)).join(" ");

  return {
    source: line,
    words,
    segmented: col((w) => w.hanzi),
    pinyin: col((w) => joinSyllables(w.pinyin, "word")),
    hanviet: col((w) => w.hanviet),
  };
}

export function analyzeText(
  tokenizer: Tokenizer,
  data: HanvietData,
  text: string,
): HanvietLine[] {
  return text.split("\n").map((l) => analyzeLine(tokenizer, data, l.replace(/\r$/, "")));
}

/** Every reading of every character in a word, for the details panel. */
export function allReadings(data: HanvietData, chars: readonly string[], tone3: readonly string[]) {
  return chars.map((char, i) => ({
    char,
    used: lookupChar(data, char, tone3[i] ?? ""),
    entries: data[char] ?? [],
  }));
}

const TSV_HEADER = ["Original Sentence", "Segmented (Space)", "Pinyin", "Han Viet"];

/** TSV with the same columns as hanviet.py; empty lines stay empty rows. */
export function toTsv(lines: HanvietLine[]): string {
  const clean = (s: string) => s.replace(/\t/g, " ");
  const rows = lines.map((l) =>
    l.source.trim()
      ? [l.source, l.segmented, l.pinyin, l.hanviet].map(clean).join("\t")
      : "\t\t\t",
  );
  return [TSV_HEADER.join("\t"), ...rows].join("\n");
}
