import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import type { Meanings } from "@/lib/anki/load";
import type { HanvietData } from "@/lib/hanviet/lookup";
import { createTokenizer } from "@/lib/segment/tokenizer";

import { buildQuiz, parseEntries, shortMeaning, type QuizData } from "./build";
import { createRng, shuffle } from "./rng";
import { KINDS, type Question } from "./types";

const dataDir = join(__dirname, "../../public/data");
const json = <T,>(name: string) => JSON.parse(readFileSync(join(dataDir, name), "utf-8")) as T;

const data: QuizData = {
  tokenizer: createTokenizer(readFileSync(join(dataDir, "word_list.txt"), "utf-8").split("\n")),
  hanviet: json<HanvietData>("hanviet.json"),
  meanings: json<Meanings>("meanings.json"),
};

const WORDS = ["大学", "学习", "朋友", "喜欢", "电脑", "妈妈", "好"].map((word) => ({ word }));

function find(questions: Question[], kind: Question["kind"], word: string): Question {
  const q = questions.find((x) => x.kind === kind && x.word === word);
  if (!q) throw new Error(`no ${kind} question for ${word}`);
  return q;
}

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
  const { questions, skipped } = buildQuiz(data, WORDS, KINDS, createRng(7));

  it("is the same quiz for the same seed", () => {
    expect(buildQuiz(data, WORDS, KINDS, createRng(7)).questions).toEqual(questions);
  });

  it("makes one question per word and kind", () => {
    expect(questions.length + skipped.length).toBe(WORDS.length * KINDS.length);
    expect(skipped).toEqual([]);
  });

  it("always has the answer among 2–4 unique options", () => {
    for (const q of questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.options.length).toBeLessThanOrEqual(4);
      expect(new Set(q.options).size).toBe(q.options.length);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
    }
  });

  it("gets the right answers from our data", () => {
    const pick = (q: Question) => q.options[q.answer];
    expect(pick(find(questions, "hanToPinyin", "大学"))).toBe("dà xué");
    expect(pick(find(questions, "hanToHanviet", "大学"))).toBe("đại học");
    expect(pick(find(questions, "hanToMeaning", "朋友"))).toBe(shortMeaning(data.meanings["朋友"]));
    const back = find(questions, "meaningToHan", "电脑");
    expect(back.prompt).toBe(shortMeaning(data.meanings["电脑"]));
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

  it("keeps wrong meanings in the same language as the answer", () => {
    const entries = [
      { word: "大学", meaning: "đại học" },
      { word: "学习", meaning: "học tập" },
      { word: "朋友", meaning: "bạn bè" },
    ];
    const { questions: qs } = buildQuiz(data, entries, ["hanToMeaning"], createRng(3));
    for (const q of qs) {
      expect(q.options.every((o) => ["đại học", "học tập", "bạn bè"].includes(o))).toBe(true);
    }
  });

  it("skips a meaning that is only a cross-reference", () => {
    const { skipped: sk } = buildQuiz(data, [{ word: "行" }, ...WORDS], ["hanToMeaning", "meaningToHan"], createRng(1));
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
