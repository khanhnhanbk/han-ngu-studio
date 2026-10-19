import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import type { Meanings } from "@/lib/anki/load";
import type { HanvietData } from "@/lib/hanviet/lookup";
import { createTokenizer } from "@/lib/segment/tokenizer";
import type { VocabData } from "@/lib/vocab/lookup";

import { analyzeText, type ReaderData, type ReaderLine, type ReaderWord } from "./analyze";
import { parseWordsHash, wordsHash } from "./handoff";
import { knownToTsv, parseKnownTsv } from "./known";
import { cumulativeShare, estimateLevel, knownShare, levelStats, makeIsKnown, sortRows, wordTable } from "./stats";

const dataDir = join(__dirname, "../../public/data");
const json = <T,>(name: string) => JSON.parse(readFileSync(join(dataDir, name), "utf-8")) as T;
const data: ReaderData = {
  tokenizer: createTokenizer(readFileSync(join(dataDir, "word_list.txt"), "utf-8").split("\n")),
  hanviet: json<HanvietData>("hanviet.json"),
  vocab: json<VocabData>("vocab.json"),
  meanings: json<Meanings>("meanings.json"),
};

const wordsOf = (lines: ReaderLine[]) => lines.flat().filter((t): t is ReaderWord => t.kind === "word");
const word = (text: string, level: ReaderWord["level"]): ReaderWord => ({
  kind: "word", text, pinyin: "", hanviet: "", level, meaningVi: "", meaningEn: "",
});

describe("analyzeText", () => {
  const lines = analyzeText(data, "我们明天去银行取钱。");
  const byText = Object.fromEntries(wordsOf(lines).map((w) => [w.text, w]));

  it("segments and reads each word in context", () => {
    expect(wordsOf(lines).map((w) => w.text)).toEqual(["我们", "明天", "去", "银行", "取钱"]);
    // 行 is read háng in 银行 (not xíng), and the Hán Việt follows that reading.
    expect(byText["银行"]).toMatchObject({ pinyin: "yínháng", hanviet: "ngân hàng", meaningEn: expect.stringContaining("bank") });
  });

  it("takes HSK levels and Vietnamese meanings from the HSK 3.0 list", () => {
    expect(byText["我们"].level).toBe("1");
    expect(byText["明天"]).toMatchObject({ level: "1", meaningVi: "ngày mai" });
    // 银行 is not in the HSK 3.0 list we ship: no level, but still read and translated.
    expect(byText["银行"]).toMatchObject({ level: null, meaningVi: "" });
  });

  it("keeps punctuation, spaces and empty lines as plain text", () => {
    const [first, empty, third] = analyzeText(data, "你好， 世界！\n\nabc 123");
    expect(first.map((t) => t.text).join("")).toBe("你好， 世界！");
    expect(first.filter((t) => t.kind === "other").map((t) => t.text)).toEqual(["，", " ", "！"]);
    expect(empty).toEqual([]);
    expect(third.every((t) => t.kind === "other")).toBe(true);
  });

  it("gives null for a word outside the HSK list", () => {
    const outside = wordsOf(analyzeText(data, "饕餮")).find((w) => w.level === null);
    expect(outside).toBeDefined();
  });
});

describe("levelStats / estimateLevel", () => {
  const line = (...ws: ReaderWord[]): ReaderLine[] => [ws];

  it("counts tokens and distinct words per level", () => {
    const s = levelStats(line(word("我", "1"), word("我", "1"), word("银行", "3"), word("饕餮", null)));
    expect(s.tokens).toMatchObject({ 1: 2, 3: 1, none: 1 });
    expect(s.distinct).toMatchObject({ 1: 1, 3: 1, none: 1 });
    expect([s.totalTokens, s.totalDistinct]).toEqual([4, 3]);
    expect(cumulativeShare(s)["1"]).toBe(0.5);
  });

  it("is the lowest level covering 95 % of the words", () => {
    const at = (n1: number, n3: number, none = 0) =>
      estimateLevel(
        levelStats(line(...Array(n1).fill(word("我", "1")), ...Array(n3).fill(word("银行", "3")), ...Array(none).fill(word("饕餮", null)))),
      );
    expect(at(19, 1)).toBe("1"); // exactly 95 % at HSK 1
    expect(at(18, 2)).toBe("3"); // 90 % at HSK 1, 100 % at HSK 3
    // Names and other unlisted words are left out of the estimate…
    expect(at(19, 1, 3)).toBe("1");
    // …unless fewer than half the words are listed.
    expect(at(10, 0, 10)).toBe("1");
    expect(at(5, 0, 10)).toBe("beyond");
    expect(estimateLevel(levelStats([]))).toBeNull();
  });
});

describe("words outside the HSK list", () => {
  it("keep level null but list each character's level as a hint", () => {
    const ws = wordsOf(analyzeText(data, "我每天看书。"));
    const meitian = ws.find((w) => w.text === "每天");
    expect(meitian?.level).toBeNull();
    expect(meitian?.chars).toEqual([["每", "3"], ["天", "1"]]);
    expect(ws.find((w) => w.text === "我")?.chars).toBeUndefined();
  });
});

describe("known words", () => {
  const lines: ReaderLine[] = [[word("我", "1"), word("我", "1"), word("银行", "3"), word("饕餮", null)]];

  it("counts the share of words the reader knows", () => {
    expect(knownShare(lines, makeIsKnown(new Set(["我"]), "1", false))).toBe(0.5);
    expect(knownShare(lines, makeIsKnown(new Set(), "3", true))).toBe(0.75);
    expect(knownShare(lines, makeIsKnown(new Set(["饕餮"]), "3", true))).toBe(1);
    expect(knownShare([], makeIsKnown(new Set(), "1", true))).toBe(0);
  });

  it("round-trips through TSV and accepts a plain word list", () => {
    const known = { 学习: "2026-10-19", 银行: "2026-10-01" };
    expect(parseKnownTsv(knownToTsv(known))).toEqual(known);
    expect(parseKnownTsv("学习\n\nabc\n朋友\tnot-a-date", "2026-01-02")).toEqual({ 学习: "2026-01-02", 朋友: "2026-01-02" });
  });
});

describe("wordTable", () => {
  it("lists distinct words in order of first appearance, with counts", () => {
    const rows = wordTable([[word("你", "1"), word("银行", "3"), word("你", "1")], [word("银行", "3"), word("你", "1")]]);
    expect(rows.map((r) => [r.text, r.count])).toEqual([["你", 3], ["银行", 2]]);
    expect(sortRows(rows, "level").map((r) => r.text)).toEqual(["你", "银行"]);
    expect(sortRows([...rows].reverse(), "order").map((r) => r.text)).toEqual(["你", "银行"]);
  });
});

describe("words hash", () => {
  it("round-trips Traditional, non-BMP and multi-line lists", () => {
    const words = ["學習", "𠀾字", "朋友"];
    expect(parseWordsHash(wordsHash(words))).toEqual(words);
    expect(parseWordsHash("#chars=abc")).toEqual([]);
    expect(parseWordsHash("")).toEqual([]);
  });
});
