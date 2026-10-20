# Plan: suggested memory stories in Chiết tự — 2026-10-20

(Earlier plans in this file shipped: pronunciation button 41ee09e, Navbar 36c3095, .apkg export 4c1c628.)

## Context

Owner wants more help for learners: (1) a suggested memory story per character for people who don't want to write their own, (2) later, a reader of short modern stories that teach new words + culture (thành ngữ in modern use). This plan covers (1); (2) gets its own plan after.

Data check (done): of the suggested repos only Make Me a Hanzi is usable (already shipped). `lbm364dl/hanzi-etymology-dict` has mixed licences incl. data extracted from Dong Chinese; `Ran00w/JieZi` is CC BY-NC-ND; `peterolson/chinese-lexicon` has no licence; zdic / MOE dictionaries are websites (no scraping). So stories are **our own content**: drafted by Claude **offline, once**, reviewed by the owner, shown with a "gợi ý" label until reviewed (same idea as "dịch máy"). No AI call at runtime (Hard Rules 2, 4).

Scope: HSK 3.0 levels 1–3 = **899 characters** (all have decomposition data). Batch 1 = HSK 1 (300 chars), then HSK 2, HSK 3 (300 each).

## Content rules (what makes a story trustworthy)

- Built on the **real** parts from `decompose.json` (IDS split, semantic/phonetic roles) and Hán Việt, e.g. 休: "Người (亻 nhân) tựa vào cây (木 mộc) để nghỉ ngơi." For 形声 chars say it honestly: "氵 (nước) chỉ nghĩa, 青 (thanh) gợi âm qīng: nước trong xanh → 清 trong."
- A **memory trick, not a history claim**: the UI calls it "Mẹo nhớ"; the real origin stays in the existing "Cấu tạo" section (Make Me a Hanzi).
- Vietnamese, one or two sentences, ≤ 160 characters, every top-level part written as `char (Hán Việt / nghĩa)`.
- Characters too simple or opaque to split (一, 了…): a short shape/meaning hook or no story (field empty).

## Changes

1. **Source data** `assets/dictionary/mnemonics.tsv` (new, our own content): `char \t story \t status` (`draft` | `reviewed`). Claude writes HSK 1 now; owner reviews by editing the file and setting `reviewed`.
2. **Validator** `scripts/check-mnemonics.mjs` (+ run inside `pnpm build:data`): char exists in `decompose.json`, no duplicates, length ≤ 160, every top-level IDS part (from `splitOf`-equivalent logic) appears in the story, status valid. Fails the build on errors; prints a draft/reviewed count.
3. **Build** (`scripts/build-data.mjs`): → `public/data/mnemonics.json` `{ char: [story, reviewed 0|1] }` (~40 KB per 300 chars; lands in `sizes.json`).
4. **Loader** `lib/decompose/mnemonics.ts`: `MNEMONICS_FILE`, `loadMnemonics = memoJson(...)`; added to the decompose page's `confirmDownload` list. Phồn thể: look up via the Simplified char (`conv.toSimp`), as the page already does for Hán Việt.
5. **UI** `components/decompose/NotesBox.tsx` (Câu chuyện ghi nhớ card):
   - Above the textarea, a "**Mẹo nhớ gợi ý**" box with the story; badge "**gợi ý, chưa kiểm duyệt**" for drafts.
   - Button "**Dùng mẹo này**" copies it into the user's note (then they can edit; saved in localStorage as today). Shown collapsed ("Xem mẹo gợi ý") when the user already has their own note.
   - No suggestion → nothing shown (no empty box).
6. **i18n** `decompose` block in `vi.ts` + `en.ts`: `suggestion`, `suggestionDraft`, `useSuggestion`, `showSuggestion`. Story text itself stays Vietnamese on `/en` (tool data is not translated, as with Hán Việt).
7. **Docs/credits**: `userguide/decompose.md` (section on Mẹo nhớ gợi ý + Lỗi thường gặp), `CLAUDE.md` data sources line, `/giay-phep` + `THIRD-PARTY-NOTICES.md` note: "Mẹo nhớ: nội dung của Hán Ngữ Studio (soạn với trợ giúp AI, đang được kiểm duyệt)".
8. **Tests** `lib/decompose/mnemonics.test.ts`: validator rules on fixtures; built JSON has every HSK 1 char of the TSV; Phồn thể lookup (學 → 学 story).

## Verification

- `pnpm build:data` (validator passes, counts printed), `pnpm test`, `pnpm run lint`, `pnpm run build`.
- `pnpm run dev` → `/tools/decompose#c=休`: suggestion shows with draft badge; "Dùng mẹo này" fills the note; reload keeps it; with own note the suggestion is collapsed; 學 in Phồn thể shows the 学 story; a char without story shows no box. Dark mode.
- Owner spot-reads ~30 HSK 1 stories before we ship batch 2.

## Next (separate plan)

Story reader "Truyện": short modern stories per HSK level (gọi món, thuê nhà, đi tàu, WeChat Pay, thành ngữ dùng ngày nay), 5–8 new words + culture note each, opened in Đọc hiểu (colours, word card, → Anki). Same content process: Claude drafts, owner reviews.
