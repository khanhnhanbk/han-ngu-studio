import { pinyin } from "pinyin-pro";

export type GridType = "mizi" | "tianzi";

export type SheetOptions = {
  gridType: GridType;
  /** Number of light-gray boxes to trace after the black model box. */
  traceCount: number;
  showPinyin: boolean;
};

// A4 layout in millimetres (mirrors main.py: one character per row, 米字格 boxes).
export const PAGE_WIDTH = 210;
export const PAGE_HEIGHT = 297;
export const MARGIN_X = 8;
export const MARGIN_TOP = 16;
export const LABEL_WIDTH = 18;
export const BOX_SIZE = 16;
export const BOXES_PER_ROW = Math.floor(
  (PAGE_WIDTH - MARGIN_X * 2 - LABEL_WIDTH) / BOX_SIZE,
);
export const ROWS_PER_PAGE = Math.floor(
  (PAGE_HEIGHT - MARGIN_TOP - 8) / BOX_SIZE,
);
export const MAX_TRACE = BOXES_PER_ROW - 1;
export const MAX_CHARACTERS = 300;

const HAN = /\p{Script=Han}/u;

/** Keep only Han characters; whitespace, punctuation, CSV commas and Latin text are dropped. */
export function parseCharacters(text: string, dedupe = false): string[] {
  const chars = Array.from(text).filter((c) => HAN.test(c));
  return dedupe ? Array.from(new Set(chars)) : chars;
}

export function paginate<T>(items: T[], perPage = ROWS_PER_PAGE): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += perPage) {
    pages.push(items.slice(i, i + perPage));
  }
  return pages;
}

export function getPinyin(char: string): string {
  return pinyin(char, { toneType: "symbol" });
}
