import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import type { VocabData } from "@/lib/vocab/lookup";

import { addWords, HSK_LEVELS, splitParts, wordsOfLevel } from "./picker";

const vocab: VocabData = {
  爱: [["1", "ài", "yêu"]],
  爱好: [["2", "àihào", "sở thích"]],
  // Listed at two levels: counts at the lowest.
  好: [
    ["3", "hào", "thích"],
    ["1", "hǎo", "tốt"],
  ],
  把握: [["7-9", "bǎwò", "nắm chắc"]],
};

describe("wordsOfLevel", () => {
  it("lists words at their lowest level, in file order", () => {
    expect(wordsOfLevel(vocab, "1")).toEqual(["爱", "好"]);
    expect(wordsOfLevel(vocab, "2")).toEqual(["爱好"]);
    expect(wordsOfLevel(vocab, "3")).toEqual([]);
    expect(wordsOfLevel(vocab, "7-9")).toEqual(["把握"]);
  });

  it("covers every word of the real list exactly once", () => {
    const real = JSON.parse(readFileSync(join(__dirname, "../../public/data/vocab.json"), "utf-8")) as VocabData;
    const total = HSK_LEVELS.reduce((n, level) => n + wordsOfLevel(real, level).length, 0);
    expect(total).toBe(Object.keys(real).length);
    expect(wordsOfLevel(real, "1").length).toBeGreaterThan(400);
  });
});

describe("splitParts", () => {
  it("keeps a short list whole", () => {
    expect(splitParts([1, 2, 3], 5)).toEqual([[1, 2, 3]]);
    expect(splitParts([], 5)).toEqual([[]]);
  });

  it("splits into the fewest even parts", () => {
    expect(splitParts([1, 2, 3, 4, 5, 6, 7], 5)).toEqual([
      [1, 2, 3, 4],
      [5, 6, 7],
    ]);
    const parts = splitParts(Array.from({ length: 5619 }, (_, i) => i), 1000);
    expect(parts).toHaveLength(6);
    expect(Math.max(...parts.map((p) => p.length))).toBeLessThanOrEqual(1000);
    expect(parts.flat()).toHaveLength(5619);
  });
});

describe("addWords", () => {
  it("adds new words after the current ones", () => {
    expect(addWords(["大学"], ["爱", "好"], {}, true)).toEqual({ words: ["大学", "爱", "好"], added: 2, known: 0, already: 0, overLimit: 0 });
  });

  it("skips words already listed and known words", () => {
    const r = addWords(["爱"], ["爱", "好", "爱好"], { 好: "2026-11-01" }, true);
    expect(r).toEqual({ words: ["爱", "爱好"], added: 1, known: 1, already: 1, overLimit: 0 });
  });

  it("keeps known words when asked to", () => {
    expect(addWords([], ["好"], { 好: "2026-11-01" }, false).words).toEqual(["好"]);
  });

  it("stops at the limit and counts the rest", () => {
    const r = addWords(["a"], ["b", "c", "d"], {}, true, 3);
    expect(r.words).toEqual(["a", "b", "c"]);
    expect(r.overLimit).toBe(1);
  });
});
