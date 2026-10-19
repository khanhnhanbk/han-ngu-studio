import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { vocabFor, type VocabData } from "./lookup";

const vocab = JSON.parse(
  readFileSync(join(__dirname, "../../public/data/vocab.json"), "utf-8"),
) as VocabData;

describe("vocab.json", () => {
  it("only has HSK 3.0 levels, Pinyin, and a meaning for almost every word", () => {
    const levels = new Set(["1", "2", "3", "4", "5", "6", "7-9"]);
    let noMeaning = 0;
    for (const [word, entries] of Object.entries(vocab)) {
      expect(word).not.toMatch(/[{}]/);
      for (const [level, pinyin, meaning] of entries) {
        expect(levels.has(level), `${word} ${level}`).toBe(true);
        expect(pinyin).not.toBe("");
        if (!meaning) noMeaning++;
        // Classifier notes and bare "variant of X" pointers are removed.
        expect(meaning).not.toMatch(/^(?:LT|CL):|^biến thể(?: er hoá)? của \S+\[[^\]]+\]$/u);
      }
    }
    // CVDICT lacks a few list words (车上, 不太…); they keep their level.
    expect(noMeaning).toBeLessThan(60);
  });

  it("stores an optional 儿 under both forms, letting an exact row win", () => {
    expect(vocab["一会"]).toEqual(vocab["一会儿"]);
    expect(vocab["好玩"]).toEqual(vocab["好玩儿"]);
    // An erhua word takes the meaning of its plain form, not "erhua variant of 好玩".
    expect(vocab["好玩儿"].map(([, , m]) => m)).toEqual(["vui vẻ; thú vị; hay ho"]);
    // 儿子 and 女儿 are not erhua: no 儿-less form.
    expect(vocab["女"]?.[0][2]).not.toBe(vocab["女儿"][0][2]);
  });
});

describe("vocabFor", () => {
  it("uses only the entries for the given reading", () => {
    expect(vocabFor(vocab, "好", "hǎo")).toEqual({ level: "HSK 1", meaning: "tốt; thích hợp; đúng; (trước động từ) dễ" });
    expect(vocabFor(vocab, "好", "hào")).toEqual({ level: "HSK 4", meaning: "thích; có khuynh hướng; dễ" });
  });

  it("falls back to every entry when no reading matches", () => {
    expect(vocabFor(vocab, "好", "hāo")?.meaning).toBe("tốt; thích hợp; đúng; (trước động từ) dễ; thích; có khuynh hướng; dễ");
    expect(vocabFor(vocab, "好")?.level).toBe("HSK 1");
  });

  it("ignores spaces, case and the erhua spelling in Pinyin", () => {
    expect(vocabFor(vocab, "大学", "dà xué")?.meaning).toBe("trường đại học; trường cao đẳng");
    expect(vocabFor(vocab, "一会儿", "yī huì er")?.level).toBe("HSK 1");
    // pinyin-pro reads a final 儿 as "ér".
    const data: VocabData = { 玩儿: [["1", "wánr", "chơi"], ["5", "wàn", "x"]] };
    expect(vocabFor(data, "玩儿", "wán ér")?.meaning).toBe("chơi");
  });

  it("lists a repeated meaning once and takes the lowest level", () => {
    // 老 is listed at HSK 1 and 2 with the same meaning.
    const old = vocabFor(vocab, "老", "lǎo");
    expect(old?.level).toBe("HSK 1");
    expect(old?.meaning.split("già (người)")).toHaveLength(2);
  });

  it("ranks 7-9 above 6", () => {
    const data: VocabData = { 词: [["7-9", "cí", "a"], ["6", "cí", "b"]] };
    expect(vocabFor(data, "词")?.level).toBe("HSK 6");
  });

  it("returns null for a word not in the list", () => {
    expect(vocabFor(vocab, "abc")).toBeNull();
    expect(vocabFor(vocab, "hasOwnProperty")).toBeNull();
  });
});
