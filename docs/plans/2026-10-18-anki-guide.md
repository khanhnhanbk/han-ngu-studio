# Anki guide page with card templates (and park the .apkg work on a branch)

## Context

The owner wants the `.apkg` export (commit `00e0b5f`, local only) off main for now. First they want a page that teaches how to use the **current** TSV export with Anki, and that suggests ready-made card templates.

Today the only help is a short import box on `/tools/anki` and `userguide/anki.md`. The guide says "create a note type with 10 fields, then edit Cards as you like", with no templates. Learners who don't know Anki get stuck at the note-type step.

**Owner's decisions:**
- New page at **`/tools/anki/huong-dan`**.
- Four templates: **Nhận diện** (Hán → nghĩa), **Nhớ chữ** (nghĩa → Hán), **Câu ví dụ** (đọc hiểu câu), **Gõ chữ** (type the word).
- The `.apkg` commit moves to branch `feature/anki-apkg`, which is pushed; main goes back to `fec9ce4`.

## 0. Move the .apkg work to a branch (first)

1. `git branch feature/anki-apkg 00e0b5f`
2. `git push -u origin feature/anki-apkg`. Vercel builds only a preview; production stays on main.
3. On main (clean tree): `git reset --hard fec9ce4`. This drops the local-only commit from main; it stays on the branch.
4. Check: `git log --oneline -1 main` shows `fec9ce4`, and `public/vendor/` and `lib/anki/apkg.ts` are gone from main.

All new work below happens on main.

## 1. Template data and renderer: `lib/anki/templates.ts` (pure, tested)

- Field names are exactly the TSV column names from `COLUMNS` in `lib/anki/buildDeck.ts` (`word, pinyin, meaning, sentence, sentence_pinyin, sentence_meaning, wubi, hanviet, hsk_level, meaning_vi`). Because the TSV header (`#columns:`) uses the same names, Anki 2.1.55+ maps the columns to the fields automatically.
- `NOTE_TYPE_FIELDS = COLUMNS` and a shared `CARD_CSS`, which uses Kai fonts for Chinese, a night-mode variant, and the pinyin colour.
- `CARD_TEMPLATES`: `{ id, name, purpose, front, back }` for the four card types:

