import { HSK_LEVELS, levelRank, type HskLevel, type ReaderLine, type ReaderWord } from "./analyze";

/** Per-level buckets: the seven HSK 3.0 levels, then words outside HSK. */
export type LevelKey = HskLevel | "none";
export const LEVEL_KEYS: readonly LevelKey[] = [...HSK_LEVELS, "none"];

export type LevelStats = {
  /** Word tokens (every occurrence) per level. */
  tokens: Record<LevelKey, number>;
  /** Distinct words per level. */
  distinct: Record<LevelKey, number>;
  totalTokens: number;
  totalDistinct: number;
};

const words = (lines: readonly ReaderLine[]): ReaderWord[] =>
  lines.flatMap((l) => l.filter((t): t is ReaderWord => t.kind === "word"));

const zero = () => Object.fromEntries(LEVEL_KEYS.map((k) => [k, 0])) as Record<LevelKey, number>;

export function levelStats(lines: readonly ReaderLine[]): LevelStats {
  const tokens = zero();
  const distinct = zero();
  const seen = new Set<string>();
  for (const w of words(lines)) {
    const key: LevelKey = w.level ?? "none";
    tokens[key]++;
    if (!seen.has(w.text)) {
      seen.add(w.text);
      distinct[key]++;
    }
  }
  return {
    tokens,
    distinct,
    totalTokens: Object.values(tokens).reduce((a, b) => a + b, 0),
    totalDistinct: seen.size,
  };
}

/** Percentage of a text's words a reader must know to read it comfortably. */
export const COVERAGE_PERCENT = 95;

/**
 * Estimated HSK level of a text: the lowest level whose words, together with
 * all lower levels, make up at least 95 % of the words that have an HSK
 * level. Words outside the list (names such as 越南, rare words) are left out
 * of the estimate and reported apart (outsideShare): every text with a name
 * would otherwise read as "harder than HSK 9". "beyond" when fewer than half
 * the words are listed (no fair estimate); null for a text with no words.
 */
export function estimateLevel(stats: LevelStats): HskLevel | "beyond" | null {
  if (stats.totalTokens === 0) return null;
  const listed = stats.totalTokens - stats.tokens.none;
  if (listed * 2 < stats.totalTokens) return "beyond";
  let covered = 0;
  for (const level of HSK_LEVELS) {
    covered += stats.tokens[level];
    // Whole-number comparison: no floating-point error exactly at 95 %.
    if (covered * 100 >= listed * COVERAGE_PERCENT) return level;
  }
  return "7-9";
}

/** Share of word tokens outside the HSK list (not counted in the estimate). */
export function outsideShare(stats: LevelStats): number {
  return stats.totalTokens ? stats.tokens.none / stats.totalTokens : 0;
}

/** Cumulative share of tokens at each level or below (for "≤ HSK n" labels). */
export function cumulativeShare(stats: LevelStats): Record<HskLevel, number> {
  let covered = 0;
  const out = {} as Record<HskLevel, number>;
  for (const level of HSK_LEVELS) {
    covered += stats.tokens[level];
    out[level] = stats.totalTokens ? covered / stats.totalTokens : 0;
  }
  return out;
}

/**
 * Whether the reader knows a word: it is in their known list, or (when they
 * count their level as known) it is at or below that level.
 */
export function makeIsKnown(
  known: ReadonlySet<string>,
  myLevel: HskLevel,
  levelCountsAsKnown: boolean,
): (w: Pick<ReaderWord, "text" | "level">) => boolean {
  return (w) => known.has(w.text) || (levelCountsAsKnown && w.level !== null && levelRank(w.level) <= levelRank(myLevel));
}

/** Share of word tokens the reader knows (0 for a text with no words). */
export function knownShare(lines: readonly ReaderLine[], isKnown: (w: ReaderWord) => boolean): number {
  const all = words(lines);
  return all.length ? all.filter(isKnown).length / all.length : 0;
}

export type TableRow = ReaderWord & { count: number; first: number };

/** Distinct words in order of first appearance, with how often each occurs. */
export function wordTable(lines: readonly ReaderLine[]): TableRow[] {
  const rows = new Map<string, TableRow>();
  words(lines).forEach((w, i) => {
    const row = rows.get(w.text);
    if (row) row.count++;
    else rows.set(w.text, { ...w, count: 1, first: i });
  });
  return [...rows.values()];
}

export type SortKey = "order" | "count" | "level";

export function sortRows(rows: readonly TableRow[], key: SortKey): TableRow[] {
  const by: Record<SortKey, (a: TableRow, b: TableRow) => number> = {
    order: (a, b) => a.first - b.first,
    count: (a, b) => b.count - a.count || a.first - b.first,
    level: (a, b) => levelRank(a.level) - levelRank(b.level) || a.first - b.first,
  };
  return [...rows].sort(by[key]);
}
