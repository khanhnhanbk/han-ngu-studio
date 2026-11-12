// One link-preview image per tool page. `file` is the last part of the route
// (`/tools/practice-sheet` → `practice-sheet`), which `toolMetadata` uses to find
// `/og/<file>.png` (Vietnamese) and `/og/en/<file>.png` (English).
// `char` is the tool's own character (the same set as the tool-card icons);
// `vi` / `en` copy the tool titles in `features.items` of lib/i18n/vi.ts and en.ts.
// A title too long for one line at 56 px is given as two lines, split by hand so no
// word is left alone on a line.
export const TOOLS = [
  { file: "lesson", char: "课", vi: "Soạn bài", en: "Lesson builder" },
  { file: "path", char: "路", vi: "Lộ trình 1000 chữ", en: ["1000-character", "learning path"] },
  { file: "lookup", char: "查", vi: "Tra từ", en: "Word lookup" },
  { file: "stories", char: "故", vi: "Truyện đọc", en: "Stories" },
  { file: "practice-sheet", char: "写", vi: ["Phiếu tập viết", "chữ Hán"], en: ["Handwriting", "practice sheet"] },
  { file: "stroke-order", char: "笔", vi: "Tra thứ tự nét", en: "Stroke order lookup" },
  { file: "reader", char: "读", vi: "Đọc hiểu", en: "Reader" },
  { file: "segment", char: "分", vi: "Ngắt từ", en: "Word segmentation" },
  { file: "pinyin", char: "拼", vi: "Chuyển Pinyin", en: "Pinyin converter" },
  { file: "hanviet", char: "越", vi: "Âm Hán Việt", en: ["Sino-Vietnamese", "(Hán Việt)"] },
  { file: "anki", char: "卡", vi: "Tạo bộ thẻ Anki", en: "Anki deck builder" },
  { file: "quiz", char: "考", vi: "Trắc nghiệm từ vựng", en: "Vocabulary quiz" },
  { file: "radicals", char: "部", vi: "214 bộ thủ", en: "214 radicals" },
  { file: "decompose", char: "拆", vi: "Chiết tự", en: ["Character", "breakdown"] },
  { file: "comprehensible-input", char: "句", vi: "Sắp xếp câu N+1", en: "N+1 sentence order" },
];

/** The English home page (/en) also gets its own image; Vietnamese keeps app/opengraph-image.png. */
export const EN_HOME = { file: "home", char: "汉", en: "Hán Ngữ Studio", tagline: "Learn Chinese for free" };
