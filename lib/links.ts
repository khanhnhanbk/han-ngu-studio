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
  | "comprehensibleInput";

/** Live tools, in the order the landing page and footer show them. */
export const TOOLS: ReadonlyArray<{ id: ToolId; href: string; icon: string }> = [
  { id: "practiceSheet", href: "/tools/practice-sheet", icon: "筆" },
  { id: "strokeOrder", href: "/tools/stroke-order", icon: "畫" },
  { id: "segment", href: "/tools/segment", icon: "分" },
  { id: "pinyin", href: "/tools/pinyin", icon: "拼" },
  { id: "hanviet", href: "/tools/hanviet", icon: "越" },
  { id: "anki", href: "/tools/anki", icon: "札" },
  { id: "comprehensibleInput", href: "/tools/comprehensible-input", icon: "句" },
];
