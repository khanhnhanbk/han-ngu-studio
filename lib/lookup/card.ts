import { convert, pinyin as toPinyin } from "pinyin-pro";

import type { Meanings } from "@/lib/anki/load";
import { lookupCvdict, wordsStartingWith, type CvdictShard } from "@/lib/cvdict/lookup";
import { rankExamples } from "@/lib/examples/rank";
import type { Example, ExampleBank } from "@/lib/examples/types";
import { hanvietForWord, toTone3, type HanvietData } from "@/lib/hanviet/lookup";
import { joinSyllables } from "@/lib/pinyin/convert";
import type { Tokenizer } from "@/lib/segment/tokenizer";
import { vocabFor, type Classifier, type VocabData } from "@/lib/vocab/lookup";

export type LookupData = {
  tokenizer: Tokenizer;
  hanviet: HanvietData;
  vocab: VocabData;
  meanings: Meanings;
  /** The CVDICT shard of the word's first character (lib/cvdict/load.ts). */
  cvdict: CvdictShard;
  /** Example candidates for the word (lib/examples). */
  examples: ExampleBank;
};

/** One reading of the word (好 hǎo and hào are two). */
export type LookupReading = {
  /** Tone marks, written as a word ("qīnqi", "Běijīng"). */
  pinyin: string;
  /** TONE3 per character ("qin1", "qi5"), for Hán Việt and pronunciation. */
  tone3: string[];
  /** Hán Việt, one reading per character, joined by spaces ("thân thích"). */
  hanviet: string;
  /** "HSK 1" … "HSK 7-9", or null when this reading is not in the HSK list. */
  level: string | null;
  /** Part-of-speech codes from the HSK list (lib/vocab/pos.ts). */
  pos: string[];
  /** Vietnamese senses: CVDICT's full list, else the HSK list's meaning. */
  senses: string[];
  classifiers: Classifier[];
  /** Traditional forms that differ from the word (親戚); [] when the same. */
  trad: string[];
};

export type LookupCard = {
  word: string;
  /** HSK readings first, then CVDICT's in its order; proper-noun readings (Qīn) last. [] when not found. */
  readings: LookupReading[];
  /** CC-CEDICT English line, "" when there is none. */
  english: string;
  /** Up to MAX_EXAMPLES sentences, easiest first (lib/examples/rank.ts). */
  examples: Example[];
  /** Longer words that start with this one, HSK words first, at most MAX_STARTS. */
  startsWith: string[];
};

export const MAX_EXAMPLES = 3;
export const MAX_STARTS = 20;
/** Longest input looked up as one word; longer text belongs in Đọc hiểu. */
export const MAX_LOOKUP_CHARS = 12;

/**
 * Group readings by Pinyin without spaces or apostrophes. Case counts: 书 shū
 * (book) and Shū (the Book of Documents) are separate readings.
 */
