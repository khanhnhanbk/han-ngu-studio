export const REPO_URL = "https://github.com/khanhnhanbk/han-ngu-studio";
/** Vietnamese user guide (userguide/ in the repo, not deployed). */
export const USER_GUIDE_URL = `${REPO_URL}/tree/main/userguide`;

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
  | "lookup";

export type ToolGroupId = "chars" | "text" | "vocab";

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
  lookup: "/tools/tra-tu",
};

/**
 * Live tools grouped by what the learner wants to do: study one character,
 * read a text, or learn a word list. The Navbar menu, footer and landing
 * page all show these groups in this order.
 */
export const TOOL_GROUPS: ReadonlyArray<{ id: ToolGroupId; tools: ReadonlyArray<{ id: ToolId; href: string }> }> = (
  [
    { id: "chars", tools: ["strokeOrder", "decompose", "radicals", "practiceSheet"] },
    { id: "text", tools: ["reader", "stories", "pinyin", "hanviet", "segment"] },
    { id: "vocab", tools: ["lookup", "anki", "quiz", "comprehensibleInput"] },
  ] as const
).map((g) => ({ id: g.id, tools: g.tools.map((id) => ({ id, href: HREF[id] })) }));

/** Every live tool, in group order. */
export const TOOLS: ReadonlyArray<{ id: ToolId; href: string }> = TOOL_GROUPS.flatMap((g) => g.tools);

/** Where the landing page's "try it" buttons go. */
export const PRACTICE_SHEET_HREF = HREF.practiceSheet;
