export const REPO_URL = "https://github.com/khanhnhanbk/han-ngu-studio";
/** Vietnamese user guide (userguide/ in the repo, not deployed). */
export const USER_GUIDE_URL = `${REPO_URL}/tree/main/userguide`;

/** The owner's Zalo, for quick feedback without a GitHub account (same link as the portfolio). */
export const ZALO_URL = "https://zalo.me/84349796850";

/** The owner's portfolio, linked from the "who made this" card on the home page. */
export const PORTFOLIO_URL = "https://khanhnhanbk.github.io";

export type ToolId =
  | "reader"
  | "practiceSheet"
  | "strokeOrder"
  | "segment"
  | "pinyin"
  | "hanviet"
  | "anki"
  | "quiz"
  | "radicals"
  | "decompose"
  | "comprehensibleInput"
  | "stories"
  | "lookup"
  | "path";

export type ToolGroupId = "prepare" | "chars" | "read";

const HREF: Record<ToolId, string> = {
  reader: "/tools/reader",
  practiceSheet: "/tools/practice-sheet",
  strokeOrder: "/tools/stroke-order",
  segment: "/tools/segment",
  pinyin: "/tools/pinyin",
  hanviet: "/tools/hanviet",
  anki: "/tools/anki",
  quiz: "/tools/quiz",
  radicals: "/tools/radicals",
  decompose: "/tools/decompose",
  comprehensibleInput: "/tools/comprehensible-input",
  stories: "/tools/stories",
  lookup: "/tools/lookup",
  path: "/tools/path",
};

/**
 * Live tools grouped by what a teacher wants to do: prepare a lesson and its
 * review material, teach characters, or look up and read (owner decision
 * 2026-11-14). The Navbar menu, footer and landing page all show these groups
 * in this order; the home page map "Bạn muốn làm gì?" (lib/needs.ts) points
 * into them.
 */
export const TOOL_GROUPS: ReadonlyArray<{ id: ToolGroupId; tools: ReadonlyArray<{ id: ToolId; href: string }> }> = (
  [
    { id: "prepare", tools: ["anki", "quiz", "practiceSheet"] },
    { id: "chars", tools: ["strokeOrder", "decompose", "radicals", "path"] },
    { id: "read", tools: ["lookup", "reader", "stories", "pinyin"] },
  ] as const
).map((g) => ({ id: g.id, tools: g.tools.map((id) => ({ id, href: HREF[id] })) }));

/**
 * Tools left out of the menu, footer and home page because other tools already
 * do their job better (owner decision 2026-11-14): Đọc hiểu shows word breaks
 * and Hán Việt, Tra từ and the Soạn bài word table give Hán Việt, and N+1 has no
 * teacher flow. Their pages and links keep working.
 */
export const HIDDEN_TOOLS: ReadonlyArray<{ id: ToolId; href: string }> = (
  ["segment", "hanviet", "comprehensibleInput"] as const
).map((id) => ({ id, href: HREF[id] }));

/** Every tool shown in the menu, in group order (hidden ones left out). */
export const TOOLS: ReadonlyArray<{ id: ToolId; href: string }> = TOOL_GROUPS.flatMap((g) => g.tools);

/** Where the landing page's "try it" buttons go. */
export const PRACTICE_SHEET_HREF = HREF.practiceSheet;
