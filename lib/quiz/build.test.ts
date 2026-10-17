import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import type { Meanings, Sentences } from "@/lib/anki/load";
import type { HanvietData } from "@/lib/hanviet/lookup";
import { vocabFor, type VocabData } from "@/lib/vocab/lookup";
import { createTokenizer } from "@/lib/segment/tokenizer";

import { BLANK, buildQuiz, isCorrect, parseEntries, reshuffle, shortMeaning, type QuizData } from "./build";
import { printText, toTsv } from "./export";
import { createRng, shuffle } from "./rng";
import { KINDS, type ChoiceKind, type ChoiceQuestion, type OrderQuestion, type Question, type QuizKind } from "./types";

const dataDir = join(__dirname, "../../public/data");
const json = <T,>(name: string) => JSON.parse(readFileSync(join(dataDir, name), "utf-8")) as T;

const data: QuizData = {
  tokenizer: createTokenizer(readFileSync(join(dataDir, "word_list.txt"), "utf-8").split("\n")),
  hanviet: json<HanvietData>("hanviet.json"),
  meanings: json<Meanings>("meanings.json"),
  sentences: json<Sentences>("sentences.json"),
  vocab: json<VocabData>("vocab.json"),
};

/** The four word-level kinds; cloze and ordering need an example sentence. */
const WORD_KINDS: ChoiceKind[] = ["hanToMeaning", "meaningToHan", "hanToPinyin", "hanToHanviet"];

const WORDS = ["大学", "学习", "朋友", "喜欢", "电脑", "妈妈", "好"].map((word) => ({ word }));

function find(questions: Question[], kind: ChoiceKind, word: string): ChoiceQuestion {
  const q = questions.find((x) => x.kind === kind && x.word === word);
  if (!q || q.kind === "ordering") throw new Error(`no ${kind} question for ${word}`);
  return q;
}

function findOrder(questions: Question[], word: string): OrderQuestion {
  const q = questions.find((x) => x.kind === "ordering" && x.word === word);
  if (!q || q.kind !== "ordering") throw new Error(`no ordering question for ${word}`);
  return q;
}

const vocabMeanings = new Set(
  Object.values(data.vocab).flatMap((entries) => entries.map(([, , m]) => shortMeaning(m))),
);

const choices = (qs: Question[]) => qs.filter((q): q is ChoiceQuestion => q.kind !== "ordering");

describe("parseEntries", () => {
  it("reads an optional meaning after a tab and drops duplicates", () => {
    const { entries, duplicates } = parseEntries("大学\tđại học\n\n 学习 \n大学\tkhác\n");
    expect(entries).toEqual([{ word: "大学", meaning: "đại học" }, { word: "学习" }]);
    expect(duplicates).toBe(1);
  });

  it("treats an empty meaning as none", () => {
    expect(parseEntries("朋友\t  ").entries).toEqual([{ word: "朋友" }]);
  });
});

describe("shortMeaning", () => {
  it("joins senses from both separators", () => {
    expect(shortMeaning("I; me; my/oneself")).toBe("I; me; my; oneself");
  });

  it("drops cross-references and pointer senses", () => {
    expect(shortMeaning(data.meanings["大学"])).toBe("the Great Learning, one of the Four Books in Confucianism; university; college");
    // Our data's only definition of 行 is for the héng reading.
    expect(shortMeaning(data.meanings["行"])).toBe("");
    expect(shortMeaning("variant of 着[zhe5]/surname Zhe")).toBe("");
  });

  it("stops adding senses at the length limit", () => {
    const long = Array.from({ length: 20 }, (_, i) => `sense${i}`).join("; ");
    const out = shortMeaning(long);
    expect(out.length).toBeLessThanOrEqual(80);
    expect(long.startsWith(out)).toBe(true);
  });
});

