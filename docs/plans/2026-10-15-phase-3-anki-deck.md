# Phase 3: Anki deck generator, `/tools/anki` (done)

**Depends on:** Phase 0 (tokenizer), Phase 1 (Pinyin) and Phase 2 (Hán Việt).

## Context

A port of `anki_desk.py`: from a word list, produce a TSV with these columns, in this order:

`word, pinyin, meaning, sentence, sentence_pinyin, sentence_meaning, wubi, hanviet`

## What was built

- **`scripts/build-data.mjs`**:
  - The CSV parser now follows Python csv quoting: a quote only opens a quoted field at the start of the field.
  - **`meanings.json`** (818 KB, 15,357 keys).
  - **`sentences.json`** (547 KB): 3,327 rows, with a token → first-row index.
  - **`wubi.json`** (265 KB, 21,004 characters), from pywubi's table, copied to `assets/dictionary/wubi_86.json` with its MIT licence.
- **`lib/anki/`**:
  - `buildDeck.ts`: `parseWords`, `buildRow`, `missing`, `toTsv`.
  - `wubi.ts`: a port of pywubi's `wubi()`.
  - `load.ts`: memoised JSON loaders.
- **`app/tools/anki/page.tsx`**:
  - Input: word list or `.txt` (at most 1000 words, duplicates removed).
  - Column picker and optional Anki header lines (`#separator`, `#html`, `#columns`).
  - Editable preview table, with `.tsv` download and copy.
  - "Không tìm thấy" (not found) box, short import steps, and data credits.
- **`userguide/anki.md`**: the steps, plus Anki desktop and AnkiDroid import.

## Owner decisions (deliberate differences from anki_desk.py)

1. **Sentence Pinyin is generated** from the whole sentence (Phase 1). The sheet's Pinyin column had errors (`你呢？ → nǐ ní`).
2. **`sentence_meaning` prefers Vietnamese**, falling back to English.
3. **Wubi uses pywubi 0.3.0's own table** as static JSON. The npm `wubi-code` disagreed on 476 of 21,004 characters, including 窗 and 迎.
4. **Bug fixes**:
   - a traditional key never overwrites another word's simplified meaning (著 / 着, 夥 / 伙)
   - empty definitions are "not found" (pandas wrote `nan`)
   - duplicate input words are removed

## Tests

`lib/anki/__golden__/deck.json` has 311 words from the Python logic and pywubi:
- `meaning`, `sentence` and `sentence_meaning` must match exactly
- `wubi` must match exactly

There are also curated checks for the Pinyin and Hán Việt formats, the TSV escaping, the header, the column order, `parseWords` and the "not found" lists.

## Data fixes in `sentences.tsv` (2026-10-15)

- **6 AI-refusal rows rewritten** as real example sentences, keeping their `NewWord`. These were idx 1393 表达, 2267 同义, 2323 替换, 2324 用于, 2572 改为/职 and 2611 例/混合/用来. For example, `用于` had `上帝这个词这里不适合用于正式工作表达已替换。` and now has `这笔钱用于买书。`.
- **Rows idx 10001–12008 (2,008 rows)** have Hán Việt output in the Vietnamese column (`thông_quá lệ cú …`), not a translation. `build-data.mjs` treats such cells as empty (regex `\S_\S|\s。$`), so `sentence_meaning` falls back to English. 1,328 of 3,793 words with an example are affected.
- **Still open:** translating those 2,008 rows into Vietnamese. Once real translations are in the column, the build uses them automatically.
- **The Google Sheet is the original source.** Copy these fixes back to it, or treat `assets/dictionary/sentences.tsv` as the source of truth from now on.
