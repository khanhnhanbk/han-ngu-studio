# Ideas from Học Tiếng Trung 123: quiz generator + radical reference

## Context

The owner asked what https://hoctiengtrung-123.pages.dev/ ("Học Tiếng Trung 123") does and which of
its features we could adopt. It is a Vite/React SPA for Vietnamese learners. It has accounts
(Supabase/Firebase), XP, a leaderboard, community chat, and AI stories and translation (Gemini, Google
Translate). It also has a Pinyin chart, the 214 radicals, flashcards with SRS, ~60 grammar notes, HSK
mock exams, and many quiz modes, including **"Đoán âm Hán Việt"**. Most of the account, AI and news
features break our hard rules (no backend, user text never sent anywhere).

The owner chose two features to build: **a quiz generator** and **a radical reference**.
**We take ideas only.** No code, text or data comes from that site (it has no licence). Everything
below uses our own data or permissively licensed sources.

Delivered as three PRs (≤1000 changed lines each, per the roadmap rule). Add them to
`docs/plans/2026-10-15-roadmap.md` as phases 7a, 7b and 8, and to the landing `Roadmap` section.
Each moves to `TOOLS` (`lib/links.ts`) once it ships. Save the split plans as
`docs/plans/2026-10-17-phase-7-quiz.md` and `docs/plans/2026-10-17-phase-8-radicals.md`.

---

## Phase 7a: `/tools/quiz`, multiple-choice quiz (play in browser)

