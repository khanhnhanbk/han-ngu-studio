# Phase 2: Hán Việt tool, `/tools/hanviet` (done)

**Depends on:** Phase 0 (tokenizer) and Phase 1 (whole-line Pinyin).

## Context

Vietnamese learners remember Chinese words faster through their Sino-Vietnamese (Hán Việt) reading. `hanviet.py` segments a sentence, looks up each character's reading by `(char, pinyin)`, and outputs the segmented text, Pinyin and Hán Việt.

Source: `assets/dictionary/char_hanviet.csv` (11.2k rows: `simp_char,trad_char,hanviet,pinyin,frequency`).

## What was built

- **`scripts/build-data.mjs`** (`pnpm build:data`):
  - A hand-written CSV parser.
  - Python list literals are parsed with JSON, never `eval`.
  - Output: `public/data/hanviet.json` (268 KB, 10,180 characters), shaped as `{char: [[tone3, readings], …]}`. Entries are kept in an array so the lookup's last fallback sees them in the same first-seen order as a Python dict.
- **`lib/hanviet/lookup.ts`**:
  - `toTone3` converts pinyin-pro numbers to the data's format (`0→5`, `ü→u:`).
  - `lookupChar` tries, in order: the exact entry, then the `*` entry, then the first entry, then nothing.
  - `hanvietForWord` joins multiple readings with `/` and syllables with `_`; a character with no reading stays as is.
- **`lib/hanviet/sentence.ts`**:
  - `analyzeLine` / `analyzeText` port `process_sentence`. Pinyin comes from the whole line (Phase 1), so the lookup uses the reading the sentence actually needs (了 → le5).
  - `allReadings` feeds the details panel.
  - `toTsv` writes `hanviet.py`'s four columns, with a header row.
- **`app/tools/hanviet/page.tsx`**: three views.
  - **Theo từ** (by word): word cards; clicking one opens a details panel listing every reading per character.
  - **Văn bản** (text): three rows per sentence.
  - **Bảng TSV** (TSV table).
- **Shared**: i18n `hanviet.*`, a Navbar entry, and the user guide page `userguide/hanviet.md`.

## Owner decisions (deliberate differences from hanviet.py)

1. **Duplicate `(char, pinyin)` rows are merged.** There are 227 such pairs, one row per traditional variant. Their readings are combined in row order without repeats. Python let the later row overwrite, which dropped the common reading in 16 cases. Example: `当 dang1` gave "đang" (the reading of 噹); it now gives "đương/đang".
2. **Simplified characters only**, as in Python. `trad_char` is not indexed.

These follow from the pinyin source rather than an owner decision: pypinyin wrote `lv4` and a bare neutral tone (`de`), which never matched the data's `lu:4` / `de5`, so Python fell back to the first entry. Our normaliser matches exactly. For example, 女 now gives nữ instead of nhữ.

## Tests

- `lib/hanviet/__golden__/lookup.json`: 410 cases from Python's `get_hanviet_for_word`, with fixed pinyin input and duplicate rows merged. They cover the exact match, `*`, the first-entry fallback, a missing character and the merged 当.
- Curated end-to-end cases: context (银行 / 行走), ü, punctuation, empty lines, the details panel and the TSV output.
