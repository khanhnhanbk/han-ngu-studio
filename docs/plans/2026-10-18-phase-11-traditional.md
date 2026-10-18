# Phase 11: Traditional Chinese (Phồn thể) across all tools

> Status: in progress (started 2026-10-18). 11a done.
>
> Changes made during implementation:
> - **Giản thể mode does no conversion at all** (`IDENTITY` converter), so every existing result stays byte-for-byte the same. Traditional input typed in Giản thể mode behaves as before.
> - `t2cn` is not a no-op on Simplified text: 57 characters in `word_list.txt` change (著→着, 么→幺, 乾→干). `toSimp` therefore converts only text that contains a Traditional character outside `SHARED_CHARS` (rebuilt from the word list by a test).
> - opencc-js 1.4.2 (`opencc-js/t2cn` + `opencc-js/cn2t`, both loaded only in Phồn thể mode).
> - Noto Sans TC lacks Simplified-only glyphs, so Phồn thể mode falls back to Noto Sans SC (`--font-hanzi-sc`).

## Context

Every tool assumes Simplified Chinese. Many Vietnamese learners study Traditional (TOCFL, Taiwan), and a quick probe shows the current pipelines give **wrong** results on Traditional input:

- `pinyin-pro`: 我們 → "wǒ **mén**", 銀行 → "yín **xíng**". The same text in Simplified gives wǒ men and yín háng.
- `hanviet.json` is keyed by Simplified only (學, 們, 頭 are missing). The segmentation word list and `vocab.json` / `sentences.json` are Simplified too.
- Already fine: the stroke shards and `decompose.json` contain Traditional characters, `meanings.json` has Traditional keys, `wubi.json` has Traditional codes (學 wfqb), and `unihan_radicals.tsv` has Traditional characters (學 39, 頭 181).

**Goal:** a **Giản thể / Phồn thể** switch at the top of every page (Navbar). Owner's decisions:

1. Traditional means **Taiwan characters only**: OpenCC `s2tw`, which changes characters (学习 → 學習, 头发 → 頭髮) but never swaps vocabulary (软件 stays 軟件, not 軟體), so HSK word lists still match.
2. **Output follows the switch**, whatever script the user typed. In Phồn thể mode, typing 学习 gives 學習 on the practice sheet, Anki cards, quiz and TSV. Input boxes keep exactly what was typed.

## Core idea: process in Simplified, show in the chosen script

All existing logic and data stay Simplified, so the Python ports and golden tests are untouched. Each tool does:

```
input ──toSimplified──▶ simp text ──existing pipeline──▶ results (Simplified)
input ──toShown(script)─▶ shown text (same length, code point by code point)
results are re-labelled onto `shown` by code-point offsets; free text from data
(example sentences, options) goes through toShown().
```

**Alignment rule:** `toSimplified` and `toShown` must keep the code-point count. OpenCC phrase conversion is length-preserving for CJK in practice. A guard compares the lengths and, on a mismatch, falls back to converting character by character, so the offsets can never drift.

## 11a: Infrastructure, switch, and the text tools (segment, pinyin, hanviet)

**Converter: `lib/script/`**
- `types.ts`: `type Script = "simp" | "trad"`.
- `preference.ts`: same pattern as `lib/theme.ts`: `parseScript`, `readScript`, `saveScript` (localStorage key `script`, try/catch), `applyScript` (sets `data-script` on `<html>`), and `SCRIPT_INIT_SCRIPT` (an inline `<head>` script so fonts never flash). A `useScript()` hook subscribes to a `script-change` window event and the `storage` event, so every mounted tool updates live when the switch flips.
- `convert.ts`: lazy `import("opencc-js/t2cn")` (69 KB) whenever input has Traditional characters, and `import("opencc-js/cn2t")` (about 1 MB raw, loaded **only in Phồn thể mode**). Use the `{ from: "tw", to: "cn" }` and `{ from: "cn", to: "tw" }` converters. Exports `loadConverter(script)`, `toSimplified(text)`, `toShown(text, script)` (with the alignment guard), and `mapTokens(tokens, shown)`, which re-slices Simplified tokens onto the shown text by code-point lengths.
- `useConverter()` hook: `{ script, ready, toSimp, toShown }`. Tools wait for `ready` before running, and show `Đang tải bộ chuyển đổi…` while the dictionary loads.
- Dependency: `opencc-js` with an exact version (1.0.5 checked; pin the version at implementation time, MIT; OpenCC data Apache-2.0). Credits go in CLAUDE.md "Data sources and credits", the footer or credits line, and `userguide/README.md`.

**Switch UI**
- `components/ScriptSwitch.tsx`: a two-button segmented control **简 Giản thể / 繁 Phồn thể** (`aria-pressed`). It goes in `components/Navbar.tsx` next to `<ThemePicker />` on desktop, and in the mobile menu next to `<ThemePicker inline />`. Strings go in `lib/i18n/vi.ts` under `script: { label, simp, trad, loading }`.
- `app/layout.tsx`: add `SCRIPT_INIT_SCRIPT` next to `THEME_INIT_SCRIPT`.

**Fonts.** Noto Sans SC draws Traditional characters with mainland glyph shapes. Add `Noto_Sans_TC` (next/font, `preload: false`, unicode-range slices, variable `--font-hanzi-tc`) in `app/layout.tsx`. In `app/globals.css`, use `:root[data-script="trad"] { --font-hanzi: var(--font-hanzi-tc), … }`.

