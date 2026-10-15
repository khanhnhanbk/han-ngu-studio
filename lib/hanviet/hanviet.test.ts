import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { createTokenizer } from "@/lib/segment/tokenizer";

import golden from "./__golden__/lookup.json";
import { hanvietForWord, toTone3, type HanvietData } from "./lookup";
import { allReadings, analyzeLine, analyzeText, toTsv } from "./sentence";

const root = join(__dirname, "../..");
const data = JSON.parse(
  readFileSync(join(root, "public/data/hanviet.json"), "utf-8"),
) as HanvietData;
const tokenizer = createTokenizer(
  readFileSync(join(root, "public/data/word_list.txt"), "utf-8").split("\n"),
);

describe("hanvietForWord (golden, generated from hanviet.py with fixed pinyin)", () => {
  it.each(golden.cases.map((c) => [`${c.word} ${c.tone3.join(" ")}`, c] as const))(
    "%s",
    (_, c) => {
      expect(hanvietForWord(data, Array.from(c.word), c.tone3)).toBe(c.hanviet);
    },
  );
});

describe("toTone3", () => {
  it("maps pinyin-pro numbers to the data's TONE3", () => {
    expect(toTone3("nü3")).toBe("nu:3");
    expect(toTone3("le0")).toBe("le5");
    expect(toTone3("le5")).toBe("le5");
    expect(toTone3("zhong1")).toBe("zhong1");
  });
});

// End-to-end cases are curated by hand: Pinyin comes from pinyin-pro.
describe("analyzeLine", () => {
  it("segments, adds Pinyin and Hán Việt per word", () => {
    const line = analyzeLine(tokenizer, data, "我喜欢学习中文。");
    expect(line.segmented).toBe("我 喜欢 学习 中文 。");
    expect(line.pinyin).toBe("wǒ xǐhuan xuéxí zhōngwén 。");
    expect(line.hanviet).toBe("ngã hỷ_hoan học_tập trung_văn 。");
  });

  it("uses sentence context to pick the reading", () => {
    // 行 in 银行 is hang2 → hàng; in 行走 xing2 → hành.
    const line = analyzeLine(tokenizer, data, "银行行走");
    expect(line.hanviet).toBe("ngân_hàng hành_tẩu");
  });

  it("keeps ü readings (女 nu:3 → nữ, not nhữ)", () => {
    expect(analyzeLine(tokenizer, data, "女人").hanviet).toBe("nữ_nhân");
  });

  it("passes punctuation, Latin and digits through", () => {
    const line = analyzeLine(tokenizer, data, "你好，Hi 2024！");
    expect(line.hanviet).toBe("nhĩ hảo ， Hi 2024 ！");
  });

  it("keeps empty lines", () => {
    expect(analyzeText(tokenizer, data, "中国\n\n越南").map((l) => l.hanviet)).toEqual([
      "trung_quốc",
      "",
      "việt_nam",
    ]);
  });
});

describe("allReadings", () => {
  it("lists every entry and the reading used", () => {
    expect(allReadings(data, ["当"], ["dang1"])).toEqual([
      {
        char: "当",
        used: ["đương", "đang"],
        entries: [
          ["dang1", ["đương", "đang"]],
          ["dang4", ["đáng"]],
        ],
      },
    ]);
  });
});

describe("toTsv", () => {
  it("writes hanviet.py's columns with a header", () => {
    const tsv = toTsv(analyzeText(tokenizer, data, "中国\n\n越南"));
    expect(tsv.split("\n")).toEqual([
      "Original Sentence\tSegmented (Space)\tPinyin\tHan Viet",
      "中国\t中国\tzhōngguó\ttrung_quốc",
      "\t\t\t",
      "越南\t越南\tyuènán\tviệt_nam",
    ]);
  });
});
