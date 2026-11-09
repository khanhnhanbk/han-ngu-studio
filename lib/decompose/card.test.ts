import { describe, expect, it } from "vitest";

import { cardFileName, clampLines, formulaOf, pickStory, shortMeaning, wrapText } from "./card";

// Fixed-width measure: every character (CJK, Latin, space) is 10 px wide.
const measure = (s: string) => Array.from(s).length * 10;

describe("shortMeaning", () => {
  it("keeps the first sense only", () => {
    expect(shortMeaning("trong, sạch; rõ ràng")).toBe("trong, sạch");
    expect(shortMeaning("nước；sông")).toBe("nước");
  });

  it("cuts long senses with an ellipsis", () => {
    expect(shortMeaning("abcdefghij", 5)).toBe("abcd…");
    expect(shortMeaning("abcde", 5)).toBe("abcde");
  });
});

describe("formulaOf", () => {
  it("joins two or more known parts", () => {
    expect(formulaOf("清", ["氵", "青"])).toBe("氵 + 青 = 清");
    expect(formulaOf("意", ["立", "日", "心"])).toBe("立 + 日 + 心 = 意");
  });

  it("is empty with one part or an unknown part", () => {
    expect(formulaOf("一", ["一"])).toBe("");
    expect(formulaOf("清", ["氵", null])).toBe("");
    expect(formulaOf("清", [])).toBe("");
  });
});

describe("pickStory", () => {
  const suggestion = { story: "Nước (氵) xanh (青) thì trong (清).", kind: "meo" as const, reviewed: false, source: "" };

  it("uses the suggestion by default, even when there is an own note", () => {
    expect(pickStory(suggestion, "của tôi", false)).toEqual({
      from: "suggestion",
      text: suggestion.story,
      kind: "meo",
      reviewed: false,
      source: "",
    });
  });

  it("uses the own note only when ticked and not blank", () => {
    expect(pickStory(suggestion, "  của tôi ", true)).toEqual({ from: "own", text: "của tôi" });
    expect(pickStory(suggestion, "   ", true)?.from).toBe("suggestion");
    expect(pickStory(null, "", true)).toBeNull();
  });
});

describe("wrapText", () => {
  it("breaks Vietnamese at spaces", () => {
    expect(wrapText("Nước xanh thì trong", 100, measure)).toEqual(["Nước xanh", "thì trong"]);
  });

  it("breaks CJK between characters", () => {
    expect(wrapText("一二三四五六七", 30, measure)).toEqual(["一二三", "四五六", "七"]);
  });

  it("mixes Vietnamese and CJK", () => {
    expect(wrapText("Người (亻) tựa cây", 80, measure)).toEqual(["Người", "(亻) tựa", "cây"]);
  });

  it("never starts a line with CJK punctuation", () => {
    expect(wrapText("一二，三四", 30, measure)).toEqual(["一", "二，三", "四"]);
  });

  it("breaks a word longer than the line by character", () => {
    expect(wrapText("abcdefghij", 40, measure)).toEqual(["abcd", "efgh", "ij"]);
  });

  it("keeps explicit newlines and empty text", () => {
    expect(wrapText("ab\ncd", 100, measure)).toEqual(["ab", "cd"]);
    expect(wrapText("", 100, measure)).toEqual([""]);
  });

  it("handles characters outside the BMP as one character", () => {
    expect(wrapText("𠀀𠀁𠀂", 20, measure)).toEqual(["𠀀𠀁", "𠀂"]);
  });
});

describe("clampLines", () => {
  it("leaves short lists alone", () => {
    expect(clampLines(["a", "b"], 3, 100, measure)).toEqual(["a", "b"]);
  });

  it("cuts to maxLines and ends with an ellipsis that fits", () => {
    expect(clampLines(["abcd", "efgh", "ijkl"], 2, 40, measure)).toEqual(["abcd", "efg…"]);
  });
});

describe("cardFileName", () => {
  it("names the file after the character", () => {
    expect(cardFileName("清")).toBe("the-chu-清.png");
  });
});
