import { convert, pinyin } from "pinyin-pro";

import { hanvietLine } from "@/lib/anki/buildDeck";
import type { Meanings } from "@/lib/anki/load";
import type { HanvietData } from "@/lib/hanviet/lookup";
import { convertLine } from "@/lib/pinyin/convert";
import type { Tokenizer } from "@/lib/segment/tokenizer";

import { shuffle, type Rng } from "./rng";
import type { Question, QuizEntry, QuizKind, Skipped } from "./types";

export type QuizData = {
  tokenizer: Tokenizer;
  hanviet: HanvietData;
  meanings: Meanings;
};

export const MAX_ENTRIES = 200;
/** The answer plus up to three wrong options. */
const WRONG_OPTIONS = 3;
/** Most frequent dictionary words used to fill wrong options when the list is short. */
const FALLBACK_SIZE = 300;
const MEANING_MAX = 80;

const HAN = /^\p{Script=Han}+$/u;

/**
 * One entry per line: "word" or "word<Tab>meaning". Blank lines are dropped;
 * a repeated word is counted and its first line kept.
 */
export function parseEntries(text: string): { entries: QuizEntry[]; duplicates: number } {
  const byWord = new Map<string, QuizEntry>();
  let duplicates = 0;
  for (const line of text.split("\n")) {
    const tab = line.indexOf("\t");
    const word = (tab < 0 ? line : line.slice(0, tab)).trim();
    if (!word) continue;
    if (byWord.has(word)) {
      duplicates++;
      continue;
    }
    const meaning = tab < 0 ? "" : line.slice(tab + 1).trim();
    byWord.set(word, meaning ? { word, meaning } : { word });
  }
  return { entries: [...byWord.values()], duplicates };
}

// "四書|四书[Si4 shu1]" / "道行[dao4 heng2]": a cross-reference, not a meaning.
const CROSS_REF = /[^\s,;()]*\[[^\]]*\]/g;
// Senses that only point at another word or reading.
const POINTER = /^(used in|variant of|old variant of|see also|see|same as|also written|abbr\. for|surname)\b/i;

/**
 * A short meaning for an option, from a CC-CEDICT definition: senses (split
 * at "/" and ";") without cross-references and pointer senses ("used in …",
 * "variant of …"), joined while they fit in one line. "" when no real sense
 * is left, so the word is skipped rather than shown with a misleading meaning.
 */
export function shortMeaning(definition: string): string {
  const senses = definition
    .split(/[/;]/)
    .map((s) => s.replace(CROSS_REF, "").replace(/\s+/g, " ").replace(/\s+([,)])/g, "$1").trim())
    .filter((s) => s && !POINTER.test(s));
  if (senses.length === 0) return "";
  let out = senses[0].length > MEANING_MAX ? `${senses[0].slice(0, MEANING_MAX)}…` : senses[0];
  for (const s of senses.slice(1)) {
    if (out.length + 2 + s.length > MEANING_MAX) break;
    out += `; ${s}`;
  }
  return out;
}

/** Comparison key, so "Dà xué" and "dà xué" count as the same option. */
function norm(s: string): string {
  return s.normalize("NFC").trim().toLowerCase();
}

/** pinyin-pro "num" syllables for a word, in context (polyphones read correctly). */
function numberSyllables(data: QuizData, word: string): string[] {
  const line = convertLine(data.tokenizer, word, { toneStyle: "number", spacing: "syllable" });
  return line.segments.flatMap((seg) => (seg.kind === "han" ? seg.syllables : []));
}

/** "xue2" → "xué"; neutral tone 5 drops the digit. A non-syllable passes through. */
function toMark(syllable: string): string {
  if (!/[1-5]$/.test(syllable)) return syllable;
  if (syllable.endsWith("5")) return syllable.slice(0, -1);
  return convert(syllable, { format: "numToSymbol" });
}

function pinyinFrom(syllables: readonly string[]): string {
  return syllables.map(toMark).join(" ");
}

/** The word with one syllable's tone changed, every way: mǎ → mā, má, mà, ma. */
function toneVariants(syllables: readonly string[]): string[] {
  const out: string[] = [];
  syllables.forEach((s, i) => {
    const m = /^(.+)([1-5])$/.exec(s);
    if (!m) return;
    for (const tone of ["1", "2", "3", "4", "5"]) {
      if (tone === m[2]) continue;
      const next = [...syllables];
      next[i] = m[1] + tone;
      out.push(pinyinFrom(next));
    }
  });
  return out;
}

function charCount(s: string): number {
  return Array.from(s).length;
}

/**
 * Pick up to three wrong options, trying each group in turn (shuffled inside
 * a group). Anything equal to the answer, or to an option already picked, is
 * skipped. Returns null when no wrong option exists.
 */
function makeOptions(
  answer: string,
  groups: ReadonlyArray<readonly string[]>,
  rng: Rng,
): { options: string[]; answer: number } | null {
  const seen = new Set([norm(answer)]);
  const wrong: string[] = [];
  for (const group of groups) {
    for (const c of shuffle(group, rng)) {
      if (wrong.length >= WRONG_OPTIONS) break;
      const key = norm(c);
      if (!c || seen.has(key)) continue;
      seen.add(key);
      wrong.push(c);
    }
  }
  if (wrong.length === 0) return null;
  const options = shuffle([answer, ...wrong], rng);
  return { options, answer: options.indexOf(answer) };
}

