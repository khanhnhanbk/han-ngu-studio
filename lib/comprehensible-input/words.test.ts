import { describe, expect, it } from "vitest";

import { createTokenizer } from "@/lib/segment/tokenizer";

import golden from "./__golden__/words.json";
import { extractWords, parseKnownWords, parseSentences, pyWordMatch } from "./words";

// Small stub vocabulary (rank = line number).
const tokenizer = createTokenizer(["我", "爱", "学习", "中文"]);

describe("extractWords (golden)", () => {
  it("has a source note", () => expect(golden.source).toMatch(/hand-checked/));
  it.each(golden.cases.map((c) => [c.input, c.expected] as const))("%s", (input, expected) => {
    expect([...extractWords(tokenizer, input)].sort()).toEqual([...expected].sort());
  });
});

describe("extractWords", () => {
  it("counts duplicates once", () => {
    expect(extractWords(tokenizer, "我我我").size).toBe(1);
  });
  it("keeps a non-BMP character as one code point", () => {
    const words = extractWords(tokenizer, "𠮷");
    expect([...words]).toEqual(["𠮷"]);
    expect(Array.from([...words][0]).length).toBe(1);
  });
});

describe("pyWordMatch", () => {
  it("accepts letters, digits, underscore", () => {
    for (const s of ["a", "7", "_", "\u00e9", "٣", "Ⅷ", "²", "中"]) expect(pyWordMatch(s)).toBe(true);
  });
  it("rejects punctuation, spaces, empty and combining marks (not isalnum in Python)", () => {
    for (const s of ["，", ".", " ", "", "a b", "e\u0301", "\u0301"]) expect(pyWordMatch(s)).toBe(false);
  });
});

describe("parseSentences", () => {
  it("skips blank lines but keeps original line numbers", () => {
    expect(parseSentences("我爱\n\n  \r\n学习\r\n")).toEqual([
      { idx: 0, text: "我爱" },
      { idx: 3, text: "学习" },
    ]);
  });
  it("treats a lone \\r as a line break (Python universal newlines)", () => {
    expect(parseSentences("我\r爱")).toEqual([
      { idx: 0, text: "我" },
      { idx: 1, text: "爱" },
    ]);
  });
});

describe("parseKnownWords", () => {
  it("reads one word per line", () => {
    expect([...parseKnownWords("我\r\n\n 爱 \n我")]).toEqual(["我", "爱"]);
  });
});
