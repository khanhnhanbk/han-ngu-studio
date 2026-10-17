# New defaults: gold accent (#D4AF37) and Noto Serif SC on the practice sheet

## Context

The owner wants two new defaults:
1. The default accent colour becomes **#D4AF37** (metallic gold) instead of orange.
2. The practice sheet's default character font becomes **Tống thể (chữ in) – Noto Serif SC** instead of LXGW WenKai.

Decisions (asked):
- **Exact gold with dark text.** Buttons, the logo and selected tabs are filled with exactly #D4AF37 and use dark text.
  White on #D4AF37 is only 2.1:1; dark ink (#0F172A) on it is 8.4:1. The other accents (Kim, Mộc, Thủy, Hỏa, Thổ)
  keep white text and look exactly as before.
- **Font: practice sheet only.** Characters elsewhere stay in Noto Sans SC. Anyone with a saved font choice keeps it
  (localStorage wins over the default).

A second readability problem: `text-brand-600` is used as text colour on the page about 15 times (eyebrows, links,
Hán Việt readings). Gold text on white is also 2.1:1, so the default accent needs a darker gold for text.

## 1. Theme tokens (`app/globals.css`, `tailwind.config.ts`)

Default accent palette `--b-*` (light), replacing Tailwind orange; 600 is the requested colour:

| step | RGB | hex | role |
|---|---|---|---|
| 50 | 252 248 232 | #FCF8E8 | tinted panels |
| 100 | 248 239 204 | #F8EFCC | |
| 200 | 240 225 160 | #F0E1A0 | borders |
| 300 | 230 207 112 | #E6CF70 | grid lines |
| 400 | 221 190 76 | #DDBE4C | focus rings, highlight |
| 500 | 216 182 63 | #D8B63F | borders, dark-mode hover |
| **600** | **212 175 55** | **#D4AF37** | fills (buttons, logo) |
| 700 | 138 109 31 | #8A6D1F | text on tints (4.9:1 on white) |
| 800 | 112 88 25 | #705819 | |
| 900 | 84 66 19 | #544213 | |
| 950 | 46 36 10 | #2E240A | dark-mode tints |

Three new semantic tokens, so the gold-specific needs don't change the other accents:
- `--on-brand`: text on a `brand-600` fill. `:root` = white (255 255 255); default accent
  (`:root:not([data-accent])`) = ink 15 23 42. Tailwind colour `on-brand`.
- `--brand-ink`: brand-coloured text on the page. `:root` = `var(--brand-600)` (other accents unchanged);
  default accent in light mode (`:root:not([data-accent]):not(.dark)`) = `var(--b-700)`. In dark mode, gold on the
  dark page is already readable. Tailwind colour `brand-ink`.
- `--brand-hover`: primary-button hover fill. `:root` = `var(--brand-700)`; default accent in light mode =
  190 155 45 (#BE9B2D, 6.4:1 with dark text; #8A6D1F would be only 3.6:1). Tailwind colour `brand-hover`.
  The dark-mode hover (`dark:hover:bg-brand-500`) stays.

Update the comments ("orange (default)" → gold; the Hỏa comment).

## 2. Use the tokens (mechanical)

- `text-white` on a `bg-brand-600` fill → `text-on-brand`: `.btn-primary` (`app/globals.css`), the Navbar and Footer
  logo squares, the HowItWorks step numbers, the Roadmap "next" badge, selected toggles in `app/tools/hanviet/page.tsx`
  and `app/tools/pinyin/page.tsx`, and the Writer tab (`components/stroke-order/Writer.tsx`). Find them all with
  `git grep "bg-brand-600"`.
- `.btn-primary` hover `hover:bg-brand-700` → `hover:bg-brand-hover`.
- Solid text `text-brand-600` / `text-brand-500` → `text-brand-ink` (`git grep -n "text-brand-[56]00\b"`). Leave
  faded decorative ones (`text-brand-500/40` in Hero) and `text-brand-700` on tints (700 is now dark gold).
- Not touched: the CTA section (white text on a dark panel), Hanzi Writer colours (`--brand-400/600` for
  strokes; gold strokes on white are decorative), and the practice sheet's own "orange" grid colour option
  (`lib/practiceSheet.ts`; a print colour choice, not the theme).

## 3. Theme picker and docs

- `lib/theme.ts`: `ACCENT_SWATCH.default = "#d4af37"`; comment "original orange brand" → gold. Keep the legacy
  `orange → default` mapping (old saved values still load).
- `lib/i18n/vi.ts`: `accentHints.default` "Mặc định – cam" → "Mặc định – vàng kim".
- `userguide/README.md`: the **Mặc định** row "Cam (màu gốc của trang)" → "Vàng kim (màu gốc của trang)".
- `lib/theme.test.ts`: update only if it asserts the swatch.

## 4. Practice sheet default font

- `app/tools/practice-sheet/page.tsx`: `DEFAULTS.fontId` `"wenkai"` → `"notoSerif"`. The fallback stack in
  `lib/sheetFonts.ts` (Kai fonts for glyphs Noto Serif SC lacks) stays as is.
- `userguide/practice-sheet.md`: mark **Tống thể (chữ in) – Noto Serif SC** as the default instead of WenKai.
- Check `lib/sheetFonts.test.ts` / `lib/practiceSheet.test.ts` for an assertion on the default.

## Verification

- `pnpm run lint`, `pnpm test`, `pnpm run build`.
- Browser (Playwright in the scratchpad) with a fresh profile (no saved theme):
  - The computed background of `.btn-primary` is rgb(212, 175, 55), its text is dark, and contrast is ≥ 4.5 (also on
    hover). Eyebrow and link text uses #8A6D1F.
  - Screenshots of the landing page, /tools/quiz and /tools/stroke-order in light and dark mode.
  - Switch to Hỏa and Thủy: buttons are red/blue with white text, as before.
  - /tools/practice-sheet (fresh profile): the font picker shows Tống thể – Noto Serif SC, and the sheet renders
    in it. With a saved `wenkai` choice in localStorage, WenKai is still used.
- Commit on main: `feat(theme): gold default accent and Noto Serif SC sheet font`. Ask before pushing.
