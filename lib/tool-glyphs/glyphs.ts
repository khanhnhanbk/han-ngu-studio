import type { ToolId } from "@/lib/links";

/**
 * One Chinese character per tool, shown as the badge on its landing-page card.
 * `trad` is the Taiwan form (OpenCC cn→tw) when it differs, kept here so the
 * Phồn thể switch never has to download OpenCC just for the icons.
 * `glyphs.test.ts` checks every `trad` against OpenCC.
 */
export const TOOL_GLYPHS: Record<ToolId, { simp: string; trad?: string }> = {
  path: { simp: "路" },
  strokeOrder: { simp: "笔", trad: "筆" },
  decompose: { simp: "拆" },
  radicals: { simp: "部" },
  practiceSheet: { simp: "写", trad: "寫" },
  reader: { simp: "读", trad: "讀" },
  stories: { simp: "故" },
  pinyin: { simp: "拼" },
  hanviet: { simp: "越" },
  segment: { simp: "分" },
  lookup: { simp: "查" },
  anki: { simp: "卡" },
  quiz: { simp: "考" },
  comprehensibleInput: { simp: "句" },
};
