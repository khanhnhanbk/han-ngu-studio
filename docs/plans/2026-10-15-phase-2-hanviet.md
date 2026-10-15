# Phase 2: Hán Việt tool, `/tools/hanviet` (~700 LOC)

**Depends on:** Phase 0 (browser tokenizer).

## Context

Vietnamese learners remember Chinese words faster through their Sino-Vietnamese (Hán Việt) reading. `hanviet.py` segments a sentence, then looks up each character's reading by `(char, pinyin)`, and outputs the segmented text, the Pinyin and the Hán Việt.

Source data: `assets/dictionary/char_hanviet.csv`, 11.2k rows. Its columns are `simp_char,trad_char,hanviet,pinyin,frequency`:
- `hanviet` is a Python list literal such as `['đích']`.
- `pinyin` is TONE3 (`di4`, `de5`, `nu:3`) or `*`, meaning any reading.

## Scope

- **`scripts/build-data.mjs`** (new; later phases extend it): a Node script, run by hand, whose output is committed.
  - A small CSV parser that handles quoted fields; no new dependency.
  - Writes `public/data/hanviet.json`, shaped as `{char: {tone3: [readings]}}`, the same shape as `prepare_hanviet_json_str` in `helper.py`.
  - Parse the list literal safely; never `eval`.
  - Skip rows with an empty `hanviet`, as Python does.
  - When a `(char, pinyin)` pair appears twice, the later row wins (dict semantics).
  - Add an `npm run build:data` script.
- **`lib/hanviet/tone3.ts`**: converts pinyin-pro `num` output to the data's format, `0→5` and `ü→u:`.
- **`lib/hanviet/lookup.ts`**: a port of `get_hanviet_for_word`, which tries in order:
  1. the exact `(char, tone3)` reading
  2. the `*` reading
  3. the char's first entry, in insertion order (Python dict order)
  4. the character itself

  Multiple readings are joined with `/`, and syllables with `_`.
- **`lib/hanviet/sentence.ts`**: a port of `process_sentence`. It returns segmented text, Pinyin (tone marks) and Hán Việt, with punctuation passed through.
- **`app/tools/hanviet/page.tsx`**: input text, with three aligned outputs. Clicking a word shows all of its readings. TSV export, with the same columns as `sentences_analyzed.tsv`. Add i18n strings and a Navbar entry.

## Tests

- **Exact golden for the lookup**: generate from Python `get_hanviet_for_word`, with a fixed pinyin input, so the comparison is independent of pinyin-pro.
- **Curated end-to-end cases**: 中国 → trung_quốc, 的 in context, 女, and characters missing from the data.

## Verification

- `npm test` and `npm run build` pass.
- `hanviet.json` is under about 300 KB and is fetched only on `/tools/hanviet`.
- Spot-check about 20 common words by hand.

## Open questions

- Does `char_hanviet.csv` go into git (`assets/`)? Recommendation: yes, so the data can be rebuilt.
