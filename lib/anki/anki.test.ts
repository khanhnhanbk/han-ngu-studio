import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { bankFrom } from "@/lib/examples/load";
import type { ExampleBank, ExampleManifest, ExampleShard } from "@/lib/examples/types";
import type { HanvietData } from "@/lib/hanviet/lookup";
import { createTokenizer } from "@/lib/segment/tokenizer";
import type { VocabData } from "@/lib/vocab/lookup";
import { vi } from "@/lib/i18n/vi";

import golden from "./__golden__/deck.json";
import { buildRow, COLUMNS, missing, parseWords, toTsv, type DeckData } from "./buildDeck";
import type { Meanings, WubiTable } from "./load";
import { wubiLine } from "./wubi";

const dataDir = join(__dirname, "../../public/data");
const json = <T,>(name: string) => JSON.parse(readFileSync(join(dataDir, name), "utf-8")) as T;

const manifest = json<ExampleManifest>("examples/manifest.json");
const shards = new Map(Object.keys(manifest.shards).map((n) => [n, json<ExampleShard>(`examples/${n}.json`)]));

const data: DeckData = {
  tokenizer: createTokenizer(readFileSync(join(dataDir, "word_list.txt"), "utf-8").split("\n")),
  hanviet: json<HanvietData>("hanviet.json"),
  meanings: json<Meanings>("meanings.json"),
  examples: bankFrom(manifest, shards, Object.keys(manifest.words)),
  wubi: json<WubiTable>("wubi.json"),
  vocab: json<VocabData>("vocab.json"),
};

/** `data` with the given candidates as the word's only examples. */
const withExamples = (word: string, list: Array<[string, string, string]>): DeckData => {
  const examples: ExampleBank = {
    [word]: list.map(([hanzi, vi, en], order) => ({ hanzi, vi, en, machine: false, order })),
  };
  return { ...data, examples };
};

describe("buildRow (golden: anki_desk.py logic with owner fixes, pywubi 0.3.0)", () => {
  it.each(golden.cases.map((c) => [c.word, c] as const))("%s", (word, c) => {
    const row = buildRow(data, word);
    expect(row.meaning).toBe(c.meaning);
    expect(row.wubi).toBe(c.wubi);
    // Phase 10 ranks many candidates instead of taking anki_desk.py's first
    // match, so the golden sentence is no longer the expected pick. A word
    // that had a translated example still gets one.
    if (c.sentence) expect(row.sentence).toContain(word);
    if (c.sentence_meaning) expect(row.sentence_meaning).not.toBe("");
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
    expect(buildRow(withExamples("呢", [["你呢？", "Còn bạn?", ""]]), "呢").sentence_pinyin).toBe("nǐ ne?");
  });

  it("puts the easiest example first and several examples on separate lines", () => {
    const d = withExamples("大学", [
      ["他在牛津大学修了英语文学。", "", "He read English literature at Oxford."],
      ["我在大学学习。", "Tôi đang học đại học.", ""],
    ]);
    expect(buildRow(d, "大学").sentence).toBe("我在大学学习。");
    expect(buildRow(d, "大学", 2)).toMatchObject({
      sentence: "我在大学学习。<br>他在牛津大学修了英语文学。",
      sentence_meaning: "Tôi đang học đại học.<br>He read English literature at Oxford.",
    });
    expect(buildRow(d, "大学", 2).sentence_pinyin.split("<br>")).toHaveLength(2);
  });

  it("marks cards whose example is machine-translated", () => {
    const d = withExamples("书", [["我有书。", "Tôi có sách.", ""]]);
    d.examples["书"][0].machine = true;
    expect(buildRow(d, "书").machineTranslated).toBe(true);
    expect(buildRow(data, "髮").machineTranslated).toBe(false);
  });

  it("joins several Hán Việt readings with /", () => {
    expect(buildRow(data, "当").hanviet).toBe("đương/đang");
  });

  it("adds the HSK level and Vietnamese meaning for the word's own reading", () => {
    expect(buildRow(data, "大学")).toMatchObject({ hsk_level: "HSK 1", meaning_vi: "trường đại học; trường cao đẳng" });
    // 好 alone reads hǎo, so hào's level-4 meaning is left out.
    expect(buildRow(data, "好")).toMatchObject({ hsk_level: "HSK 1", meaning_vi: "tốt; thích hợp; đúng; (trước động từ) dễ" });
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

  it("writes HTML fields when cards carry several examples", () => {
    const multi = { ...row, sentence: "a<b<br>c&d" };
    const out = toTsv([multi], ["sentence"], true, true).split("\n");
    expect(out[1]).toBe("#html:true");
    expect(out[3]).toBe("a&lt;b<br>c&amp;d");
  });

  it("writes the part of speech, labelled when names are given", () => {
    expect(buildRow(data, "爱好").pos).toBe("V, N");
    expect(buildRow(data, "爱好", 1, vi.vocab.pos).pos).toBe("Động từ, Danh từ");
    expect(buildRow(data, "髮", 1, vi.vocab.pos).pos).toBe("");
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
      "pos",
    ]);
  });
});
