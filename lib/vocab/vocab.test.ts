import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { en } from "../i18n/en";
import { vi } from "../i18n/vi";
import { vocabFor, type VocabData } from "./lookup";
import { POS_CODES, posCode, posLabels } from "./pos";

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
    expect(vocabFor(vocab, "好", "hǎo")).toMatchObject({ level: "HSK 1", meaning: "tốt; thích hợp; đúng; (trước động từ) dễ" });
    expect(vocabFor(vocab, "好", "hào")).toMatchObject({ level: "HSK 4", meaning: "thích; có khuynh hướng; dễ", pos: ["V"] });
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

  it("gives the part of speech of the HSK list", () => {
    expect(vocabFor(vocab, "爱")?.pos).toEqual(["V"]);
    expect(vocabFor(vocab, "爱好")?.pos).toEqual(["V", "N"]);
    expect(vocabFor(vocab, "吧")?.pos).toEqual(["Aux"]);
    // 省 shěng is listed twice at HSK 2 (N, then V): both are kept.
    expect(vocabFor(vocab, "省", "shěng")?.pos).toEqual(["N", "V"]);
    // Phrases have no part of speech in the list.
    expect(vocabFor(vocab, "不客气")?.pos).toEqual([]);
  });

  it("gives the CVDICT measure words in Simplified with tone marks", () => {
    expect(vocabFor(vocab, "亲戚")?.classifiers).toEqual([
      { hanzi: "门", pinyin: "mén" },
      { hanzi: "个", pinyin: "gè" },
      { hanzi: "位", pinyin: "wèi" },
    ]);
    expect(vocabFor(vocab, "书")?.classifiers.map((c) => c.hanzi)).toEqual(["本", "册", "部"]);
    expect(vocabFor(vocab, "吧")?.classifiers).toEqual([]);
  });

  it("returns null for a word not in the list", () => {
    expect(vocabFor(vocab, "abc")).toBeNull();
    expect(vocabFor(vocab, "hasOwnProperty")).toBeNull();
  });
});

describe("part of speech", () => {
  it("knows every code in vocab.json", () => {
    for (const entries of Object.values(vocab)) {
      for (const [, , , pos = ""] of entries) {
        for (const code of pos.split("/").filter(Boolean)) expect(posCode(code), code).not.toBeNull();
      }
    }
  });

  it("has a label for every code in both languages", () => {
    for (const code of POS_CODES) {
      expect(vi.vocab.pos[code]).toBeTruthy();
      expect(en.vocab.pos[code]).toBeTruthy();
    }
  });

  it("merges aliases and keeps unknown codes", () => {
    expect(posLabels(vi.vocab.pos, ["Pr", "Pron", "N"])).toEqual(["Đại từ", "Danh từ"]);
    expect(posLabels(vi.vocab.pos, ["Xyz"])).toEqual(["Xyz"]);
  });
});
