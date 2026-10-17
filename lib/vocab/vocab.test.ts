import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { vocabFor, type VocabData } from "./lookup";

const vocab = JSON.parse(
  readFileSync(join(__dirname, "../../public/data/vocab.json"), "utf-8"),
) as VocabData;

describe("vocab.json", () => {
  it("only has HSK 3.0 levels and non-empty meanings", () => {
    const levels = new Set(["1", "2", "3", "4", "5", "6", "7-9"]);
    for (const [word, entries] of Object.entries(vocab)) {
      expect(word).not.toMatch(/[{}]/);
      for (const [level, , meaning] of entries) {
        expect(levels.has(level), `${word} ${level}`).toBe(true);
        expect(meaning).not.toBe("");
      }
    }
  });

  it("stores an optional 儿 under both forms, letting an exact row win", () => {
    expect(vocab["一会"]).toEqual(vocab["一会儿"]);
    // 好玩儿 has its own row, so it does not take 好玩{儿}'s.
    expect(vocab["好玩儿"].map(([, , m]) => m)).toEqual(["vui, thú vị"]);
    expect(vocab["好玩"]).toHaveLength(1);
  });
});

describe("vocabFor", () => {
  it("uses only the entries for the given reading", () => {
    expect(vocabFor(vocab, "好", "hǎo")).toEqual({ level: "HSK 1", meaning: "tốt; rất" });
    expect(vocabFor(vocab, "好", "hào")).toEqual({ level: "HSK 4", meaning: "thích, ưa (好学: ham học)" });
  });

  it("falls back to every entry when no reading matches", () => {
    expect(vocabFor(vocab, "好", "hāo")?.meaning).toBe("tốt; rất; thích, ưa (好学: ham học)");
    expect(vocabFor(vocab, "好")?.level).toBe("HSK 1");
  });

  it("ignores spaces, case and the erhua spelling in Pinyin", () => {
    expect(vocabFor(vocab, "大学", "dàxué")?.meaning).toBe("đại học, trường đại học");
    expect(vocabFor(vocab, "一会儿", "yī huì er")?.level).toBe("HSK 1");
    // pinyin-pro reads a final 儿 as "ér".
    const data: VocabData = { 玩儿: [["1", "wánr", "chơi"], ["5", "wàn", "x"]] };
    expect(vocabFor(data, "玩儿", "wán ér")?.meaning).toBe("chơi");
  });

  it("lists a repeated meaning once and takes the lowest level", () => {
    expect(vocabFor(vocab, "老", "lǎo")).toEqual({ level: "HSK 1", meaning: "già" });
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
