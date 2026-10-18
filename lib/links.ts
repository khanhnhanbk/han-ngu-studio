export const REPO_URL = "https://github.com/khanhnhanbk/han-ngu-studio";
/** Vietnamese user guide (userguide/ in the repo, not deployed). */
export const USER_GUIDE_URL = `${REPO_URL}/tree/main/userguide`;

export type ToolId =
  | "practiceSheet"
  | "strokeOrder"
  | "segment"
  | "pinyin"
  | "hanviet"
  | "anki"
  | "quiz"
  | "radicals"
  | "decompose"
  | "comprehensibleInput";

/** Live tools, in the order the landing page and footer show them. */
export const TOOLS: ReadonlyArray<{ id: ToolId; href: string }> = [
  { id: "practiceSheet", href: "/tools/practice-sheet" },
  { id: "strokeOrder", href: "/tools/stroke-order" },
  { id: "segment", href: "/tools/segment" },
  { id: "pinyin", href: "/tools/pinyin" },
  { id: "hanviet", href: "/tools/hanviet" },
  { id: "anki", href: "/tools/anki" },
  { id: "quiz", href: "/tools/quiz" },
  { id: "radicals", href: "/tools/radicals" },
  { id: "decompose", href: "/tools/decompose" },
  { id: "comprehensibleInput", href: "/tools/comprehensible-input" },
];
