import { describe, expect, it } from "vitest";

import { getPinyin, parseCharacters } from "@/lib/practiceSheet";

import { practiceSheetLink, TRY_DEFAULT, TRY_DEFAULT_PINYIN, tryChars } from "./tryBox";

describe("homepage try-box", () => {
  it("keeps only Han characters", () => {
    expect(tryChars("你好, hello 世界!")).toEqual(["你", "好", "世", "界"]);
    expect(tryChars("abc 123")).toEqual([]);
  });

  it("filters the same way as the practice sheet", () => {
    const text = "我們 学习, 中文 2026 ㄅ〇々 𠀀!";
    expect(tryChars(text)).toEqual(parseCharacters(text));
  });

  it("counts characters outside the BMP as one", () => {
    expect(tryChars("𠀀好")).toEqual(["𠀀", "好"]);
  });

  it("has the right built-in Pinyin for the default text", () => {
    expect(getPinyin(TRY_DEFAULT)).toBe(TRY_DEFAULT_PINYIN);
  });

  it("puts the characters in the hash", () => {
    expect(practiceSheetLink("/tools/practice-sheet", ["永", "和"])).toBe(
      "/tools/practice-sheet#chars=%E6%B0%B8%E5%92%8C",
    );
    const url = new URL(practiceSheetLink("/en/tools/practice-sheet", ["永"]), "https://x.test");
    expect(url.search).toBe("");
    expect(new URLSearchParams(url.hash.slice(1)).get("chars")).toBe("永");
  });
});