| id | Front | Back |
|---|---|---|
| `recognize` (Nhận diện) | `{{word}}` | `{{FrontSide}}`, Pinyin, Hán Việt, `meaning_vi` (fallback `meaning` via `{{^meaning_vi}}`), English meaning, sentence + its Pinyin + meaning, HSK · Wubi |
| `recall` (Nhớ chữ) | `meaning_vi` (fallback `meaning`), Hán Việt as a hint | `word` big, then Pinyin and the sentence |
| `sentence` (Câu ví dụ) | `{{sentence}}` (no card when the word has no sentence) | sentence Pinyin + meaning, then the word with Pinyin and meaning |
| `type` (Gõ chữ) | meaning (+ Pinyin hint) and `{{type:word}}` | `{{type:word}}` (Anki's comparison), Pinyin, Hán Việt, sentence |

- `renderTemplate(tpl, fields, side, frontHtml?)` is a small Anki-syntax renderer for the preview only. It supports:
  - `{{field}}` (HTML-escaped, except `<br>` between examples)
  - `{{#f}}…{{/f}}` and `{{^f}}…{{/f}}`
  - `{{FrontSide}}`
  - `{{type:f}}`: an input box on the front; on the back, the correct answer styled like Anki's.
- `SAMPLE_ROW`: one real row from the current tool (学习, 2 example sentences joined by `<br>`), stored as a constant so the page needs no data download.

## 2. Page: `app/tools/anki/huong-dan/page.tsx`

The page is a server component, so it gets `metadata` with a title and description. Interactive parts are small client components in `components/anki-guide/`. All text goes in `lib/i18n/vi.ts` under `ankiGuide`. Sections:

1. **Anki là gì**: one paragraph on spaced repetition, plus install links. Anki desktop and AnkiDroid are free; AnkiMobile (iPhone) is paid. AnkiWeb sync is mentioned without invented numbers.
2. **Bước 1: Tạo loại ghi chú "Hán Ngữ Studio"**:
   - Tools → Manage Note Types → Add → "Add: Basic" → name it.
   - Fields: create the 10 fields in order, with a **Sao chép danh sách trường** button.
3. **Bước 2: Dán mẫu thẻ**:
   - Cards → paste Front, Back and Styling.
   - Options → Add Card Type for each extra template.
   - Note that each card type adds one card per word, so pick only the ones you want.
4. **Bước 3: Import file TSV**: Tải .tsv on `/tools/anki`, then File → Import. Steps for the import dialog: Tab separator, note type "Hán Ngữ Studio", deck, fields mapped automatically from the header. Also the AnkiDroid route, and syncing via AnkiWeb.
5. **Mẫu thẻ gợi ý**, a gallery of the four templates. Each card (`components/anki-guide/TemplateCard.tsx`) shows:
   - its name and purpose;
   - a live preview (front/back toggle, light/night toggle) rendered into a sandboxed `<iframe srcDoc>` (no scripts), so the card CSS can't leak into the site;
   - three code blocks (Mặt trước / Mặt sau / Kiểu dáng (CSS)), each with a copy button, reusing the copy pattern of `/tools/anki` (`CopyIcon`/`CheckIcon`, `IconButton`).
6. **Mẹo học**: new cards per day, deleting card types you don't want, and that typing Chinese on the Gõ chữ card needs a Chinese keyboard.
7. **Lỗi thường gặp**:
   - columns don't map (old Anki: map by hand, or untick the header)
   - "first field matches" on re-import (choose to update)
   - a blank Câu ví dụ card is never created for words without sentences
   - fonts look different (Kai font not installed: falls back to a system font)

Styling uses theme tokens only (`bg-surface`, `ink-*`, `brand-*`) and must be checked in dark mode and at phone width.

## 3. Links

- `/tools/anki` (`app/tools/anki/page.tsx`): in the "Cách import vào Anki" box, replace `importMore` with a link **Hướng dẫn dùng với Anki và mẫu thẻ →** to `/tools/anki/huong-dan`.
- `userguide/anki.md`: link to the page from the import section and the note-type tip.
- `userguide/README.md` keeps its tool row; add "(xem thêm: hướng dẫn Anki trên trang web)".
- CLAUDE.md Tools table: note the guide route.
- No Navbar change: the page belongs to the Anki tool.

## 4. Tests (`lib/anki/templates.test.ts`)

- Every `{{…}}` field in every template is a `NOTE_TYPE_FIELDS` name, `FrontSide`, or `type:`/`#`/`^`/`/` of one.
- The renderer:
  - escapes field HTML and keeps `<br>` between examples;
  - drops `{{#f}}` sections for empty fields and shows `{{^f}}` fallbacks;
  - puts the front inside `{{FrontSide}}`;
  - renders `{{type:word}}` as an input on the front and as the answer on the back.
- Rendering each template with `SAMPLE_ROW`: the front contains 学习 (recognize) or the Vietnamese meaning (recall/type). The sentence template with an empty sentence renders an empty front, which matches Anki not generating that card.

## Verification

1. `pnpm test`, `pnpm run lint`, `pnpm run build`.
2. Browser (production build, Playwright):
   - `/tools/anki/huong-dan` renders all four previews.
   - The front/back and light/night toggles work, and the copy buttons copy the exact template text.
   - Light and dark mode, and 390 px width with no horizontal page scroll.
   - The link from `/tools/anki` works.
3. Real Anki check with the official `anki` Python package (scratchpad venv):
   - Create the note type from `NOTE_TYPE_FIELDS` + `CARD_TEMPLATES` + `CARD_CSS`.
   - Import a TSV downloaded from `/tools/anki` (with the header line) and confirm the fields map by name.
   - Render each card type's question and answer for 学习 without template errors, and check that a word with no sentence gets no Câu ví dụ card.
4. Save this plan as `docs/plans/2026-10-18-anki-guide.md`, commit on main, and push (main deploys to production). Confirm the Vercel deployment succeeds.