**Input**: textarea, one word per line, optionally `word<TAB>meaning`. A user-supplied meaning wins
over CC-CEDICT. This matters because `meanings.json` is **English** only and there is no word-level
Vietnamese meaning. The UI must say so ("Nghĩa mặc định là tiếng Anh (CC-CEDICT); thêm nghĩa tiếng
Việt sau dấu Tab"). Reuse `parseWords` (`lib/anki/buildDeck.ts:34`), extended for the tab column.

**Question types** (checkboxes):
- Hán → Nghĩa, Nghĩa → Hán
- Hán → Pinyin. Distractors include the **same syllables with other tones** (e.g. mǎ / mà / má),
  then other words' Pinyin.
- Hán → Hán Việt. Distractors come from other words' readings.

**Logic** in `lib/quiz/` (pure, no React):
- `types.ts`: `Question { kind, prompt, options: string[], answer: number, word }`
- `build.ts`: `buildQuiz(data, entries, kinds, rng)`. It returns `{ questions, skipped }`. A word
  with no meaning, Pinyin or reading for a kind is skipped and reported, never guessed.
- `rng.ts`: seeded PRNG (mulberry32) so shuffles are reproducible in tests. A "Trộn lại" button
  re-seeds.
- Distractors: draw from the user's own words first. When fewer than 3 are left, fill from
  frequency-ordered words in `meanings.json` / `hanviet.json`. Never use a distractor equal to the
  answer (compare after normalising).
- Reuse: `convertLine` (`lib/pinyin/convert`), `lookupChar` + `toTone3`
  (`lib/hanviet/lookup`). **Export `hanvietLine` from `lib/anki/buildDeck.ts:51`**; do not copy it.
  Loaders: `loadMeanings` (`lib/anki/load.ts`), `loadHanviet` (`lib/hanviet/load.ts`), and the
  tokenizer the anki page already loads (`lib/segment`).

**UI** in `app/tools/quiz/page.tsx` (`"use client"`), plus `components/quiz/QuestionCard.tsx`:
- One question at a time. Clicking an option shows right or wrong at once, with the correct answer
  highlighted. A progress bar; at the end the score and a list of wrong answers with a "Làm lại câu
  sai" button.
- All strings in `lib/i18n/vi.ts`. Theme tokens only (`brand-*`, `ink-*`, `surface`).
- Nothing is stored. Optionally, the word list is kept in localStorage as a draft (try/catch).

**Tests**: `lib/quiz/build.test.ts`. Same seed gives the same quiz. The answer is always among the
options. Options are unique. Tone distractors keep the syllables. Missing data leads to `skipped`.

## Phase 7b: cloze, sentence ordering, print + TSV export

This closes the roadmap's "Cloze exercise generator: Not built".
- **Điền từ vào câu**: take the word's sentence from `sentences.json` (`index[word]` → row). Blank
  the **first** occurrence (match by `Array.from` code points). The options are other quiz words.
  Show the Vietnamese translation as a hint. Words without a sentence are skipped.
- **Sắp xếp câu**: segment the sentence with the tokenizer, shuffle the tokens (seeded), and the
  user taps them in order. The answer is correct when the joined tokens equal the original sentence
  (punctuation stays fixed at the end).
- **Export**:
  - "In đề / Lưu PDF": a print layout with numbered questions, then an answer key on a new page. Use
    `window.print()` and `@media print` the same way `app/tools/practice-sheet/page.tsx` does.
  - "Tải TSV": columns `type, question, A, B, C, D, answer`, for Quizizz/Kahoot-style import. Reuse
    `lib/download.ts`.
- Tests: cloze blanks only one occurrence and handles non-BMP characters. Ordering check. TSV
  escaping (tabs and newlines in fields).

Docs (both phases): `userguide/quiz.md` (step by step, exact `vi.ts` labels, "Lỗi thường gặp")
and add it to `userguide/README.md`. Credit CC-CEDICT on the page.

---

## Phase 8: `/tools/radicals`, the 214 Kangxi radicals

**Data**:
- `assets/dictionary/radicals.tsv` (new, our own content). Columns: `no, radical, variants, strokes,
  hanviet_name, meaning_vi, pinyin`.
  - `radical`: the unified ideograph = NFKC of U+2F00–U+2FD5.
  - `strokes`: comes from the Kangxi numbering.
  - `hanviet_name`: look up `hanviet.json`. 23 radicals are traditional forms not in it (門, 馬,
    魚, 龍…), so look them up via `trad_char` → `simp_char` in `char_hanviet.csv`.
  - `pinyin`: from pinyin-pro.
  - `meaning_vi`: written by hand. **The owner must review it** (correctness rule).
  - A generator script fills every column it can and leaves `meaning_vi` for hand editing.
- Characters per radical: extract `kRSUnicode` from Unicode **Unihan** (Unicode License v3,
  permissive). Keep only characters in `char_hanviet.csv`, and commit the slim extract as
  `assets/dictionary/unihan_radicals.tsv` with `LICENSE-unicode.txt`.
- `scripts/build-data.mjs` writes `public/data/radicals.json`:
  `[{no, radical, variants, strokes, hv, vi, py, chars: [top 12 by frequency]}]`, ~60 KB.

**UI** in `app/tools/radicals/page.tsx`:
- A grid grouped by stroke count (1–17). Search by character, Hán Việt name (accent-insensitive)
  or meaning.
- Click a radical for details: variants (氵 for 水, 扌 for 手…), name, meaning, Pinyin, and example
  characters with their Hán Việt reading.
- Each character links to `/tools/stroke-order#c=<char>` (hash, never the query string, per
  CLAUDE.md).
- "Tạo vở luyện viết" sends the selected radicals to the practice sheet via the existing
  `#chars=…` hash.

**Tests**:
- `lib/radicals/radicals.test.ts`: 214 entries, numbers 1–214 in order, strokes never decrease, every
  `hv` non-empty, every `radical` equals the NFKC of its code point.
- Search normalises Vietnamese diacritics.

Docs: `userguide/radicals.md` and the README index. Credit Unihan and Make Me a Hanzi (stroke order)
on the page.

---

## Verification (every phase)

- `pnpm test`, `pnpm run lint`, `pnpm run build`, all passing.
- Manual check with `pnpm run dev`:
  - Quiz: paste ~10 HSK1 words, run all question types, get some wrong and use "Làm lại câu sai".
    Check the print preview and open the TSV.
  - Radicals: search "thủy" and find 水 with variant 氵; the stroke-order link opens with the right
    character.
- DevTools Network: only `/data/*.json` requests, nothing external.
- Check light and dark mode and a second accent (ThemePicker), at mobile width.
- Update the landing page: Roadmap → Features once shipped.
