import { convert, pinyin } from "pinyin-pro";

import { hanvietLine } from "@/lib/anki/buildDeck";
import type { Meanings, Sentences } from "@/lib/anki/load";
import type { HanvietData } from "@/lib/hanviet/lookup";
import { convertLine } from "@/lib/pinyin/convert";
import { segment, type Tokenizer } from "@/lib/segment/tokenizer";
import { vocabFor, type VocabData } from "@/lib/vocab/lookup";

import { shuffle, type Rng } from "./rng";
import { KINDS, type ChoiceKind, type Question, type QuizEntry, type QuizKind, type QuizOrder, type Response, type Skipped } from "./types";

export type QuizData = {
  tokenizer: Tokenizer;
  hanviet: HanvietData;
  meanings: Meanings;
  sentences: Sentences;
  vocab: VocabData;
};

export const MAX_ENTRIES = 200;
/** The answer plus up to three wrong options. */
const WRONG_OPTIONS = 3;
/**
 * Words used to fill wrong options when the list is short: this many of the
 * lowest-level HSK words and this many of the most frequent dictionary words.
 */
const FALLBACK_SIZE = 300;
const MEANING_MAX = 80;

const HAN = /^\p{Script=Han}+$/u;
/** Shown in place of the word in a cloze sentence. */
export const BLANK = "＿＿";
/** Longer sentences make the ordering exercise a chore. */
const MAX_ORDER_TOKENS = 12;
const PUNCT = /^[\p{P}\s]+$/u;

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
  /** User meaning, else the HSK Vietnamese meaning, else the short CC-CEDICT meaning, else "". */
  meaning: string;
  /** Language of `meaning`: the user's own and the HSK list count as Vietnamese. */
  lang: "vi" | "en";
  syllables: string[];
  pinyin: string;
  hanviet: string;
};

