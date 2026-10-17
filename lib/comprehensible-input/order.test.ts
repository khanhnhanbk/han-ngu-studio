import { describe, expect, it } from "vitest";

import golden from "./__golden__/ordering.json";
import { buildFreqRank } from "./freq";
import { codePointCompare, isLongSentence, orderSentences, summarize, type OrderedRow } from "./order";

describe("orderSentences (hand-checked golden)", () => {
  it.each(golden.cases.map((c) => [c.name, c] as const))("%s", (_, c) => {
    const rows = orderSentences(
      c.sentences,
      new Set(c.known),
      buildFreqRank(c.wordList),
    );
    expect(rows.map((r) => ({ idx: r.idx, newWords: r.newWords }))).toEqual(
      c.expected,
    );
    expect(rows.map((r) => r.newCount)).toEqual(
      c.expected.map((e) => e.newWords.length),
    );
    // every non-blank input sentence exactly once
    const nonBlank = c.sentences
      .map((s, i) => (s.text.trim() ? i : -1))
      .filter((i) => i >= 0);
    expect(rows.map((r) => r.idx).sort((a, b) => a - b)).toEqual(nonBlank);
    const summary = summarize(rows);
    expect(summary).toMatchObject(c.summary);
    expect(summary.totalNewWords).toBe(summary.distinctNewWords);
  });
});

describe("codePointCompare", () => {
  it("puts non-BMP after U+FF5E (UTF-16 order would not)", () => {
    expect(["\u{20BB7}", "～"].sort()).toEqual(["\u{20BB7}", "～"]);
    expect(codePointCompare("\u{20BB7}", "～")).toBe(1);
    expect(codePointCompare("～", "\u{20BB7}")).toBe(-1);
    expect(codePointCompare("a", "a")).toBe(0);
    expect(codePointCompare("a", "ab")).toBe(-1);
  });
});

describe("summarize", () => {
  const row = (text: string, newWords: string[]): OrderedRow => ({
    text,
    idx: 0,
    newWords,
    newCount: newWords.length,
  });

  it("counts buckets, totals, average, max and long rows", () => {
    const long = "我".repeat(26);
    expect(
      summarize([row("a", []), row("b", ["我"]), row("c", ["你", "好"]), row(long, ["他", "们", "的"])]),
    ).toEqual({
      zero: 1,
      one: 1,
      twoPlus: 2,
      distinctNewWords: 6,
      totalNewWords: 6,
      average: 1.5,
      maxNew: 3,
      longCount: 1,
    });
  });

  it("is all zero for no rows", () => {
    expect(summarize([])).toMatchObject({ totalNewWords: 0, average: 0, maxNew: 0, longCount: 0 });
  });
});

describe("isLongSentence", () => {
  it("counts code points, not UTF-16 units", () => {
    expect(isLongSentence("我".repeat(25))).toBe(false);
    expect(isLongSentence("我".repeat(26))).toBe(true);
    // 13 non-BMP chars = 26 UTF-16 units but only 13 code points
    expect(isLongSentence("\u{20BB7}".repeat(13))).toBe(false);
  });
});
