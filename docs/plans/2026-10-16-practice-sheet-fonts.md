# Practice sheet: choose the font

## Context

The practice sheet always draws the model and trace characters in LXGW WenKai (Kai). Teachers want other styles (brush, printed Song, sans) or their own font (a school's standard Kai, or one installed on their computer).

## Approach

- **Presets** (SIL OFL, self-hosted by `next/font/google` at build time, loaded in unicode-range slices only on the practice-sheet page):
  - Khải thư (LXGW WenKai TC): default, closest to handwriting
  - Bút lông (Ma Shan Zheng): brush Kai, mostly simplified
  - Tống thể (Noto Serif SC): printed Song/Ming
  - Hắc thể (Noto Sans SC): sans, already loaded site-wide
- **Font on this computer**: type a family name (suggestions: KaiTi, STKaiti, Kaiti SC, SimSun, Microsoft YaHei, PingFang SC…). On Chrome/Edge desktop, a button lists installed fonts via the Local Font Access API (`queryLocalFonts`, asks permission). A canvas width check warns when the name is not found.
- **Upload a font file** (.ttf, .otf, .woff, .woff2, max 50 MB): `FontFace` + `document.fonts.add`, entirely in the browser; never uploaded anywhere. Not saved across reloads (the choice falls back to the default).
- Every choice falls back to WenKai, then the system Kai fonts, for missing glyphs (e.g. traditional characters in Ma Shan Zheng).
- The font applies to the model, trace and hint characters. The stroke-order strip is drawn from stroke data, not a font.
- Printing waits for `document.fonts.ready`.

## Files

- `lib/sheetFonts.ts` (+ test): font ids, CSS stack builder with safe quoting.
- `app/tools/practice-sheet/fonts.ts`: `next/font` declarations for the page.
- `components/practice-sheet/FontPicker.tsx`: the UI (select, local name, upload, sample).
- `components/practice-sheet/SheetPage.tsx`: use `options.fontFamily`.
- `app/tools/practice-sheet/page.tsx`, `lib/i18n/vi.ts`, `userguide/practice-sheet.md`.

## Verification

`pnpm test`, `pnpm lint`, `pnpm build`; headless Chrome screenshots of the sheet with each preset.
