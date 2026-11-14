import type { Dictionary } from "@/lib/i18n/vi";
import { lessonTabHref } from "@/lib/lesson/tab";
import { TOOL_GROUPS, type ToolGroupId, type ToolId } from "@/lib/links";
import { TOOL_GLYPHS } from "@/lib/tool-glyphs/glyphs";

/** One "Tôi muốn…" leaf of the home page map; its text is `needMap.needs[id]` in lib/i18n. */
export type NeedId = keyof Dictionary["needMap"]["needs"];

export type Need = { id: NeedId; href: string; glyph: { simp: string; trad?: string } };

const hrefOf = (id: ToolId): string => {
  const tool = TOOL_GROUPS.flatMap((g) => g.tools).find((t) => t.id === id);
  if (!tool) throw new Error(`${id} is not a shown tool`);
  return tool.href;
};

// Soạn bài's own glyphs: 课 = lesson, 片 = slides.
const LESSON_GLYPH = { simp: "课", trad: "課" };
const SLIDES_GLYPH = { simp: "片" };

/**
 * "Bạn muốn làm gì?": the teacher's job → where to click, one branch per tool
 * group. Anki deck and quiz open inside Soạn bài (`/lesson#tab=…`), so the
 * teacher types the word list once; the stand-alone tools stay in the groups.
 */
export const NEED_MAP: ReadonlyArray<{ group: ToolGroupId; needs: ReadonlyArray<Need> }> = [
  {
    group: "prepare",
    needs: [
      { id: "lesson", href: lessonTabHref("table"), glyph: LESSON_GLYPH },
      { id: "slides", href: lessonTabHref("slides"), glyph: SLIDES_GLYPH },
      { id: "anki", href: lessonTabHref("anki"), glyph: TOOL_GLYPHS.anki },
      { id: "quiz", href: lessonTabHref("quiz"), glyph: TOOL_GLYPHS.quiz },
      { id: "practiceSheet", href: hrefOf("practiceSheet"), glyph: TOOL_GLYPHS.practiceSheet },
    ],
  },
  {
    group: "chars",
    needs: (["strokeOrder", "decompose", "radicals", "path"] as const).map((id) => ({
      id,
      href: hrefOf(id),
      glyph: TOOL_GLYPHS[id],
    })),
  },
  {
    group: "read",
    needs: (["lookup", "reader", "stories", "pinyin"] as const).map((id) => ({
      id,
      href: hrefOf(id),
      glyph: TOOL_GLYPHS[id],
    })),
  },
];
