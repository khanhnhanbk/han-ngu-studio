import { describe, expect, it } from "vitest";

import {
  buildPages,
  parseSheetCharacters,
  getLayout,
  rowHeight,
  stripCellSize,
  type SheetRow,
} from "./practiceSheet";

const chars = Array.from("永和九年岁在癸丑暮春之初会于会稽山阴之兰亭");

function pageHeight(rows: SheetRow[], boxSize: number): number {
  return rows.reduce((h, r) => h + rowHeight(r, boxSize), 0);
}

describe("buildPages", () => {
  it("keeps the old layout without the stroke strip", () => {
    const pages = buildPages(chars, 2, 17);
    expect(pages.map((p) => p.length)).toEqual([16, 16, 10]);
    expect(pages[0].slice(0, 3)).toEqual([
      { char: "永", kind: "first" },
      { char: "永", kind: "extra" },
      { char: "和", kind: "first" },
    ]);
  });

  it("puts a strip before each character's first line", () => {
    const pages = buildPages(chars, 1, 17, true);
    expect(pages[0].slice(0, 4)).toEqual([
      { char: "永", kind: "strokes" },
      { char: "永", kind: "first" },
      { char: "和", kind: "strokes" },
      { char: "和", kind: "first" },
    ]);
    // 17 rows / 1.5 rows per character = 11 characters per page.
    expect(pages[0].length).toBe(22);
  });

  it.each(["small", "medium", "large", "xlarge"] as const)(
    "never overflows the page or splits a character (%s)",
    (size) => {
      const layout = getLayout(size);
      for (const lines of [1, 2, 3, 6]) {
        for (const strokes of [false, true]) {
          const pages = buildPages(chars, lines, layout.rowsPerPage, strokes);
          const perChar = lines + (strokes ? 1 : 0);
          for (const rows of pages) {
            expect(pageHeight(rows, layout.boxSize)).toBeLessThanOrEqual(
              layout.rowsPerPage * layout.boxSize,
            );
            expect(rows.length % perChar).toBe(0);
          }
          expect(pages.flat().length).toBe(chars.length * perChar);
        }
      }
    },
  );
});

describe("stripCellSize", () => {
  it("is half a box when the strokes fit", () => {
    expect(stripCellSize(16, 160, 6)).toBe(8);
  });

  it("shrinks so every stroke fits on the strip", () => {
    expect(stripCellSize(25, 150, 33)).toBeCloseTo(150 / 33);
  });
});

describe("parseSheetCharacters", () => {
  it("pairs shown characters with their Simplified form for Pinyin", () => {
    const { chars, simpOf } = parseSheetCharacters("學們, 學!", "学们, 学!", true);
    expect(chars).toEqual(["學", "們"]);
    expect(simpOf.get("們")).toBe("们");
    expect(parseSheetCharacters("學們學", "学们学").chars).toEqual(["學", "們", "學"]);
  });
});
