import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { createTokenizer } from "@/lib/segment/tokenizer";
import type { VocabData } from "@/lib/vocab/lookup";

import { rankExamples, type RankData } from "./rank";
import type { Example } from "./types";

const dataDir = join(__dirname, "../../public/data");
const data: RankData = {
  tokenizer: createTokenizer(readFileSync(join(dataDir, "word_list.txt"), "utf-8").split("\n")),
  vocab: JSON.parse(readFileSync(join(dataDir, "vocab.json"), "utf-8")) as VocabData,
};

let order = 0;
const ex = (hanzi: string, vi = "x", machine = false): Example => ({ hanzi, vi, en: "", machine, order: order++ });
const ranked = (word: string, list: Example[]) => rankExamples(data, word, list).map((e) => e.hanzi);

describe("rankExamples", () => {
  it("puts sentences with only easier words first", () => {
    expect(ranked("大学", [ex("他在牛津大学修了英语文学。"), ex("我在大学学习。")])).toEqual([
      "我在大学学习。",
      "他在牛津大学修了英语文学。",
    ]);
  });

  it("treats unlisted names as hard", () => {
    expect(ranked("书", [ex("汤姆有书。"), ex("我有书。")])[0]).toBe("我有书。");
  });

  it("prefers a translated sentence, then a hand-checked one", () => {
    const out = rankExamples(data, "书", [ex("我有书。", ""), ex("我有书。", "a", true), ex("我有书。", "b")]);
    expect(out.map((e) => e.vi)).toEqual(["b", "a", ""]);
  });

  it("breaks ties by length, then file order", () => {
    const a = ex("我有书。");
    const b = ex("我有书。");
    expect(rankExamples(data, "书", [b, a])).toEqual([a, b]);
    expect(ranked("书", [ex("我有很多书。"), ex("我有书。")])[0]).toBe("我有书。");
  });
});
