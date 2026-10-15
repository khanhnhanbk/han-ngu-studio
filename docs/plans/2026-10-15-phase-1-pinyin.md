# Phase 1: Pinyin tool, `/tools/pinyin` (~600 LOC)

**Depends on:** Phase 0 (browser tokenizer).

## Context

Learners want Pinyin for a single character, a sentence or a whole paragraph. The old `pinyin_coverter.py` segmented the text first, then ran pypinyin on each word, so polyphones were resolved per word. The site already uses `pinyin-pro` (`lib/practiceSheet.ts`), so this phase reuses it instead of porting pypinyin.

Because the two libraries choose readings differently, the expected outputs are **curated by hand** rather than dumped from Python.

## Scope

- **`lib/pinyin/convert.ts`**: pure logic.
  - Segment the text with `lib/segment`, then run `pinyin-pro` on each Han token.
  - Tone style: marks, numbers or none.
  - Spacing: per word (as in `pinyin_coverter.py`) or per syllable.
  - Non-Han tokens and punctuation pass through unchanged. Apply the punctuation-spacing rules from `pinyin_coverter.py`: no space before `，。！？、；：,.!?;:`, and one space after.
  - Keep line and paragraph breaks.
- **`app/tools/pinyin/page.tsx`**: the page.
  - Input: a textarea, or a `.txt` upload.
  - Output views:
    - plain Pinyin
    - interlinear (`<ruby>` Pinyin above each character)
    - TSV: original line, Pinyin
  - Copy and download buttons, using the pattern from the segment page.
- **Shared**: strings go in `lib/i18n/vi.ts` (`pinyin.*`), and the tool is added to the Navbar "Công cụ" dropdown.

## Tests

`lib/pinyin/convert.test.ts`, with curated cases covering:
- polyphones in context: 行 (银行 / 行走), 了, 的, 长 (长大 / 长度), 重
- ü (女, 绿)
- the neutral tone
- mixed Latin text and digits
- multiline input
- every tone style and both spacing modes

## Verification

- `npm test` and `npm run build` pass.
- In `npm run dev`, a paragraph of about 500 characters converts instantly.
- The ruby view lines up.
- DevTools → Network shows no request carrying the user's text.
