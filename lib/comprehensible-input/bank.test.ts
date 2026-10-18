import { describe, expect, it } from "vitest";

import type { VocabData } from "@/lib/vocab/lookup";

import { pickBankSentences, wordsBelow } from "./bank";

describe("pickBankSentences", () => {
  it("drops duplicates and keeps the shortest, ties in order", () => {
    expect(pickBankSentences(["我爱你。", "你好。", "我爱你。", "他好。", "我们都很好。"], 3)).toEqual([
      "你好。",
      "他好。",
      "我爱你。",
    ]);
  });

  it("counts characters outside the BMP as one", () => {
    // 𠮷 is two UTF-16 units but one character.
    expect(pickBankSentences(["𠮷𠮷。", "我们好。"], 1)).toEqual(["𠮷𠮷。"]);
  });
});

describe("wordsBelow", () => {
  const data: VocabData = {
    我: [["1", "wǒ", "tôi"]],
    学习: [["2", "xuéxí", "học"]],
    好: [["4", "hào", "thích"], ["1", "hǎo", "tốt"]],
    研究: [["7-9", "yánjiū", "nghiên cứu"]],
  };

  it("uses each word's lowest level", () => {
    expect(wordsBelow(data, "1")).toEqual([]);
    expect(wordsBelow(data, "2")).toEqual(["我", "好"]);
    expect(wordsBelow(data, "7-9")).toEqual(["我", "学习", "好"]);
  });
});
