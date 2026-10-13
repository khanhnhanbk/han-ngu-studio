import { pinyin } from "pinyin-pro";

export type GridType = "mizi" | "tianzi";

export type GridColorName = "red" | "green" | "blue" | "gray";
export type TraceShadeName = "medium" | "light" | "dark";
export type BoxSizeName = "small" | "medium" | "large" | "xlarge";

export type SheetOptions = {
  gridType: GridType;
  /** Number of light-gray boxes to trace after the black model box. */
  traceCount: number;
  showPinyin: boolean;
  /** Grid border/guide colour preset. */
  gridColor: GridColorName;
  /** Darkness of the trace characters. */
  traceShade: TraceShadeName;
  /** Box size preset (drives the whole layout). */
  boxSize: BoxSizeName;
  /** How many practice lines each character gets (1 = one row per char). */
  linesPerChar: number;
};

// A4 layout in millimetres (mirrors main.py). Box size is now selectable,
// so the grid dimensions are derived per-render via getLayout().
export const PAGE_WIDTH = 210;
export const PAGE_HEIGHT = 297;
export const MARGIN_X = 8;
export const MARGIN_TOP = 16;
export const MAX_CHARACTERS = 300;

export const GRID_COLORS: Record<
  GridColorName,
  { border: string; guide: string }
> = {
  red: { border: "#801a1a", guide: "#cc6666" },
  green: { border: "#1f6b3a", guide: "#6fbf8a" },
  blue: { border: "#1d4e89", guide: "#6f9fd8" },
  gray: { border: "#333333", guide: "#999999" },
};

export const TRACE_COLORS: Record<TraceShadeName, string> = {
  medium: "#b0b0b0",
  light: "#d4d4d4",
  dark: "#8a8a8a",
};

export const BOX_SIZES: Record<BoxSizeName, number> = {
  small: 12,
  medium: 16,
  large: 20,
  xlarge: 25,
};

export type SheetLayout = {
  boxSize: number;
  labelWidth: number;
  boxesPerRow: number;
  rowsPerPage: number;
  maxTrace: number;
};

/** Compute the A4 grid layout for a given box size preset. */
export function getLayout(boxSize: BoxSizeName): SheetLayout {
  const size = BOX_SIZES[boxSize];
  const labelWidth = Math.max(14, size * 1.1);
  const boxesPerRow = Math.floor(
    (PAGE_WIDTH - MARGIN_X * 2 - labelWidth) / size,
  );
  const rowsPerPage = Math.floor((PAGE_HEIGHT - MARGIN_TOP - 8) / size);
  return {
    boxSize: size,
    labelWidth,
    boxesPerRow,
    rowsPerPage,
    maxTrace: boxesPerRow - 1,
  };
}

const HAN = /\p{Script=Han}/u;

/** Keep only Han characters; whitespace, punctuation, CSV commas and Latin text are dropped. */
export function parseCharacters(text: string, dedupe = false): string[] {
  const chars = Array.from(text).filter((c) => HAN.test(c));
  return dedupe ? Array.from(new Set(chars)) : chars;
}

export function paginate<T>(items: T[], perPage = 17): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += perPage) {
    pages.push(items.slice(i, i + perPage));
  }
  return pages;
}

/** A single practice row: the first line of a character (with model/trace)
 *  or an extra blank line that only shows a faint hint in the first box. */
export type SheetRow = { char: string; kind: "first" | "extra" };

/**
 * Build A4 pages of rows. Each character occupies `linesPerChar` consecutive
 * rows, and a character's group is never split across two pages.
 */
export function buildPages(
  chars: string[],
  linesPerChar: number,
  rowsPerPage: number,
): SheetRow[][] {
  const lines = Math.max(1, Math.min(6, Math.floor(linesPerChar) || 1));
  const groupsPerPage = Math.max(1, Math.floor(rowsPerPage / lines));
  const pages: SheetRow[][] = [];
  for (let i = 0; i < chars.length; i += groupsPerPage) {
    const slice = chars.slice(i, i + groupsPerPage);
    const rows: SheetRow[] = [];
    for (const char of slice) {
      for (let l = 0; l < lines; l++) {
        rows.push({ char, kind: l === 0 ? "first" : "extra" });
      }
    }
    pages.push(rows);
  }
  return pages;
}

export function getPinyin(char: string): string {
  return pinyin(char, { toneType: "symbol" });
}