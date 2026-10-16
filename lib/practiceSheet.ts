import { pinyin } from "pinyin-pro";

export type GridType = "mizi" | "tianzi";

export type GridColorName =
  | "red"
  | "orange"
  | "brown"
  | "green"
  | "teal"
  | "blue"
  | "purple"
  | "pink"
  | "gray";
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
  /** Add a stroke-by-stroke strip above each character's first line. */
  showStrokeOrder: boolean;
  /** CSS font-family for the model, trace and hint characters. */
  fontFamily: string;
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
  orange: { border: "#b4530f", guide: "#f0a060" },
  brown: { border: "#6b4423", guide: "#b8906a" },
  green: { border: "#1f6b3a", guide: "#6fbf8a" },
  teal: { border: "#0f6b6b", guide: "#5fbcbc" },
  blue: { border: "#1d4e89", guide: "#6f9fd8" },
  purple: { border: "#5b2a86", guide: "#a983d1" },
  pink: { border: "#a3245e", guide: "#e28ab3" },
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

/** A single practice row: the first line of a character (with model/trace),
 *  an extra blank line that only shows a faint hint in the first box, or the
 *  stroke-order strip shown above the first line. */
export type SheetRow = { char: string; kind: "first" | "extra" | "strokes" };

/** Height of the stroke-order strip, as a fraction of a practice row. */
export const STROKE_STRIP_RATIO = 0.5;

/** Height of a row in mm. */
export function rowHeight(row: SheetRow, boxSize: number): number {
  return row.kind === "strokes" ? boxSize * STROKE_STRIP_RATIO : boxSize;
}

/**
 * Build A4 pages of rows. Each character occupies `linesPerChar` consecutive
 * rows (plus a half-height stroke strip when `withStrokes`), and a
 * character's group is never split across two pages.
 */
export function buildPages(
  chars: string[],
  linesPerChar: number,
  rowsPerPage: number,
  withStrokes = false,
): SheetRow[][] {
  const lines = Math.max(1, Math.min(6, Math.floor(linesPerChar) || 1));
  const groupRows = lines + (withStrokes ? STROKE_STRIP_RATIO : 0);
  const groupsPerPage = Math.max(1, Math.floor(rowsPerPage / groupRows));
  const pages: SheetRow[][] = [];
  for (let i = 0; i < chars.length; i += groupsPerPage) {
    const slice = chars.slice(i, i + groupsPerPage);
    const rows: SheetRow[] = [];
    for (const char of slice) {
      if (withStrokes) rows.push({ char, kind: "strokes" });
      for (let l = 0; l < lines; l++) {
        rows.push({ char, kind: l === 0 ? "first" : "extra" });
      }
    }
    pages.push(rows);
  }
  return pages;
}

/**
 * Side of one stroke-strip cell in mm: half a box, shrunk so that all
 * `strokeCount` steps fit on one strip across the grid width.
 */
export function stripCellSize(
  boxSize: number,
  gridWidth: number,
  strokeCount: number,
): number {
  const half = boxSize * STROKE_STRIP_RATIO;
  if (strokeCount <= 0) return half;
  return Math.min(half, gridWidth / strokeCount);
}

export function getPinyin(char: string): string {
  return pinyin(char, { toneType: "symbol" });
}