const pinyinKey = (p: string) => p.normalize("NFC").replace(/[\s'’]+/g, "");

/** A cross-reference as CC-CEDICT writes it: "書經|书经[Shu1 jing1]" or "好玩[hao3 wan2]". */
const CROSS_REF = /(?:[^\s|[\]，,;；()（）]+\|)?([^\s|[\]，,;；()（）]+)\[[^\]]*\]/gu;

/** "abbr. for 書經|书经[Shu1 jing1]" → "abbr. for 书经": the Simplified form only, as the page shows words. */
export function cleanSense(sense: string): string {
  return sense.replace(CROSS_REF, "$1");
}

/** "qīn qi" → ["qin1", "qi5"] (data TONE3); pinyin-pro's own reading when the syllables do not match the characters (好玩儿 "hǎo wánr"). */
function tone3Of(word: string, syllables: readonly string[]): string[] {
  const chars = Array.from(word);
  const source =
    syllables.length === chars.length
      ? syllables.map((s) => convert(s.toLowerCase(), { format: "symbolToNum" }))
      : toPinyin(word, { toneType: "num", type: "array" });
  return source.map(toTone3);
}

/** Lowest HSK level as a number for sorting ("7-9" → 7); unlisted words last. */
function levelRank(vocab: VocabData, word: string): number {
  if (!Object.hasOwn(vocab, word)) return 100;
  return Math.min(...vocab[word].map(([level]) => Number.parseInt(level, 10)));
}

/**
 * Everything the "Tra từ" page shows for one Simplified word: readings with
 * Pinyin, Hán Việt, HSK level, part of speech, senses and measure words; the
 * English line; the easiest example sentences; longer words with the same start.
 */
export function buildLookupCard(data: LookupData, word: string): LookupCard {
  const chars = Array.from(word);
  const cv = lookupCvdict(data.cvdict, word);
  const listed = Object.hasOwn(data.vocab, word) ? data.vocab[word] : [];

  // Readings in order: the HSK list's (lowest level first, as vocab.json keeps
  // them), then CVDICT's lower-case ones, then its proper nouns (亲 Qīn, a surname).
  const keys: string[] = [];
  const display = new Map<string, string[]>();
  const add = (pinyin: string, syllables: string[]) => {
    const key = pinyinKey(pinyin);
    if (!keys.includes(key)) keys.push(key);
    // CVDICT spells syllables out; the HSK list writes the word ("qīnqi").
    if (!display.has(key) || syllables.length > 1) display.set(key, syllables);
  };
  for (const [, pinyin] of listed) add(pinyin, [pinyin]);
  const lower = cv.filter((e) => e.pinyin === e.pinyin.toLowerCase());
  const proper = cv.filter((e) => e.pinyin !== e.pinyin.toLowerCase());
  for (const e of [...lower, ...proper]) add(e.pinyin, e.pinyin.split(" "));

  const readings = keys.map((key): LookupReading => {
    const syllables = display.get(key)!;
    const own = cv.filter((e) => pinyinKey(e.pinyin) === key);
    const hsk = listed.some(([, p]) => pinyinKey(p) === key) ? vocabFor(data.vocab, word, listed.find(([, p]) => pinyinKey(p) === key)![1]) : null;
    const senses: string[] = [];
    for (const e of own) for (const s of e.senses.map(cleanSense)) if (!senses.includes(s)) senses.push(s);
    if (!senses.length && hsk?.meaning) senses.push(...hsk.meaning.split("; "));
    const classifiers = [...(hsk?.classifiers ?? [])];
    for (const e of own) for (const c of e.classifiers) if (!classifiers.some((x) => x.hanzi === c.hanzi)) classifiers.push(c);
    const trad: string[] = [];
    for (const e of own) for (const t of e.trad) if (t !== word && !trad.includes(t)) trad.push(t);
    const tone3 = tone3Of(word, syllables.length === 1 && chars.length > 1 ? toPinyin(word, { type: "array" }) : syllables);
    return {
      pinyin: syllables.length > 1 ? joinSyllables(syllables, "word") : syllables[0],
      tone3,
      hanviet: hanvietForWord(data.hanviet, chars, tone3).replace(/_/g, " "),
      level: hsk?.level ?? null,
      pos: hsk?.pos ?? [],
      senses,
      classifiers,
      trad,
    };
  });

  const candidates = Object.hasOwn(data.examples, word) ? data.examples[word] : [];
  return {
    word,
    readings,
    english: Object.hasOwn(data.meanings, word) ? cleanSense(data.meanings[word]) : "",
    examples: rankExamples(data, word, candidates).slice(0, MAX_EXAMPLES),
    startsWith: wordsStartingWith(data.cvdict, word, (w) => levelRank(data.vocab, w))
      .sort((a, b) => levelRank(data.vocab, a) - levelRank(data.vocab, b))
      .slice(0, MAX_STARTS),
  };
}
