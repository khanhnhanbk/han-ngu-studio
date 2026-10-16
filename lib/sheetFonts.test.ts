import { describe, expect, it } from "vitest";

import { fontStack, isSheetFontId, quoteFamily, UPLOAD_FAMILY } from "./sheetFonts";

describe("quoteFamily", () => {
  it("quotes and escapes", () => {
    expect(quoteFamily("KaiTi")).toBe('"KaiTi"');
    expect(quoteFamily('A "B" \\ C')).toBe('"A \\"B\\" \\\\ C"');
  });
});

describe("fontStack", () => {
  it("puts the preset first and keeps the Kai fallback", () => {
    expect(fontStack("mashanzheng")).toMatch(/^var\(--font-mashanzheng\), var\(--font-kai\)/);
  });

  it("uses the local font name, or only the fallback when empty", () => {
    expect(fontStack("local", " 楷体 ")).toMatch(/^"楷体", var\(--font-kai\)/);
    expect(fontStack("local", "  ")).toMatch(/^var\(--font-kai\)/);
  });

  it("uses the uploaded family", () => {
    expect(fontStack("upload").startsWith(`"${UPLOAD_FAMILY}"`)).toBe(true);
  });
});

describe("isSheetFontId", () => {
  it("accepts known ids only", () => {
    expect(isSheetFontId("notoSerif")).toBe(true);
    expect(isSheetFontId("local")).toBe(true);
    expect(isSheetFontId("comic")).toBe(false);
    expect(isSheetFontId(3)).toBe(false);
  });
});