**Text tools.** Each page converts at its boundary; the lib code is unchanged.
- `app/tools/segment/page.tsx`: segment `toSimp(input)` with `segment()` from `lib/segment/tokenizer.ts`, then `mapTokens` onto `toShown(input)` for display and download.
- `app/tools/pinyin/page.tsx`: run `lib/pinyin/convert.ts` on the Simplified text (correct polyphones), and show ruby or TSV over the shown characters.
- `app/tools/hanviet/page.tsx`: run `analyzeText` (`lib/hanviet/sentence.ts`) on the Simplified text, and relabel the word surfaces with the shown text (details panel and TSV too).

**Tests (`lib/script/script.test.ts`)**, using the real opencc-js modules in Vitest:
- Round trips: 学习 → 學習, 头发 → 頭髮, 软件 → 軟件 (no vocabulary swap).
- 我們 → 我们. Length is preserved on a mixed paragraph with punctuation and non-BMP characters.
- `mapTokens` keeps the boundaries, and the guard falls back correctly.
- An end-to-end check: Traditional 我們去銀行 through the pinyin path gives "wǒ men qù yín háng", the same as its Simplified form.

## 11b: Vocabulary tools (anki, quiz, comprehensible-input)

- **Anki** (`app/tools/anki/page.tsx`, `lib/anki/buildDeck.ts` input): look up words by their Simplified form (`vocab`, `meanings`, `sentences`, Hán Việt). The **Word** and **Example sentence** fields go through `toShown`. **Wubi** uses the shown characters (so Traditional characters get Traditional codes). The TSV is in the chosen script.
- **Quiz** (`app/tools/quiz/page.tsx`): build from Simplified entries with `buildQuiz`. Questions, options, cloze sentences, ordering tokens, the print sheet (`printText`) and the TSV (`toTsv`) render through `toShown`. Answer checking keeps comparing ids, not text. `ensurePrintFonts` loads the TC font in Phồn thể mode.
- **N+1** (`app/tools/comprehensible-input/page.tsx`): convert the sentences and the known-words list to Simplified before `extractWords`/`orderSentences`. Highlights (`splitHighlight`) and the TSV map back onto the shown sentences.

## 11c: Character tools (practice-sheet, stroke-order, radicals, decompose)

- **Practice sheet** (`app/tools/practice-sheet/page.tsx`): characters = `toShown(input)`, so stroke data for Traditional characters is already in the shards. Pinyin comes from the Simplified text. Fonts: add `Noto_Serif_TC` to `app/tools/practice-sheet/fonts.ts`. In Phồn thể mode, map "Noto Serif" and "Noto Sans" to the TC variants. LXGW WenKai TC already fits. Ma Shan Zheng has no Traditional glyphs, so hide it in Phồn thể mode (or label it "chỉ giản thể") in `lib/sheetFonts.ts`.
- **Stroke order** (`app/tools/stroke-order/page.tsx`): show and animate `toShown` characters. Hán Việt comes from the Simplified character. The `#c=` hash keeps the shown characters.
- **Radicals**: `scripts/build-data.mjs` `buildRadicals` also builds `charsTrad` / `membersTrad` from the `trad_char` column of `char_hanviet.csv` and `unihan_radicals.tsv` (Traditional characters have their own radical: 頭 is 181 頁, not 37 大). `lib/radicals/types.ts` and `app/tools/radicals/page.tsx` pick the list by script. Search accepts both scripts.
- **Decompose** (`app/tools/decompose/page.tsx`): analyse the `toShown` character (both scripts are in `decompose.json`). Hán Việt and Pinyin come from its Simplified form. Families hide characters that belong only to the other script (in Phồn thể mode, drop `c` where `toShown(c) !== c`, and the reverse in Giản thể mode).

## Docs, each phase

- `userguide/README.md`: a "Giản thể / Phồn thể" section next to "Đổi giao diện". Each tool's page gets a short note and a "Lỗi thường gặp" row: the first switch to Phồn thể downloads about 1 MB once; some characters have more than one Traditional form (发 → 發/髮) and OpenCC chooses by context, which can occasionally be wrong; vocabulary stays mainland wording.
- CLAUDE.md: a Tools-table note, a rule ("pipelines run on Simplified; convert at the page boundary with `lib/script`"), and credits.

## Verification

1. `pnpm test` (new script tests plus all golden tests unchanged), `pnpm run lint`, `pnpm run build` for each phase.
2. Browser (Playwright, as before). Switch to Phồn thể in the Navbar, reload, and check the setting persists without a flash. Then check:
   - Pinyin `我們去銀行`: wǒ men qù yín háng.
   - Hán Việt `學習中文`: học tập trung văn.
   - Segment: Traditional boundaries.
   - Anki `学习`: the card shows 學習 with a Traditional example sentence.
   - Quiz print: TC font.
   - Practice sheet `学`: 學 with its strokes.
   - Radicals 181: 頭 listed.
   - Decompose 學: the family shows only Traditional characters.

   Switch back to Giản thể and check the output returns to Simplified. Check dark mode and phone width with no overflow.
3. Network tab: `cn2t` loads only after switching to Phồn thể, and no request carries user text.
4. Commit each phase on main and push. Vercel deploys; check the commit status.
