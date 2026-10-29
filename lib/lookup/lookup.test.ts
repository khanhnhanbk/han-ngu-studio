import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import type { Meanings } from "@/lib/anki/load";
import { cvdictShard, type CvdictShard } from "@/lib/cvdict/lookup";
import { bankFrom } from "@/lib/examples/load";
import type { ExampleManifest, ExampleShard } from "@/lib/examples/types";
import type { HanvietData } from "@/lib/hanviet/lookup";
import { createTokenizer } from "@/lib/segment/tokenizer";
import type { VocabData } from "@/lib/vocab/lookup";

import { buildLookupCard, cleanSense, MAX_EXAMPLES, MAX_STARTS, type LookupData } from "./card";

const dataDir = join(__dirname, "../../public/data");
const json = <T,>(name: string) => JSON.parse(readFileSync(join(dataDir, name), "utf-8")) as T;

const manifest = json<ExampleManifest>("examples/manifest.json");
const shards = new Map(Object.keys(manifest.shards).map((n) => [n, json<ExampleShard>(`examples/${n}.json`)]));
const base = {
  tokenizer: createTokenizer(readFileSync(join(dataDir, "word_list.txt"), "utf-8").split("\n")),
  hanviet: json<HanvietData>("hanviet.json"),
  meanings: json<Meanings>("meanings.json"),
  vocab: json<VocabData>("vocab.json"),
};
const dataFor = (word: string): LookupData => ({
  ...base,
  cvdict: json<CvdictShard>(`cvdict/${cvdictShard(word)}.json`),
  examples: bankFrom(manifest, shards, [word]),
});
const card = (word: string) => buildLookupCard(dataFor(word), word);

describe("buildLookupCard", () => {
  it("joins the HSK list and CVDICT for one reading", () => {
    const c = card("亲戚");
    expect(c.readings).toHaveLength(1);
    expect(c.readings[0]).toMatchObject({
      pinyin: "qīnqi",
      tone3: ["qin1", "qi5"],
      hanviet: "thân thích",
      level: "HSK 7-9",
      pos: ["N"],
      trad: ["親戚"],
    });
    expect(c.readings[0].classifiers.map((x) => x.hanzi)).toEqual(["门", "个", "位"]);
    expect(c.english).toMatch(/relative/);
    expect(c.examples.length).toBeLessThanOrEqual(MAX_EXAMPLES);
  });

  it("keeps each reading of a polyphone apart, HSK readings first", () => {
    const c = card("好");
    expect(c.readings.slice(0, 2).map((r) => [r.pinyin, r.level])).toEqual([
      ["hǎo", "HSK 1"],
      ["hào", "HSK 4"],
    ]);
    // CVDICT gives more senses than the HSK list's first three.
    expect(c.readings[0].senses.length).toBeGreaterThanOrEqual(3);
  });

  it("puts proper-noun readings after the others", () => {
    const pinyins = card("亲").readings.map((r) => r.pinyin);
    expect(pinyins[0]).toBe("qīn");
    const firstProper = pinyins.findIndex((p) => p !== p.toLowerCase());
    if (firstProper >= 0) expect(pinyins.slice(firstProper).every((p) => p !== p.toLowerCase())).toBe(true);
  });

  it("finds words outside the HSK list, with no level or part of speech", () => {
    const [r] = card("河内").readings;
    expect(r).toMatchObject({ level: null, pos: [] });
    expect(r.senses.length).toBeGreaterThan(0);
    expect(r.hanviet).toBe("hà nội");
  });

  it("lists longer words with the same start, HSK words first", () => {
    const c = card("亲");
    expect(c.startsWith.length).toBeLessThanOrEqual(MAX_STARTS);
    expect(c.startsWith).toContain("亲戚");
    expect(c.startsWith.every((w) => w.startsWith("亲") && w !== "亲")).toBe(true);
    const hsk = c.startsWith.map((w) => Object.hasOwn(base.vocab, w));
    expect(hsk.indexOf(false) === -1 || hsk.slice(hsk.indexOf(false)).every((x) => !x)).toBe(true);
  });

  it("keeps a proper-noun reading apart and shows cross-references as words", () => {
    const readings = card("书").readings;
    expect(readings[0]).toMatchObject({ pinyin: "shū", level: "HSK 1" });
    expect(readings[0].senses.join(" ")).not.toMatch(/Kinh Thư|\[/);
    expect(readings.some((r) => r.pinyin === "Shū")).toBe(true);
    expect(cleanSense("abbr. for 書經|书经[Shu1 jing1]; book")).toBe("abbr. for 书经; book");
    expect(cleanSense("biến thể của 好玩[hao3 wan2]")).toBe("biến thể của 好玩");
  });

  it("returns no readings for text that is not a word", () => {
    expect(card("我们两家是亲戚").readings).toEqual([]);
  });
});
