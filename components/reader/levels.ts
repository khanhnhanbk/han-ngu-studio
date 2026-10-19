import type { LevelKey } from "@/lib/reader/stats";

/**
 * One hue per HSK level, cool (easy) to warm (hard), and neutral for words
 * outside HSK. Only underlines, dots and bars carry the hue; text stays in
 * the ink tokens, so it reads the same in light and dark mode. Class names
 * are spelled out so Tailwind keeps them.
 */
export const LEVEL_STYLE: Record<LevelKey, { underline: string; bg: string }> = {
  1: { underline: "decoration-emerald-500", bg: "bg-emerald-500" },
  2: { underline: "decoration-teal-500", bg: "bg-teal-500" },
  3: { underline: "decoration-sky-500", bg: "bg-sky-500" },
  4: { underline: "decoration-blue-500", bg: "bg-blue-500" },
  5: { underline: "decoration-violet-500", bg: "bg-violet-500" },
  6: { underline: "decoration-fuchsia-500", bg: "bg-fuchsia-500" },
  "7-9": { underline: "decoration-rose-500", bg: "bg-rose-500" },
  none: { underline: "decoration-ink-500/40", bg: "bg-ink-500/40" },
};

export const levelLabel = (level: LevelKey, none: string) => (level === "none" ? none : `HSK ${level}`);

/** Percentage as the pages show it ("85%", "<1%"). */
export function percent(share: number): string {
  if (share > 0 && share < 0.01) return "<1%";
  return `${Math.round(share * 100)}%`;
}
