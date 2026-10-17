# HSK 3.0 level and Vietnamese meaning (vocab_hsk_vi.csv) in Anki and the quiz

## Context

The owner added `assets/dictionary/vocab_hsk_vi.csv`: 10,925 rows of `level, hanzi, pinyin, meaning` (HSK 3.0 levels
1–6 and "7-9", Vietnamese meanings). Today the only meanings are CC-CEDICT **English** (`public/data/meanings.json`).
The owner wants:
- **Anki**: two new fields, the HSK level and the Vietnamese meaning.
- **Trắc nghiệm**: use the Vietnamese meaning.

Decisions (asked): only Anki and the quiz change. The level is written "HSK 1" … "HSK 7-9". Credit: "Hán Ngữ Studio,
theo danh sách từ vựng HSK 3.0".

Data facts that shape the design:
- 129 words appear more than once, for different levels or senses (多 1 "nhiều" / 2 "bao nhiêu"), or different
  readings (好 hǎo 1 "tốt", hǎo 2 "rất", hào 4 "thích, ưa"; 干 gān / gàn).
- 44 words have an optional 儿, written `好玩{儿}`.
- No empty meanings. All levels are in {1, 2, 3, 4, 5, 6, 7-9}.

## 1. Data build (`scripts/build-data.mjs` → `public/data/vocab.json`)

- `buildVocab()`: read the CSV with the existing `readCsv` (it handles BOM and quoted fields). Output
  `{ word: [[level, pinyin, meaning], …] }` with entries in file order (lowest level first).
- `{儿}`: a key for the plain form (`好玩`) and for the 儿 form (`好玩儿`), each added only when no row already has
  that exact word (an exact row always wins).
- Throw on an unknown level or an empty hanzi or meaning. Log the size; expect about 0.6 MB, under the 1.5 MB per-file
  rule. Commit the output.

## 2. Lookup (`lib/vocab/`)

- `load.ts`: `loadVocab()`, memoised like `loadMeanings` (`lib/anki/load.ts`).
- `lookup.ts`: `vocabFor(data, word, pinyin?) → { level: string; meaning: string } | null`.
  - Entries for the word. If `pinyin` is given, keep the entries whose Pinyin matches it after normalising: NFC,
    lower case, no spaces or apostrophes, and erhua `wánr` treated the same as `wán er`. If none match, keep all entries
    (no guessing which reading was meant, but the data is still shown).
  - `level`: the lowest level among the kept entries ("HSK 1"; "7-9" sorts last).
  - `meaning`: distinct meanings in file order, joined with "; " (老 "già" listed twice → once).
- Tests `lib/vocab/vocab.test.ts`, against the real `public/data/vocab.json`:
  - 好 with hǎo → "HSK 1", "tốt; rất". With hào → "HSK 4", "thích, ưa (…)".
  - 好玩 and 好玩儿 both found.
  - A word not in the list → null.
  - 7-9 counts as the highest level.

## 3. Anki (`lib/anki/buildDeck.ts`, `app/tools/anki/page.tsx`)

- `COLUMNS` gets `hsk_level` and `meaning_vi` **at the end**, so note types built for the current 8 columns still line
  up (the comment there already says column order matters). They are ticked by default like the other columns.
- `DeckData` gets `vocab`. `buildRow` sets
  `hsk_level` / `meaning_vi = vocabFor(data.vocab, word, row.pinyin)` (the row's own Pinyin, so 好 gets hǎo's level and
  meanings), or "" when the word is not in the list.
- `missing()` adds `vocab`: words not in the list. The page shows "Chưa có trong danh sách HSK: …" in the existing
  "Không tìm thấy" box.
- `lib/i18n/vi.ts`: `anki.columns.hsk_level` "Cấp HSK", `meaning_vi` "Nghĩa tiếng Việt", `missingVocab`. Credits add
  "Cấp HSK và nghĩa tiếng Việt: Hán Ngữ Studio (danh sách từ vựng HSK 3.0)". The `meaning_vi` input is wide (`WIDE`).
- Tests (`lib/anki/anki.test.ts`): update the `COLUMNS` assertion. 大学 and 好 rows get the expected level and
  meaning. A word outside the list gets empty fields and appears in `missing().vocab`. The golden test is unaffected
  (it checks fields one by one).

## 4. Quiz (`lib/quiz/build.ts`, `app/tools/quiz/page.tsx`)

- `QuizData` gets `vocab`. Meaning priority in `describe()`: the user's Tab meaning, then the HSK Vietnamese meaning
  (`vocabFor(…, pinyin)`, shortened with the existing `shortMeaning`), then CC-CEDICT English.
- Replace the `userMeaning` flag with `lang: "vi" | "en"` (user and HSK = "vi", CC-CEDICT = "en"). Wrong options for
  Chữ Hán → Nghĩa come only from the same language, so English never gives the answer away among Vietnamese options.
- Fallback pool: the first 300 HSK words (lowest levels) **plus** the current 300 most frequent CC-CEDICT words,
  deduplicated, so both languages have enough wrong options.
- Text: `quiz.meaningNote` → "Nghĩa mặc định là tiếng Việt theo danh sách từ vựng HSK 3.0; từ không có trong danh sách
  dùng nghĩa tiếng Anh (CC-CEDICT). Muốn dùng nghĩa riêng, ghi sau dấu Tab…". Credits add the HSK list.
- Tests (`lib/quiz/build.test.ts`): right answers now expect the Vietnamese meaning (朋友 → its HSK meaning). Same-
  language wrong options. The "cross-reference only" skip test moves to a word that is not in the HSK list (行 now
  has a Vietnamese meaning). A user Tab meaning still wins.

## 5. Docs

- `userguide/anki.md`: the two new columns in the column table (example 大学), the note-type tip lists 10 fields, and a
  note that a note type with only 8 fields should untick the two new columns (or get two more fields). Add a "Lỗi thường
  gặp" row for that and a data-source line.
- `userguide/quiz.md`: Vietnamese meanings by default (example table: 大学 → đại học), the English fallback, data source.
- `CLAUDE.md` data sources: the HSK list (source file, build output, credit). The Anki tools-table row mentions HSK level
  and Vietnamese meaning.

## Verification

- `pnpm build:data`: only `vocab.json` is new; the other data files are unchanged (`git status public/data`).
- `pnpm test`, `pnpm run lint`, `pnpm run build`.
- Browser (Playwright in the scratchpad):
  - /tools/anki with 大学, 好, 好玩儿 and one non-HSK word: the preview shows the "Cấp HSK" and "Nghĩa tiếng Việt"
    columns, the downloaded TSV has 10 columns, and the non-HSK word is listed under "Chưa có trong danh sách HSK".
  - /tools/quiz with the sample: Chữ Hán → Nghĩa options are Vietnamese.
  - No external requests.
- Commit on main: `feat(vocab): HSK 3.0 level and Vietnamese meaning in Anki and the quiz`. Ask before pushing.