function describe(data: QuizData, entry: QuizEntry): Info {
  const syllables = numberSyllables(data, entry.word);
  const pinyin = syllables.length ? pinyinFrom(syllables) : "";
  // The word's own reading picks the HSK entry (好 hǎo, not hào).
  const hsk = vocabFor(data.vocab, entry.word, pinyin);
  const cedict = Object.hasOwn(data.meanings, entry.word) ? shortMeaning(data.meanings[entry.word]) : "";
  const vi = entry.meaning ?? (hsk ? shortMeaning(hsk.meaning) : "");
  return {
    word: entry.word,
    meaning: vi || cedict,
    lang: vi ? "vi" : "en",
    syllables,
    pinyin,
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
  order: QuizOrder = "random",
): { questions: Question[]; skipped: Skipped[] } {
  const own = entries.map((e) => describe(data, e));
  const ownWords = new Set(own.map((i) => i.word));
  const pool = (words: string[]) => words.filter((w) => HAN.test(w) && !ownWords.has(w)).slice(0, FALLBACK_SIZE);
  const fallbackWords = new Set([...pool(Object.keys(data.vocab)), ...pool(Object.keys(data.meanings))]);
  const fallback = [...fallbackWords].map((word) => describe(data, { word }));

  const questions: Question[] = [];
  const skipped: Skipped[] = [];

  const add = (info: Info, kind: QuizKind) => {
    const q = buildOne(data, kind, info, own, fallback, rng);
    if (q) questions.push(q);
    else skipped.push({ word: info.word, kind });
  };

  // Grouped: one block per type, words in the order they were typed.
  if (order === "byKind") {
    for (const kind of KINDS.filter((k) => kinds.includes(k))) for (const info of own) add(info, kind);
    return { questions, skipped };
  }
  for (const info of own) for (const kind of kinds) add(info, kind);
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
  const make = (
    choice: ChoiceKind,
    prompt: string,
    answer: string,
    groups: ReadonlyArray<readonly string[]>,
    hint?: string,
  ): Question | null => {
    if (!prompt || !answer) return null;
    const picked = makeOptions(answer, groups, rng);
    return picked && { kind: choice, word, prompt, ...(hint ? { hint } : {}), ...picked };
  };

  switch (kind) {
    case "hanToMeaning": {
      // Wrong meanings must be in the same language as the answer: one English
      // option among Vietnamese ones (or the reverse) would give it away.
      const sameLang = (i: Info) => (i.lang === info.lang ? i.meaning : "");
      return make(kind, word, info.meaning, [...bySameLength(own, word, sameLang), ...bySameLength(fallback, word, sameLang)]);
    }
    case "meaningToHan": {
      // A word with the very same meaning would be a second right answer.
      const key = norm(info.meaning);
      const pick = (i: Info) => (norm(i.meaning) === key ? "" : i.word);
      return make(kind, info.meaning, word, [...bySameLength(own, word, pick), ...bySameLength(fallback, word, pick)]);
    }
    case "hanToPinyin": {
      // A lone polyphone has more than one right reading (为 wèi / wéi), so
      // none of its readings can be a wrong option.
      const readings =
        charCount(word) === 1 ? new Set(pinyin(word, { multiple: true, type: "array" }).map(norm)) : new Set();
      const pick = (i: Info) => (readings.has(norm(i.pinyin)) ? "" : i.pinyin);
      return make(kind, word, info.pinyin, [
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
      return make(kind, word, info.hanviet, [...bySameLength(own, word, pick), ...bySameLength(fallback, word, pick)]);
    }
    case "cloze": {
      const s = sentenceFor(data, word);
      if (!s) return null;
      // Blank the first occurrence. indexOf is safe for astral characters:
      // a well-formed word cannot match half of a surrogate pair.
      const at = s.text.indexOf(word);
      const prompt = s.text.slice(0, at) + BLANK + s.text.slice(at + word.length);
      // A word already in the sentence makes an odd wrong option.
      const pick = (i: Info) => (s.text.includes(i.word) ? "" : i.word);
      return make(kind, prompt, word, [...bySameLength(own, word, pick), ...bySameLength(fallback, word, pick)], s.hint);
    }
    case "ordering": {
      const s = sentenceFor(data, word);
      if (!s) return null;
      const words = [...segment(data.tokenizer, s.text)[0]];
      let end = "";
      while (words.length && PUNCT.test(words[words.length - 1])) end = words.pop() + end;
      if (words.length < 3 || words.length > MAX_ORDER_TOKENS) return null;
      const original = words.join("");
      let tokens = words;
      for (let i = 0; i < 10 && tokens.join("") === original; i++) tokens = shuffle(words, rng);
      // Every order reads the same (e.g. 哈哈哈): nothing to practise.
      if (tokens.join("") === original) return null;
      return { kind, word, hint: s.hint, tokens, end, answer: words };
    }
  }
}

/**
 * The word's example sentence and its translation (Vietnamese, else English).
 * Null when there is none, the sentence lacks the word, or it has no
 * translation: without one, more than one option could fit the blank.
 */
function sentenceFor(data: QuizData, word: string): { text: string; hint: string } | null {
  if (!Object.hasOwn(data.sentences.index, word)) return null;
  const [text, vi, en] = data.sentences.rows[data.sentences.index[word]];
  const hint = vi || en;
  return text.includes(word) && hint ? { text, hint } : null;
}

export function isCorrect(question: Question, response: Response | null): boolean {
  if (response === null) return false;
  if (question.kind === "ordering") {
    // Compare the text, so swapping two identical words still counts as right.
    return Array.isArray(response) && response.join("") === question.answer.join("");
  }
  return response === question.answer;
}

/** The same questions in a new order, each with its options (or words) reshuffled. */
export function reshuffle(questions: readonly Question[], rng: Rng, order: QuizOrder = "random"): Question[] {
  // Grouped quizzes keep their question order; only options and words move.
  return (order === "byKind" ? questions : shuffle(questions, rng)).map((q) => {
    if (q.kind === "ordering") {
      const original = q.answer.join("");
      let tokens = shuffle(q.tokens, rng);
      for (let i = 0; i < 10 && tokens.join("") === original; i++) tokens = shuffle(q.tokens, rng);
      return { ...q, tokens };
    }
    const options = shuffle(q.options, rng);
    return { ...q, options, answer: options.indexOf(q.options[q.answer]) };
  });
}
