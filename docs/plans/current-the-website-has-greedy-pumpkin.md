# Fix fonts in the quiz worksheet PDF ("In đề / lưu PDF")

## Context

On `/tools/quiz`, printing or saving the worksheet as PDF shows Pinyin with broken tone-marked letters (ǎ, ǐ, ǚ… in a different font) and Vietnamese text (options, Hán Việt) in the wrong font.

**Root cause (checked in the build output, `.next/static/css/*.css`):** the fonts are fine. Noto Sans SC and Be Vietnam Pro are free (SIL OFL), self-hosted by `next/font`, and their CSS already includes the `latin-ext` slice (Pinyin tone marks, U+0100–02BA) and the `vietnamese` slice (U+1EA0–1EF9). But Google splits each font into `unicode-range` slices that the browser downloads **only when some visible text needs them**. The worksheet (`components/quiz/PrintSheet.tsx`) is `hidden` on screen (`display:none`, shown only under `print:`), so:

- Pinyin options and Vietnamese options in the sheet use `.hanzi` (Noto Sans SC). On screen, `QuestionCard` shows those options *without* `.hanzi`, so Noto Sans SC's latin-ext and vietnamese slices (and the CJK slices for characters that only appear in the sheet) are never downloaded.
- When `window.print()` runs, Chrome lays out the sheet but **does not wait** for the font files that layout asks for. The missing glyphs fall back to the system `serif` font (Times or DejaVu Serif), so the PDF mixes fonts inside a single word.

So we don't need to download a new font. The fix is to **load the needed font slices before printing**.

## Approach

1. **Collect the sheet's text**: add `printText(questions)` to `lib/quiz/export.ts`. It is a pure function that joins every string `PrintSheet` renders (prompts, hints, options, tokens, `end`, answer-key lines, plus the `dict.quiz` labels passed in). Add a small Vitest case in `lib/quiz/export.test.ts` (or the existing test file), e.g. it includes the Pinyin options and the Vietnamese hint.

2. **Font-loading helper**: add `ensurePrintFonts(text)` (client-only, e.g. `lib/quiz/printFonts.ts`). It calls `document.fonts.load()` for each font and weight the sheet uses, with that text, so the browser downloads exactly the matching `unicode-range` slices:
   - `.hanzi` text: `400 20px <var(--font-hanzi) stack>`
   - Body/labels: `400 14px` and `700 24px` with `<var(--font-be-vietnam) stack>`

   Read the family stacks from `getComputedStyle(document.documentElement).getPropertyValue("--font-hanzi" / "--font-be-vietnam")` so the hashed fallback names from `next/font` stay correct. Wrap it in try/catch and `Promise.all`, and wait for `document.fonts.ready`.

3. **Wire it into the quiz page** (`app/tools/quiz/page.tsx`):
   - The print button becomes `async () => { await ensurePrintFonts(text); window.print(); }`. Use a short "busy" state so a double click doesn't print twice; this needs no new UI text.
   - Add a `useEffect` on `questions` (when `phase !== "setup"`) that calls `ensurePrintFonts` early. Then **Ctrl+P** works too, because `beforeprint` cannot wait for an async call.

4. **Safety net in CSS** (`app/globals.css`): change the last fallback of `--font-hanzi` from `serif` to `sans-serif`. Then a glyph that still goes missing falls back to a sans font like the rest of the sheet, not Times. Also check the `hanzi` family in `tailwind.config.ts`, which ends in `"serif"`, and change it to match.

5. **User guide**: in `userguide/quiz.md`, add an item to "Lỗi thường gặp". If the PDF fonts still look wrong, wait for the page to finish loading and print again, and use Chrome or Edge with "Lưu dưới dạng PDF". Quote the exact button label `dict.quiz.print` from `lib/i18n/vi.ts`.

## Files

- `lib/quiz/export.ts`: `printText()` (and its test)
- `lib/quiz/printFonts.ts` (new): `ensurePrintFonts()`
- `app/tools/quiz/page.tsx`: print button and preload effect
- `app/globals.css`, `tailwind.config.ts`: `sans-serif` as the last fallback
- `userguide/quiz.md`

## Verification

- `pnpm test`, `pnpm run lint`, `pnpm run build` all pass.
- `pnpm run dev` → `/tools/quiz` → sample words, turn on all question types (including Pinyin and Hán Việt) → start → "In đề" → Save as PDF. In the PDF, Pinyin (nǐ, lǚ…) and Vietnamese (học, người…) should each use one consistent font. Repeat in a fresh incognito window (empty font cache), which is the case that fails today, and also with Ctrl+P.
- DevTools → Network → Font: before printing, the Noto Sans SC latin-ext and vietnamese `.woff2` files have been fetched.
- Check dark mode and another accent (the print palette is already forced to light).
