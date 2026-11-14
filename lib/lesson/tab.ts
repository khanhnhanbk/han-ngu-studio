/** The output tabs of Soạn bài, in the order they are shown. */
export const LESSON_TABS = ["table", "slides", "anki", "quiz", "practiceSheet"] as const;
export type LessonTab = (typeof LESSON_TABS)[number];

/**
 * The tab named in the URL hash (`/lesson#tab=slides`), so the home page's
 * "Bạn muốn làm gì?" map can open Soạn bài on the right output. The hash never
 * reaches the server. Anything unknown gives null (the page keeps "Bảng từ").
 */
export function tabFromHash(hash: string): LessonTab | null {
  const value = new URLSearchParams(hash.replace(/^#/, "")).get("tab");
  return (LESSON_TABS as readonly string[]).includes(value ?? "") ? (value as LessonTab) : null;
}

/** The link that opens Soạn bài on one tab. */
export function lessonTabHref(tab: LessonTab): string {
  return tab === "table" ? "/lesson" : `/lesson#tab=${tab}`;
}
