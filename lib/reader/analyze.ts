import type { Meanings } from "@/lib/anki/load";
import type { HanvietData } from "@/lib/hanviet/lookup";
import { analyzeLine } from "@/lib/hanviet/sentence";
import { joinSyllables } from "@/lib/pinyin/convert";
import type { Tokenizer } from "@/lib/segment/tokenizer";
import { vocabFor, type VocabData } from "@/lib/vocab/lookup";

/** HSK 3.0 levels as vocab.json writes them. */
export const HSK_LEVELS = ["1", "2", "3", "4", "5", "6", "7-9"] as const;
export type HskLevel = (typeof HSK_LEVELS)[number];

export type ReaderData = {
  tokenizer: Tokenizer;
  hanviet: HanvietData;
  vocab: VocabData;
  meanings: Meanings;
};

export type ReaderWord = {
  kind: "word";
  /** The word as analysed (Simplified; the page relabels it for Phồn thể). */
  text: string;
  /** Pinyin with tone marks, written as a word ("yínháng"). */
  pinyin: string;
  /** Hán Việt, one reading per character, joined by spaces ("ngân hàng"). */
  hanviet: string;
  /** Lowest HSK 3.0 level of the word for this reading; null when not in the list. */
  level: HskLevel | null;
  /**
   * For a word outside the HSK list: each character's own lowest HSK level
   * (null if unlisted), as a hint. The word itself keeps level null: a word
   * is not as easy as its characters (银行 is not 银 + 行).
   */
  chars?: Array<[string, HskLevel | null]>;
  meaningVi: string;
  meaningEn: string;
};

export type ReaderToken = ReaderWord | { kind: "other"; text: string };
export type ReaderLine = ReaderToken[];

/** Rank of a level for comparisons ("7-9" after "6"); outside HSK ranks last. */
export function levelRank(level: HskLevel | null): number {
  return level === null ? HSK_LEVELS.length : HSK_LEVELS.indexOf(level);
}

/**
 * Words of each line with their reading help. Segmentation, whole-line
 * Pinyin (polyphones read in context) and Hán Việt come from the Hán Việt
 * tool's analyzeLine; the HSK level and Vietnamese meaning are matched by
 * that Pinyin (好 hǎo, not hào), the English meaning from CC-CEDICT.
 */
export function analyzeText(data: ReaderData, text: string): ReaderLine[] {
  return text.split("\n").map((raw) => {
    const source = raw.replace(/\r$/, "");
    const line = analyzeLine(data.tokenizer, data.hanviet, source);
    const tokens = line.words.map((w): ReaderToken => {
      if (w.kind !== "han") return { kind: "other", text: w.text };
      const info = vocabFor(data.vocab, w.hanzi, w.pinyin.join(" "));
      return {
        kind: "word",
        text: w.hanzi,
        pinyin: joinSyllables(w.pinyin, "word"),
        // analyzeLine joins a word's readings with "_" for its TSV columns.
        hanviet: w.hanviet.replace(/_/g, " "),
        level: info ? (info.level.replace(/^HSK /, "") as HskLevel) : null,
        ...(info ? {} : { chars: w.chars.map((c): [string, HskLevel | null] => [c, listedLevel(data.vocab, c)]) }),
        meaningVi: info?.meaning ?? "",
        meaningEn: Object.hasOwn(data.meanings, w.hanzi) ? data.meanings[w.hanzi] : "",
      };
    });
    return withGaps(source, tokens);
  });
}

/** Lowest HSK level a word is listed at (any reading), or null. */
function listedLevel(vocab: VocabData, word: string): HskLevel | null {
  const info = vocabFor(vocab, word);
  return info ? (info.level.replace(/^HSK /, "") as HskLevel) : null;
}

/**
 * Segmentation drops whitespace between tokens; put the skipped text back as
 * "other" tokens so the reader shows the line exactly as typed. Walks the
 * line in code points (non-BMP safe).
 */
function withGaps(source: string, tokens: ReaderToken[]): ReaderToken[] {
  const chars = Array.from(source);
  const out: ReaderToken[] = [];
  let pos = 0;
  for (const token of tokens) {
    const tok = Array.from(token.text);
    let at = pos;
    while (at + tok.length <= chars.length && !tok.every((c, j) => chars[at + j] === c)) at++;
    if (at + tok.length > chars.length) {
      out.push(token); // not found (should not happen): keep the token as is
      continue;
    }
    if (at > pos) out.push({ kind: "other", text: chars.slice(pos, at).join("") });
    out.push(token);
    pos = at + tok.length;
  }
  if (pos < chars.length) out.push({ kind: "other", text: chars.slice(pos).join("") });
  return out;
}
