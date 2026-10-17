import { describe, expect, it } from "vitest";

import { splitHighlight } from "./highlight";

const p = (text: string) => ({ text, highlighted: false });
const h = (text: string) => ({ text, highlighted: true });

describe("splitHighlight", () => {
  it("returns one plain part with no new words", () => {
    expect(splitHighlight("我爱你", [])).toEqual([p("我爱你")]);
  });
  it("highlights a word in the middle", () => {
    expect(splitHighlight("我爱你们", ["爱"])).toEqual([p("我"), h("爱"), p("你们")]);
  });
  it("handles adjacent words", () => {
    expect(splitHighlight("我爱你", ["我", "爱"])).toEqual([h("我"), h("爱"), p("你")]);
  });
  it("prefers the longest overlapping word", () => {
    expect(splitHighlight("学习中文", ["学", "学习"])).toEqual([h("学习"), p("中文")]);
  });
  it("works with astral-plane characters", () => {
    expect(splitHighlight("a𠀀b", ["𠀀"])).toEqual([p("a"), h("𠀀"), p("b")]);
  });
  it("returns [] for empty input", () => {
    expect(splitHighlight("", ["我"])).toEqual([]);
  });
});