type Info = {
  word: string;
  /** User meaning, else the short CC-CEDICT meaning, else "". */
  meaning: string;
  userMeaning: boolean;
  syllables: string[];
  pinyin: string;
  hanviet: string;
};

function describe(data: QuizData, entry: QuizEntry): Info {
  const syllables = numberSyllables(data, entry.word);
  const cedict = Object.hasOwn(data.meanings, entry.word) ? shortMeaning(data.meanings[entry.word]) : "";
  return {
    word: entry.word,
    meaning: entry.meaning ?? cedict,
    userMeaning: entry.meaning !== undefined,
    syllables,
    pinyin: syllables.length ? pinyinFrom(syllables) : "",
    hanviet: hanvietLine(data, entry.word),
  };
}

/** Prefer wrong options with as many characters as the word, so length gives nothing away. */
function bySameLength<T>(infos: readonly Info[], word: string, pick: (i: Info) => T): [T[], T[]] {
  const n = charCount(word);
  const same: T[] = [];
  const other: T[] = [];
  for (const i of infos) {
    if (i.word === word) continue;
    (charCount(i.word) === n ? same : other).push(pick(i));
  }
  return [same, other];
}

/**
 * Build a multiple-choice quiz: one question per entry and kind, in shuffled
 * order. Wrong options come from the user's own words first, then from the
 * most frequent dictionary words. Data that is missing is never guessed: the
 * word is reported in `skipped` for that kind.
 */
export function buildQuiz(
  data: QuizData,
  entries: readonly QuizEntry[],
  kinds: readonly QuizKind[],
  rng: Rng,
): { questions: Question[]; skipped: Skipped[] } {
  const own = entries.map((e) => describe(data, e));
  const ownWords = new Set(own.map((i) => i.word));
  const fallback = Object.keys(data.meanings)
    .filter((w) => HAN.test(w) && !ownWords.has(w))
    .slice(0, FALLBACK_SIZE)
    .map((word) => describe(data, { word }));

  const questions: Question[] = [];
  const skipped: Skipped[] = [];

  for (const info of own) {
    for (const kind of kinds) {
      const q = buildOne(data, kind, info, own, fallback, rng);
      if (q) questions.push(q);
      else skipped.push({ word: info.word, kind });
    }
  }
  return { questions: shuffle(questions, rng), skipped };
}

function buildOne(
  data: QuizData,
  kind: QuizKind,
  info: Info,
  own: readonly Info[],
  fallback: readonly Info[],
  rng: Rng,
): Question | null {
  const word = info.word;
  const make = (prompt: string, answer: string, groups: ReadonlyArray<readonly string[]>): Question | null => {
    if (!prompt || !answer) return null;
    const picked = makeOptions(answer, groups, rng);
    return picked && { kind, word, prompt, ...picked };
  };

  switch (kind) {
    case "hanToMeaning": {
      // Wrong meanings must come from the same source as the answer: mixing
      // the user's Vietnamese with CC-CEDICT English would give the answer away.
      const sameSource = (i: Info) => (i.userMeaning === info.userMeaning ? i.meaning : "");
      const groups = bySameLength(own, word, sameSource);
      if (!info.userMeaning) groups.push(...bySameLength(fallback, word, (i) => i.meaning));
      return make(word, info.meaning, groups);
    }
    case "meaningToHan": {
      // A word with the very same meaning would be a second right answer.
      const key = norm(info.meaning);
      const pick = (i: Info) => (norm(i.meaning) === key ? "" : i.word);
      return make(info.meaning, word, [...bySameLength(own, word, pick), ...bySameLength(fallback, word, pick)]);
    }
    case "hanToPinyin": {
      // A lone polyphone has more than one right reading (为 wèi / wéi), so
      // none of its readings can be a wrong option.
      const readings =
        charCount(word) === 1 ? new Set(pinyin(word, { multiple: true, type: "array" }).map(norm)) : new Set();
      const pick = (i: Info) => (readings.has(norm(i.pinyin)) ? "" : i.pinyin);
      return make(word, info.pinyin, [
        toneVariants(info.syllables).filter((v) => !readings.has(norm(v))),
        ...bySameLength(own, word, pick),
        ...bySameLength(fallback, word, pick),
      ]);
    }
    case "hanToHanviet": {
      // Same for a lone character with several readings (行 hành / hàng).
      const readings = new Set(
        charCount(word) === 1 ? (data.hanviet[word] ?? []).flatMap(([, r]) => r).map(norm) : [],
      );
      const pick = (i: Info) => (i.hanviet.split("/").some((r) => readings.has(norm(r))) ? "" : i.hanviet);
      return make(word, info.hanviet, [...bySameLength(own, word, pick), ...bySameLength(fallback, word, pick)]);
    }
  }
}