describe("rng", () => {
  it("is reproducible from its seed", () => {
    const a = createRng(42);
    const b = createRng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it("shuffles without losing items", () => {
    expect(shuffle([1, 2, 3, 4, 5], createRng(1)).sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("buildQuiz", () => {
  const { questions, skipped } = buildQuiz(data, WORDS, WORD_KINDS, createRng(7));

  it("is the same quiz for the same seed", () => {
    expect(buildQuiz(data, WORDS, KINDS, createRng(7))).toEqual(buildQuiz(data, WORDS, KINDS, createRng(7)));
  });

  it("makes one question per word and kind", () => {
    expect(questions.length + skipped.length).toBe(WORDS.length * WORD_KINDS.length);
    expect(skipped).toEqual([]);
  });

  it("always has the answer among 2–4 unique options", () => {
    for (const q of choices(buildQuiz(data, WORDS, KINDS, createRng(7)).questions)) {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.options.length).toBeLessThanOrEqual(4);
      expect(new Set(q.options).size).toBe(q.options.length);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
    }
  });

  it("gets the right answers from our data", () => {
    const pick = (q: ChoiceQuestion) => q.options[q.answer];
    expect(pick(find(questions, "hanToPinyin", "大学"))).toBe("dà xué");
    expect(pick(find(questions, "hanToHanviet", "大学"))).toBe("đại học");
    // Vietnamese from the HSK list comes before CC-CEDICT English.
    expect(pick(find(questions, "hanToMeaning", "朋友"))).toBe("bạn bè, bạn");
    const back = find(questions, "meaningToHan", "电脑");
    expect(back.prompt).toBe(shortMeaning(vocabFor(data.vocab, "电脑")!.meaning));
    expect(pick(back)).toBe("电脑");
  });

  it("uses same-syllable tone changes as wrong Pinyin options", () => {
    const q = find(questions, "hanToPinyin", "妈妈");
    const strip = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "");
    const toneOnly = q.options.filter((o, i) => i !== q.answer && strip(o) === "ma ma");
    expect(toneOnly.length).toBeGreaterThan(0);
  });

  it("never offers another reading of a lone polyphone as wrong", () => {
    for (let seed = 0; seed < 20; seed++) {
      const { questions: qs } = buildQuiz(data, [{ word: "好" }, { word: "号" }], ["hanToPinyin"], createRng(seed));
      const q = find(qs, "hanToPinyin", "好");
      expect(q.options).not.toContain(q.options[q.answer] === "hǎo" ? "hào" : "hǎo");
    }
  });

  it("lets the user's own meaning win over the HSK list", () => {
    const { questions: qs } = buildQuiz(data, [{ word: "大学", meaning: "trường đại học" }, ...WORDS.slice(1)], ["hanToMeaning"], createRng(3));
    const q = find(qs, "hanToMeaning", "大学");
    expect(q.options[q.answer]).toBe("trường đại học");
  });

  it("keeps wrong meanings in the same language as the answer", () => {
    // Every English meaning the pool could offer, to make sure none slips in.
    const english = new Set(Object.values(data.meanings).map(shortMeaning));
    for (let seed = 0; seed < 10; seed++) {
      const { questions: qs } = buildQuiz(data, WORDS, ["hanToMeaning"], createRng(seed));
      for (const q of choices(qs)) {
        const wrong = q.options.filter((_, i) => i !== q.answer);
        expect(wrong.some((o) => english.has(o) && !vocabMeanings.has(o)), q.word).toBe(false);
      }
    }
    // A word only in CC-CEDICT gets English options.
    const en = find(buildQuiz(data, [{ word: "今晚" }, ...WORDS], ["hanToMeaning"], createRng(1)).questions, "hanToMeaning", "今晚");
    expect(en.options[en.answer]).toBe("tonight");
    expect(en.options.every((o) => english.has(o))).toBe(true);
  });

  it("skips a meaning that is only a cross-reference", () => {
    // Without the HSK list, 行's only CC-CEDICT definition is a pointer.
    const noVocab: QuizData = { ...data, vocab: {} };
    const { skipped: sk } = buildQuiz(noVocab, [{ word: "行" }, ...WORDS], ["hanToMeaning", "meaningToHan"], createRng(1));
    expect(sk).toEqual([
      { word: "行", kind: "hanToMeaning" },
      { word: "行", kind: "meaningToHan" },
    ]);
  });

  it("skips a kind when the word has no data for it", () => {
    const { questions: qs, skipped: sk } = buildQuiz(data, [{ word: "abc" }], KINDS, createRng(1));
    expect(qs).toEqual([]);
    expect(sk.map((s) => s.kind).sort()).toEqual([...KINDS].sort());
  });
});

describe("cloze", () => {
  const { questions } = buildQuiz(data, WORDS, ["cloze"], createRng(11));

  it("blanks the word in its example sentence and gives the translation", () => {
    const q = find(questions, "cloze", "朋友");
    expect(q.prompt).toBe(`他是我的${BLANK}。`);
    expect(q.hint).toBe("Anh ấy là bạn tôi.");
    expect(q.options[q.answer]).toBe("朋友");
  });

  it("blanks only the first occurrence and never offers a word already in the sentence", () => {
    const q = find(questions, "cloze", "大学");
    expect(q.prompt).toBe(`我在${BLANK}学习。`);
    expect(q.options).not.toContain("学习");
  });

  it("blanks a word with a character outside the BMP intact", () => {
    // 𠮷 (U+20BB7) is a surrogate pair in JavaScript strings.
    const astral: QuizData = { ...data, sentences: { rows: [["𠮷野家很好。", "Yoshinoya rất ngon.", ""]], index: { 𠮷野家: 0 } } };
    const q = find(buildQuiz(astral, [{ word: "𠮷野家" }], ["cloze"], createRng(1)).questions, "cloze", "𠮷野家");
    expect(q.prompt).toBe(`${BLANK}很好。`);
    expect(Array.from(q.prompt)).not.toContain("\uD842");
  });

  it("skips a word with no example sentence", () => {
    const { skipped } = buildQuiz(data, [{ word: "abc" }, ...WORDS], ["cloze"], createRng(1));
    expect(skipped).toEqual([{ word: "abc", kind: "cloze" }]);
  });
});

describe("ordering", () => {
  const { questions, skipped } = buildQuiz(data, WORDS, ["ordering"], createRng(5));

  it("shuffles the words and keeps the end punctuation apart", () => {
    const q = findOrder(questions, "朋友");
    expect(q.answer).toEqual(["他", "是", "我", "的", "朋友"]);
    expect(q.end).toBe("。");
    expect([...q.tokens].sort()).toEqual([...q.answer].sort());
    expect(q.tokens.join("")).not.toBe(q.answer.join(""));
  });

  it("skips sentences too short to reorder", () => {
    const short: QuizData = { ...data, sentences: { rows: [["谢谢你。", "Cảm ơn bạn.", ""]], index: { 谢谢: 0 } } };
    // 谢谢 / 你 + 。: two words are not an exercise.
    expect(buildQuiz(short, [{ word: "谢谢" }], ["ordering"], createRng(1)).skipped).toEqual([
      { word: "谢谢", kind: "ordering" },
    ]);
    expect(skipped.every((s) => s.kind === "ordering")).toBe(true);
  });

  it("checks the order by text", () => {
    const q = findOrder(questions, "朋友");
    expect(isCorrect(q, ["他", "是", "我", "的", "朋友"])).toBe(true);
    expect(isCorrect(q, ["我", "是", "他", "的", "朋友"])).toBe(false);
    expect(isCorrect(q, null)).toBe(false);
  });
});

describe("reshuffle", () => {
  it("keeps every answer right after reordering", () => {
    const { questions } = buildQuiz(data, WORDS, KINDS, createRng(3));
    const again = reshuffle(questions, createRng(4));
    expect(again).toHaveLength(questions.length);
    for (const q of again) {
      if (q.kind === "ordering") {
        expect(q.tokens.join("")).not.toBe(q.answer.join(""));
        expect(isCorrect(q, q.answer)).toBe(true);
      } else {
        const before = questions.find((x) => x.kind === q.kind && x.word === q.word) as ChoiceQuestion;
        expect(q.options[q.answer]).toBe(before.options[before.answer]);
      }
    }
  });
});

describe("toTsv", () => {
  const labels = Object.fromEntries(KINDS.map((k) => [k, k])) as Record<QuizKind, string>;

  it("writes one row per question with the answer letter", () => {
    const q: ChoiceQuestion = { kind: "hanToPinyin", word: "大学", prompt: "大学", options: ["dà xue", "dà xué"], answer: 1 };
    expect(toTsv([q], labels)).toBe("type\tquestion\thint\tA\tB\tC\tD\tanswer\nhanToPinyin\t大学\t\tdà xue\tdà xué\t\t\tB\n");
  });

  it("keeps tabs and line breaks inside a field from splitting the row", () => {
    const q: ChoiceQuestion = { kind: "hanToMeaning", word: "x", prompt: "x", options: ["a\tb", "c\nd"], answer: 0 };
    const row = toTsv([q], labels).split("\n")[1];
    expect(row.split("\t")).toHaveLength(8);
    expect(row).toContain("a b\tc d");
  });

  it("lists an ordering question's words and the full sentence", () => {
    const q: OrderQuestion = { kind: "ordering", word: "朋友", hint: "Anh ấy là bạn tôi.", tokens: ["朋友", "他", "是"], end: "。", answer: ["他", "是", "朋友"] };
    expect(toTsv([q], labels).split("\n")[1]).toBe("ordering\t朋友 / 他 / 是 。\tAnh ấy là bạn tôi.\t\t\t\t\t他是朋友。");
  });
});

describe("printText", () => {
  it("covers the Pinyin, Vietnamese and hanzi the worksheet prints", () => {
    const pinyin: ChoiceQuestion = { kind: "hanToPinyin", word: "旅游", prompt: "旅游", options: ["lǚ yóu", "lǜ yǒu"], answer: 0 };
    const order: OrderQuestion = { kind: "ordering", word: "朋友", hint: "Anh ấy là bạn tôi.", tokens: ["朋友", "他", "是"], end: "。", answer: ["他", "是", "朋友"] };
    const text = printText([pinyin, order], ["Đáp án"]);
    for (const s of ["Đáp án", "旅游", "lǚ yóu", "lǜ yǒu", "Anh ấy là bạn tôi.", "他是朋友。", "A"]) expect(text).toContain(s);
  });
});
