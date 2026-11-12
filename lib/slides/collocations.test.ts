import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { createTokenizer } from "@/lib/segment/tokenizer";
import type { VocabData } from "@/lib/vocab/lookup";

import { collocations, MAX_PHRASES } from "./collocations";

const data = (file: string) => readFileSync(join(__dirname, "../../public/data", file), "utf8");
const tokenizer = createTokenizer(data("word_list.txt").split("\n"));
const vocab = JSON.parse(data("vocab.json")) as VocabData;

describe("collocations", () => {
  it("finds verb + object and verb + complement pairs seen in two sentences", () => {
    const sentences = ["我们要打扫房间。", "你把房间打扫干净了吗？", "妈妈打扫房间。", "他打扫干净了。", "我在打扫。"];
    expect(collocations(tokenizer, vocab, "打扫", sentences)).toEqual(["打扫房间", "打扫干净"]);
  });

  it("drops pairs seen once and pairs with grammar words or helper verbs", () => {
    // 打扫厨房 once only; 了, 很 are one character; 可以 is a helper verb.
    const sentences = ["他打扫厨房了。", "我可以打扫。", "我可以打扫。", "打扫了很久。", "打扫了很久。"];
    expect(collocations(tokenizer, vocab, "打扫", sentences)).toEqual([]);
  });

  it("puts a verb or adjective before a noun", () => {
    const sentences = ["请整理房间。", "我要整理房间。", "新鲜空气很好。", "这里新鲜空气多。"];
    expect(collocations(tokenizer, vocab, "房间", sentences)).toEqual(["整理房间"]);
    expect(collocations(tokenizer, vocab, "空气", sentences)).toEqual(["新鲜空气"]);
  });

  it("counts a pair once per sentence and keeps at most MAX_PHRASES", () => {
    expect(collocations(tokenizer, vocab, "打扫", ["打扫房间，打扫房间。"])).toEqual([]);
    const many = ["打扫房间", "打扫干净", "打扫厨房", "打扫教室", "打扫卫生"].flatMap((p) => [p + "。", p + "了。"]);
    expect(collocations(tokenizer, vocab, "打扫", many).length).toBeLessThanOrEqual(MAX_PHRASES);
  });
});
