# Phase 1: Pinyin tool, `/tools/pinyin` (done)

**Depends on:** Phase 0 (browser tokenizer).

## Context

Learners want Pinyin for a single character, a sentence or a whole paragraph. The old `pinyin_coverter.py` segmented the text first, then ran pypinyin on each word. The site already uses `pinyin-pro` (pinned at `3.26.0`).

## Design decision: whole-line context

Running pinyin-pro on each segmented word in isolation loses context. A lone `了` becomes `liǎo`, while `他长大了` as a whole gives `le`.

So `lib/pinyin/convert.ts` runs pinyin-pro on the **whole line** (`type: "all"`, one entry per code point), and uses our tokenizer **only to group syllables into words**. This deliberately departs from a faithful port, because CLAUDE.md rule 3 puts correctness first.

## What was built

- **`lib/pinyin/convert.ts`**: `convertLine`, `convertText`, `toTsv`.
  - Tone styles: mark, number (neutral tone `5`, as in CC-CEDICT), none. ü is kept in every style.
  - Spacing: word (with an apostrophe before a/o/e syllables, as in `xī'ān`) or syllable.
  - Non-Han text passes through. Full-width punctuation becomes ASCII, followed by a space, and `……` becomes `…`.
- **`app/tools/pinyin/page.tsx`**:
  - Input: textarea or `.txt` upload, 5000 code points maximum.
  - Changing an option re-renders the result immediately.
  - Three views: Chỉ Pinyin (Pinyin only), Pinyin trên chữ (Pinyin above characters, using `<ruby>`), and Bảng TSV (TSV table).
- **`lib/download.ts`**: a shared download helper, also used by the segment page.
- **Shared**: i18n strings (`pinyin.*`, `nav.pinyin`) and a Navbar entry.
- **`userguide/`**: a Vietnamese user guide for all live tools.

## Tests

`lib/pinyin/convert.test.ts`: curated cases (pinyin-pro output checked by hand) covering:
- polyphones
- ü
- every tone style and spacing combination
- apostrophes
- Latin text, digits and punctuation
- astral characters
- multiline input with CRLF
- the ruby segments
- the TSV output

## Known limitations (documented in `userguide/pinyin.md`)

pinyin-pro gives:
- `还书` as `hái shū`; it should be `huán`
- `东西` as `dōngxī`; it should be `dōngxi`

It also applies the 一 and 不 tone changes (一起 → `yìqǐ`).
