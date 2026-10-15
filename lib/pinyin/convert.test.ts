import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { createTokenizer } from "@/lib/segment/tokenizer";

import { convertText, toTsv, type PinyinOptions } from "./convert";

const tokenizer = createTokenizer(
  readFileSync(join(__dirname, "../../public/data/word_list.txt"), "utf-8").split("\n"),
);

const MARK_WORD: PinyinOptions = { toneStyle: "mark", spacing: "word" };

function convert(text: string, opts: PinyinOptions = MARK_WORD): string[] {
  return convertText(tokenizer, text, opts).map((l) => l.text);
}

// Expected values are curated by hand (pinyin-pro 3.26.0), not Python output:
// this tool deliberately reads the whole line for polyphone context.
describe("convertText", () => {
  it("resolves polyphones from context", () => {
    expect(convert("我去银行取钱，然后行走回家。")).toEqual([
      "wǒ qù yínháng qǔqián, ránhòu xíngzǒu huíjiā.",
    ]);
    expect(convert("他长大了，头发很长。")).toEqual(["tā zhǎngdà le, tóufa hěn cháng."]);
  });

  it("keeps ü in every tone style", () => {
    const text = "女孩穿着绿色的衣服。";
    expect(convert(text)).toEqual(["nǚhái chuānzhe lǜsè de yīfu."]);
    expect(convert(text, { toneStyle: "number", spacing: "syllable" })).toEqual([
      "nü3 hai2 chuan1 zhe5 lü4 se4 de5 yi1 fu5.",
    ]);
    expect(convert(text, { toneStyle: "none", spacing: "word" })).toEqual([
      "nühai chuanzhe lüse de yifu.",
    ]);
  });

  it("covers every tone style and spacing", () => {
    const text = "他长大了。";
    expect(convert(text, { toneStyle: "mark", spacing: "word" })).toEqual(["tā zhǎngdà le."]);
    expect(convert(text, { toneStyle: "mark", spacing: "syllable" })).toEqual([
      "tā zhǎng dà le.",
    ]);
    expect(convert(text, { toneStyle: "number", spacing: "word" })).toEqual([
      "ta1 zhang3da4 le5.",
    ]);
    expect(convert(text, { toneStyle: "number", spacing: "syllable" })).toEqual([
      "ta1 zhang3 da4 le5.",
    ]);
    expect(convert(text, { toneStyle: "none", spacing: "word" })).toEqual(["ta zhangda le."]);
    expect(convert(text, { toneStyle: "none", spacing: "syllable" })).toEqual([
      "ta zhang da le.",
    ]);
  });

  it("adds an apostrophe before a/o/e syllables inside a word", () => {
    expect(convert("我们去西安，平安到达。")).toEqual(["wǒmen qù xī'ān, píng'ān dàodá."]);
    expect(convert("西安", { toneStyle: "mark", spacing: "syllable" })).toEqual(["xī ān"]);
  });

  it("passes Latin text and digits through, with ASCII punctuation", () => {
    expect(convert("你好，Hi 2024！")).toEqual(["nǐ hǎo, Hi 2024!"]);
    expect(convert("他说：“你好！”（真的）……《红楼梦》、书。")).toEqual([
      "tā shuō: “nǐ hǎo!” (zhēn de)… 《hónglóumèng》, shū.",
    ]);
  });

  it("passes characters outside the BMP through", () => {
    expect(convert("𠀀我爱你")).toEqual(["𠀀 wǒ ài nǐ"]);
  });

  it("keeps line breaks and empty lines, and drops CR", () => {
    expect(convert("第一行\r\n\r\n第三行")).toEqual(["dìyī háng", "", "dì sān háng"]);
  });

  it("returns segments for the ruby view", () => {
    const [line] = convertText(tokenizer, "银行。", MARK_WORD);
    expect(line.segments).toEqual([
      { kind: "han", chars: ["银", "行"], syllables: ["yín", "háng"] },
      { kind: "other", text: "。" },
    ]);
  });
});

describe("toTsv", () => {
  it("writes original<TAB>pinyin per non-empty line", () => {
    const lines = convertText(tokenizer, "你好\n\n再见", MARK_WORD);
    expect(toTsv(lines)).toBe("你好\tnǐ hǎo\n再见\tzàijiàn");
  });
});
