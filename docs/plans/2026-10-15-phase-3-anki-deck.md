# Phase 3: Anki deck generator, `/tools/anki` (~900 LOC)

**Depends on:** Phase 0 (tokenizer) and Phase 2 (Hán Việt lookup, `build-data.mjs`).

## Context

Teachers and learners make Anki cards from word lists. `anki_desk.py` produced, for each word:
- Pinyin
- meaning
- an example sentence, with its Pinyin and translation
- Wubi
- Hán Việt

The output was a TSV. This phase brings that tool to the browser.

Source data:
- `assets/dictionary/chinese_dict.csv` (10k rows: `Simplified,Traditional,W/million,Definitions,Pinyin`)
- `assets/dictionary/sentences.tsv` (4.6k rows: `idx,Hanzi,NewWord,Pinyin,Vietnamese,English,Lenth`, where `NewWord` is a comma-separated list)

## Scope

- **Extend `build-data.mjs`** to write two files:
  - `public/data/dict.json`, shaped as `{word: {pinyin, meaning}}`. Simplified keys go in first, then Traditional, so later keys overwrite earlier ones, matching the `meaning_map.update` order.
  - `public/data/sentences.json`, mapping each `NewWord` token to the **first** row that contains it, as `{hanzi, pinyin, vi, en}`. Tokens are split with the `normalize_new_word_tokens` regex. Building this index at build time replaces Python's rows × words scan, with the same result.
  - If either file is over about 1.5 MB raw, shard it by first character.
- **`lib/anki/buildDeck.ts`**:
  - Input is one word per line; deduplicate while keeping order.
  - Columns:
    - `word`
    - `pinyin` (tone marks)
    - `meaning`
    - `sentence`
    - `sentence_pinyin`
    - `sentence_meaning`
    - `hanviet`
  - **Deliberate change**: the sentence meaning prefers **Vietnamese**, then English. Python preferred English; flag this in the PR.
  - There is no Wubi column, because there is no data for it.
  - Words with no meaning or sentence are collected in a "Không tìm thấy" list.
- **`app/tools/anki/page.tsx`**:
  - Textarea or `.txt` upload.
  - Preview table where cells can be edited.
  - Column picker.
  - TSV export with no header. An option adds the `#separator:tab` / `#html:true` header used by Anki 2.1.55+.
  - A short guide in Vietnamese on importing into Anki.
  - i18n strings and a Navbar entry.

## Tests

- Golden test against Python `batch_search_and_export` on about 30 words. The `meaning` and `sentence*` columns must match exactly. The `pinyin` and `hanviet` columns are excluded because they come from pinyin-pro.
- Unit tests:
  - deduplication
  - the not-found list
  - TSV escaping: a tab or newline inside a field must become a space or `<br>`

## Verification

- `npm test` and `npm run build` pass.
- Import the exported TSV into Anki desktop and check the fields map correctly.
- The data files load only on `/tools/anki`.

## Open questions

- Do you want Wubi? If so, a Wubi code table needs to be added to `assets/`.
