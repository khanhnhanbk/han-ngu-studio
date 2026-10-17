import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import type { HanvietData } from "@/lib/hanviet/lookup";
import { createTokenizer } from "@/lib/segment/tokenizer";
import type { VocabData } from "@/lib/vocab/lookup";

import golden from "./__golden__/deck.json";
import { buildRow, COLUMNS, missing, parseWords, toTsv, type DeckData } from "./buildDeck";
import type { Meanings, Sentences, WubiTable } from "./load";
import { wubiLine } from "./wubi";

const dataDir = join(__dirname, "../../public/data");
const json = <T,>(name: string) => JSON.parse(readFileSync(join(dataDir, name), "utf-8")) as T;

const data: DeckData = {
  tokenizer: createTokenizer(readFileSync(join(dataDir, "word_list.txt"), "utf-8").split("\n")),
  hanviet: json<HanvietData>("hanviet.json"),
  meanings: json<Meanings>("meanings.json"),
  sentences: json<Sentences>("sentences.json"),
  wubi: json<WubiTable>("wubi.json"),
  vocab: json<VocabData>("vocab.json"),
};

describe("buildRow (golden: anki_desk.py logic with owner fixes, pywubi 0.3.0)", () => {
  it.each(golden.cases.map((c) => [c.word, c] as const))("%s", (word, c) => {
    const row = buildRow(data, word);
    expect(row.meaning).toBe(c.meaning);
    expect(row.sentence).toBe(c.sentence);
    expect(row.sentence_meaning).toBe(c.sentence_meaning);
    expect(row.wubi).toBe(c.wubi);
  });
});

// Pinyin and Hán Việt come from pinyin-pro, so these are curated by hand.
describe("buildRow formats", () => {
  it("writes Pinyin by syllable and Hán Việt by character", () => {
    const row = buildRow(data, "大学");
    expect(row.pinyin).toBe("dà xué");
    expect(row.hanviet).toBe("đại học");
    expect(row.sentence).toBe("我在大学学习。");
    expect(row.sentence_pinyin).toBe("wǒ zài dàxué xuéxí.");
    expect(row.sentence_meaning).toBe("Tôi đang học đại học.");
  });

  it("generates sentence Pinyin instead of copying the sheet's errors", () => {
    // The sheet has "nǐ ní？".
    expect(buildRow(data, "呢").sentence_pinyin).toBe("nǐ ne?");
  });

  it("uses the rewritten sentence, not the AI refusal row", () => {
    const row = buildRow(data, "用于");
    expect(row.sentence).toBe("这笔钱用于买书。");
    expect(row.sentence_meaning).toBe("Khoản tiền này được dùng để mua sách.");
  });

  it("falls back to English when the Vietnamese cell holds Hán Việt", () => {
    // sentences.tsv has "thủ_cơ khả_dĩ phách_chiếu 。"-style text there.
    const row = buildRow(data, "拍照");
    expect(row.sentence).toBe("手机可以拍照。");
    expect(row.sentence_meaning).toBe("Mobile phones can take pictures.");
  });

  it("joins several Hán Việt readings with /", () => {
    expect(buildRow(data, "当").hanviet).toBe("đương/đang");
  });

  it("adds the HSK level and Vietnamese meaning for the word's own reading", () => {
    expect(buildRow(data, "大学")).toMatchObject({ hsk_level: "HSK 1", meaning_vi: "đại học, trường đại học" });
    // 好 alone reads hǎo, so hào's level-4 meaning is left out.
    expect(buildRow(data, "好")).toMatchObject({ hsk_level: "HSK 1", meaning_vi: "tốt; rất" });
    expect(buildRow(data, "髮")).toMatchObject({ hsk_level: "", meaning_vi: "" });
  });
});

describe("wubiLine", () => {
  it("keeps non-Han runs together and unknown characters as is", () => {
    const table = { 你: "wqiy", 好: "vbg" };
    expect(wubiLine(table, "你好，Hi")).toBe("wqiy vbg ，Hi");
    expect(wubiLine(table, "㐀你")).toBe("㐀 wqiy");
    expect(wubiLine(table, "")).toBe("");
  });
});

describe("parseWords", () => {
  it("trims, drops empty lines and removes duplicates in order", () => {
    expect(parseWords(" 大学 \r\n\n学习\n大学\n")).toEqual({ words: ["大学", "学习"], duplicates: 1 });
  });
});

describe("missing", () => {
  it("lists words with no meaning, no sentence or no HSK entry", () => {
    const rows = ["大学", "髮"].map((w) => buildRow(data, w));
    expect(missing(rows)).toEqual({ meaning: ["髮"], sentence: ["髮"], vocab: ["髮"] });
  });
});

describe("toTsv", () => {
  const row = { ...buildRow(data, "大学"), meaning: "a\tb\nc" };

  it("writes the picked columns in order, one line per note", () => {
    expect(toTsv([row], ["word", "meaning", "hanviet"], false)).toBe("大学\ta b c\tđại học\n");
  });

  it("adds Anki header lines", () => {
    expect(toTsv([row], ["word", "pinyin"], true).split("\n").slice(0, 3)).toEqual([
      "#separator:tab",
      "#html:false",
      "#columns:word\tpinyin",
    ]);
  });

  it("keeps anki_desk.py's column order, with the HSK columns last", () => {
    expect(COLUMNS).toEqual([
      "word",
      "pinyin",
      "meaning",
      "sentence",
      "sentence_pinyin",
      "sentence_meaning",
      "wubi",
      "hanviet",
      "hsk_level",
      "meaning_vi",
    ]);
  });
});
