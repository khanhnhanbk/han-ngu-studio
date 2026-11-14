# Regroup the tools + "Tôi muốn…" flow — 2026-11-14

Owner request (2026-11-14): reorganise the tools so a teacher sees at a glance which tool fits their need ("Tôi muốn soạn bài → …", "làm slide", "ôn từ Anki", "in phiếu tập viết"); tools that are not strong yet may be hidden. Status: **approved by the owner 2026-11-14**. Sections 1 and 2 shipped. Section 3 (the "Bạn muốn làm gì?" map and `/lesson#tab=`) was built as a tree under the hero, then **dropped by the owner the same day**; "Cách hoạt động" stays removed because it listed the hidden tools.

## Problem today

- Groups are by input type (Chữ Hán / Đọc văn bản / Từ vựng & ôn tập), not by what a teacher wants to do.
- Slides, Anki, quiz and practice sheet already live inside Soạn bài, but the home page and menu send teachers to the stand-alone tools, so they paste the word list again.
- "Cách hoạt động" on the home page still says "Chọn công cụ" and lists old tools.
- 14 tools in the menu is a lot; some are thin or overlap with Đọc hiểu.

## 1. New groups (by intent)

| Group (vi / en) | Tools |
|---|---|
| **Soạn bài & ôn tập** / Prepare & review | Soạn bài (first, highlighted), Tạo thẻ Anki, Trắc nghiệm, Phiếu tập viết |
| **Dạy chữ Hán** / Teach characters | Thứ tự nét, Chiết tự, 214 bộ thủ, Lộ trình 1000 chữ |
| **Tra & đọc** / Look up & read | Tra từ, Đọc hiểu, Truyện đọc, Pinyin |

`TOOL_GROUPS` in `lib/links.ts` changes; Navbar menu, Footer and Features read it, so all three follow.

## 2. Hide (out of menu, home page and footer; the page and its URL keep working)

| Tool | Why |
|---|---|
| Ngắt từ (`/tools/segment`) | Đọc hiểu already shows word breaks and a word table; alone it is a developer tool, not a teacher need. |
| Hán Việt (`/tools/hanviet`) | Đọc hiểu (tap a word), Tra từ and the Soạn bài word table already give Hán Việt. |
| Sắp xếp câu N+1 (`/tools/comprehensible-input`) | Niche, the name means nothing to most teachers, and no teacher flow uses it. |

Kept although close to Đọc hiểu: **Pinyin**, because teachers print a text with Pinyin on top for handouts.
Hidden = removed from `TOOL_GROUPS` only (a `HIDDEN_TOOLS` list), so old links, search results and cross-links between tools do not break. 14 → 11 tools; `{count}` updates itself.

## 3. "Bạn muốn làm gì?" (replaces "Cách hoạt động" on the home page)

A grid of need cards, each "Tôi muốn … → where to click", with a 1-line path:

| Tôi muốn… | Opens | Path shown |
|---|---|---|
| Soạn cả một buổi học | `/lesson` | Dán giáo án → lấy bảng từ, slide, Anki, đề, phiếu |
| Làm slide PowerPoint | `/lesson#tab=slides` | Dán bài → thẻ Slide → Tải slide |
| Cho học viên ôn từ bằng Anki | `/lesson#tab=anki` | Dán từ → thẻ Thẻ Anki → gửi file .apkg |
| Ra đề trắc nghiệm | `/lesson#tab=quiz` | Dán từ → thẻ Trắc nghiệm → in đề + đáp án |
| In phiếu tập viết | `/lesson#tab=practiceSheet` (or `/tools/practice-sheet` for a few characters) | Dán chữ → In / lưu PDF |
| Dạy một chữ trên lớp | `/tools/stroke-order` | Xem nét, chiết tự, bộ thủ |
| Tra một từ | `/tools/lookup` | Nghĩa, Hán Việt, câu ví dụ |
| Tìm bài đọc theo cấp HSK | `/tools/stories` | Truyện ngắn có dịch, mở trong Đọc hiểu |

Needed in code: Soạn bài opens the tab named in `#tab=` (hash, so nothing reaches the server; unknown values fall back to "Bảng từ").
The same list also goes at the top of the Navbar tool menu as "Tôi muốn…" (4 most common lines), above the groups.

## Same PR (owner rule: big feature updates the home page)

Features groups, Hero/ForTeachers lines that name tools, FAQ answers that mention hidden tools, `vi.ts` + `en.ts`, `userguide/README.md` index, `/guide` unchanged. Screenshots in `docs/screenshots/tool-groups/` (light, dark, phone). Tests: `lib/i18n/i18n.test.ts` + a small test for the `#tab=` parser; `pnpm run lint` and `pnpm run build`.
