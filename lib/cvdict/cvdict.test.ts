import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { cvdictFile, cvdictFiles } from "./load";
import { CVDICT_SHARDS, cvdictMeaning, cvdictShard, lookupCvdict, wordsStartingWith, type CvdictShard } from "./lookup";

// Checks the generated public/data/cvdict/ (pnpm build:data).
const dir = join(__dirname, "../../public/data/cvdict");
const shardOf = (word: string) => JSON.parse(readFileSync(join(dir, `${cvdictShard(word)}.json`), "utf-8")) as CvdictShard;

describe("cvdict shards", () => {
  it("keeps every word in the shard of its first character", () => {
    // Plain checks collected into one list: 120k expect() calls are too slow.
    const wrong: string[] = [];
    let total = 0;
    for (let n = 0; n < CVDICT_SHARDS; n++) {
      const shard = JSON.parse(readFileSync(join(dir, `${n}.json`), "utf-8")) as CvdictShard;
      for (const [word, rows] of Object.entries(shard)) {
        if (cvdictShard(word) !== n) wrong.push(`${word}: shard ${n}`);
        for (const [trad, pinyin, senses, classifiers] of rows) {
          if (!trad) wrong.push(`${word}: no Traditional form`);
          // Tone marks, not numbers ("qīn qi", not "qin1 qi5").
          if (/\d/.test(pinyin)) wrong.push(`${word}: ${pinyin}`);
          if (!senses.length && !classifiers) wrong.push(`${word}: empty`);
        }
        total += rows.length;
      }
    }
    expect(wrong).toEqual([]);
    expect(total).toBeGreaterThan(120_000);
  });
});

describe("lookupCvdict", () => {
  it("gives senses, Traditional forms and measure words", () => {
    const [qinqi] = lookupCvdict(shardOf("亲戚"), "亲戚");
    expect(qinqi).toMatchObject({ trad: ["親戚"], pinyin: "qīn qi" });
    expect(qinqi.classifiers).toEqual([
      { hanzi: "门", pinyin: "mén" },
      { hanzi: "个", pinyin: "gè" },
      { hanzi: "位", pinyin: "wèi" },
    ]);
    // 復習 and 複習 are one entry.
    expect(lookupCvdict(shardOf("复习"), "复习")).toEqual([
      { trad: ["復習", "複習"], pinyin: "fù xí", senses: ["xem lại", "ôn tập"], classifiers: [{ hanzi: "次", pinyin: "cì" }] },
    ]);
  });

  it("has words outside the HSK list", () => {
    expect(cvdictMeaning(lookupCvdict(shardOf("串门"), "串门"))).not.toBe("");
  });

  it("picks the entries of a reading, or all when none matches", () => {
    const shard = shardOf("好玩");
    expect(lookupCvdict(shard, "好玩", "hǎowán").map((e) => e.pinyin)).toEqual(["hǎo wán"]);
    expect(lookupCvdict(shard, "好玩", "hāowán")).toHaveLength(2);
    expect(lookupCvdict(shard, "hasOwnProperty")).toEqual([]);
  });

  it("lists longer words with the same start", () => {
    const words = wordsStartingWith(shardOf("亲"), "亲");
    expect(words).toContain("亲戚");
    expect(words).not.toContain("亲");
    expect(words.every((w) => w.startsWith("亲"))).toBe(true);
    // Two-character words come before longer ones.
    expect(Array.from(words[0])).toHaveLength(2);
    const ranked = wordsStartingWith(shardOf("亲"), "亲", (w) => (w === "亲切" ? 0 : 1));
    expect(ranked[0]).toBe("亲切");
  });

  it("names the shard file of a word", () => {
    expect(cvdictFile("亲戚")).toBe(`/data/cvdict/${cvdictShard("亲")}.json`);
    expect(cvdictFiles(["亲戚", "亲人", ""])).toEqual([cvdictFile("亲")]);
  });
});
