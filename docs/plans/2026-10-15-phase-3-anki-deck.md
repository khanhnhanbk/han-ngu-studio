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

## Known data issue (owner to fix in the sheet)

About 6 rows in `sentences.tsv` are AI refusals, not real example sentences. For example, `用于` gets `上帝这个词这里不适合用于正式工作表达已替换。` ("the word God isn't suitable here…").

Affected words include 用于, 同义, 替换, 改为, 混合, 用来 and 例. Fix the rows in `sentences.tsv`, then run `pnpm build:data`.
