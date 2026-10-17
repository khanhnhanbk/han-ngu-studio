import { describe, expect, it } from "vitest";

import golden from "./__golden__/ordering.json";
import { buildFreqRank } from "./freq";
import { codePointCompare, orderSentences, summarize } from "./order";

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
    expect(summarize(rows)).toEqual(c.summary);
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
