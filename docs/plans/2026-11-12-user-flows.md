# User flows: from a toolbox to teacher and self-study flows — 2026-11-12

Owner request (2026-11-12): "refactor Hán Ngữ Studio following how humans use it". Today the site is 14 separate tools; a teacher preparing one lesson pastes the same word list into 4–5 pages, and a learner has nowhere called "my study today". Research, flows and the owner's decisions are in the Claude Doc https://claude.ai/artifact/WjfWZSdxsbRTLy44qdUxY5 (copy in the owner's project folder: `cong-viec/san-pham/han-ngu-studio/2026-11-12-nghien-cuu-luong-giao-vien-hoc-vien.md`).

## Owner decisions (2026-11-12)

| Time (UTC+7) | Decision |
|---|---|
| 07:54 | Keep HARD RULE 2: no backend, no database. |
| 07:55 | A "send the lesson as a Zalo link" flow is optional. First priority: teachers take the lesson **out of the site** (copy, PDF, slides, images). |
| 07:56 | A "Save to Google" button (Docs / Sheets / Slides) is wanted. |
| 07:57 | Slides from the teacher's **own template**, with Anki-style `{{field}}` placeholders. |
| 08:00 | **Merge** the 14 tools into a few places. Keep the site **bilingual** (vi + `/en`). |
| 08:00 | Lessons may be kept in the teacher's own browser (exception to HARD RULE 4, written into CLAUDE.md). |
| 08:10 | Add a **self-study** flow (learner with no teacher). Plan first, then build step by step. |
| 08:27 | Quiz: only the first two question types ticked by default. |
| 08:31 | Routes all in English (`/lesson`, `/study`, `/tools/path`, `/tools/lookup`, `/licenses`); old Vietnamese routes redirect. |

## Three flows, one unit

The unit is a **lesson** (name + text + word list), not a tool. All flows make and use lessons; the existing tools become the parts that render a lesson.

### 1. Teacher: prepare a class in under 10 minutes

1. Soạn bài → new lesson → paste the textbook dialogue → "Lấy từ trong đoạn văn" → remove known words.
2. Take it out: word table (copy for Word/Docs, Sheets, Zalo, Quizlet; CSV; print/PDF), slides from their own template, PNG images, Anki deck, printed quiz with answer key, practice sheet.
3. In class (later): projector mode, 听写 (dictation) with the 4-part answer key (character, Pinyin, tone, meaning).
4. Optional (later): send the lesson as a link; students return a result code; class book.

### 2. Self-study: a learner with no teacher

Who: Vietnamese adults learning on their own (the owner is one: HSK 3 (3.0) + understanding Douyin videos), about 15–30 minutes a day, mostly on a phone.

1. **Start** (`/study`, first visit): pick a goal (HSK 1 / 2 / 3, or "1000 characters"), optionally a 5-minute level check (recognise words of each HSK level) that suggests where to start. Saved in this browser.
2. **Today** (the page they return to every day), in this order:
   - **Review** words that are due (spaced repetition in the browser, simple fixed intervals 1 → 3 → 7 → 14 → 30 days; Anki stays the option for people who already use it).
   - **New words**: 5–10 from the current stage of the goal (HSK list or the 1000-character path), each with Pinyin, Hán Việt (with a "Hán Việt trap" note when the modern meaning differs), audio, stroke order, memory story.
   - **Read**: one Truyện đọc story or text at their level (95 % known-word rule, already in Đọc hiểu).
   - **Write**: 3–5 characters with the stroke-order quiz or a printable sheet.
   - Shows "about N minutes", the streak and what is left.
3. **My own material**: a self-learner can make a lesson from anything they meet (a Douyin caption, a song) in the same Soạn bài, then "Add to my review".
4. **Progress**: words known per HSK level, days studied, review accuracy; export/import with the lessons backup. Reuses the existing local data: known words (`hns-reader-known`), path ticks (`hns-path-progress`).

### 3. Look up and read (anyone)

- **Tra chữ** (one word or character): Tra từ + Chiết tự + Thứ tự nét + 214 bộ thủ as tabs of one page.
- **Đọc** (a text): Đọc hiểu with display options (Pinyin above, Hán Việt, word breaks) replacing Chuyển Pinyin, Âm Hán Việt, Ngắt từ; Truyện đọc as its library.

## Navigation after the merge

Top menu: **Giáo viên** (Soạn bài) · **Tự học** (Hôm nay, Lộ trình) · **Tra chữ** · **Đọc** · ⚙. The landing page asks "Bạn là giáo viên hay đang tự học?". Old URLs (`/tools/anki`, `/tools/quiz`, …) keep working: the pages stay as stand-alone views or redirect, so shared links and search results never break.

## Steps (one PR each, ≤ about 1000 changed lines, screenshots in every PR)

| # | Step | Flow | Status |
|---|---|---|---|
| 1 | Soạn bài: lessons in the browser + JSON backup, word table exports (Word/Docs, Sheets, Zalo, Quizlet, CSV, print/PDF), Anki/Quiz/Practice sheet embedded | Teacher | PR #18 (route `/lesson`) |
| 2 | Slides from a .pptx template with `{{chu}} {{pinyin}} {{hanviet}} {{nghia}} {{vidu}} {{vidu_nghia}}` (filled in the browser with fflate; 2–3 built-in templates) + PNG word cards | Teacher | Slides done; PNG cards planned |
| 3 | Tự học part 1: `lib/srs/` (due dates in localStorage, tests), "Hôm nay" page with Review + New words from an HSK level / path stage | Self-study | Planned |
| 4 | Tự học part 2: goal + level check, Read and Write blocks, progress, "Add to my review" from a lesson | Self-study | Planned |
| 5 | Tra chữ: one page with tabs (lookup, breakdown, stroke order, radicals); old routes stay | Look up | Planned |
| 6 | Đọc: display options in Đọc hiểu replace Pinyin / Hán Việt / Ngắt từ; stories as its library | Read | Planned |
| 7 | New menu and landing (teacher / self-study), redirects, userguide index | All | Planned |
| 8 | "Save to Google" (Docs / Sheets / Slides via Google Identity Services, `drive.file` scope, Google Picker for a Slides template). Needs the owner's Google Cloud project and a HARD RULE 4 exception | Teacher | Waits for the owner |
| 9 | Optional: lesson link for students, result code, class book; projector + 听写 modes | Teacher | Later |

Small follow-ups noted while building step 1:
- "Lấy từ trong đoạn văn" also adds very easy words (你, 吗). Add "skip words of HSK level ≤ N" and "skip words I marked known".
- Inside Soạn bài the embedded tools restart when the word list changes (600 ms after typing stops).

## Validation

Before steps 3–4 ship, the owner uses Tự học for a week as a real learner. Before step 9, ask thầy Văn Loan the 8 questions in the Claude Doc.
