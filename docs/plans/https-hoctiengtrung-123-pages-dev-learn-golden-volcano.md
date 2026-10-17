# Fix: stroke-order playback buttons jump between one and two lines

## Context

On `/tools/stroke-order`, the buttons **Phát**, **Phát lặp lại** and **Tạm dừng / Tiếp tục** sometimes sit on one
line and sometimes wrap onto two. The owner wants them always on one line.

Cause:
- The buttons are in `flex flex-wrap` (`components/stroke-order/Writer.tsx:202`), inside a column capped at 320px
  (`app/tools/stroke-order/page.tsx:150`, `md:grid-cols-[minmax(0,320px)_1fr]`).
- With the default `.btn` padding (`px-5`, `app/globals.css:197`), the three buttons need about 310–320px, right at
  the limit.
- The third button switches between "Tạm dừng" and "Tiếp tục", whose widths differ. One fits on the line, the other
  wraps, so the row jumps every time playback is paused or resumed. On phones it always wraps.

## Change (only `components/stroke-order/Writer.tsx`)

1. Row: `flex flex-wrap justify-center gap-2` → `flex flex-nowrap justify-center gap-2`.
2. Each of the three buttons: add `whitespace-nowrap px-3` (tighter than `.btn`'s `px-5`; `.btn` is `@apply`'d, so
   the utility class wins). The three buttons then need about 265px, which fits the 320px column and a 360px phone
   (about 330px of content).
3. Pause/resume keeps a fixed width: render both labels in the same grid cell and hide the inactive one, so the
   button is always as wide as the longer label:
   ```tsx
   <span className="grid">
     <span className={`col-start-1 row-start-1 ${paused ? "invisible" : ""}`}>{t.pause}</span>
     <span className={`col-start-1 row-start-1 ${paused ? "" : "invisible"}`} aria-hidden={!paused}>{t.resume}</span>
   </span>
   ```
   Put `aria-hidden` on the hidden label (the pause span too, when paused) so screen readers read only the visible one.

No text, i18n or user-guide changes (labels and behaviour stay the same).

## Verification

- `pnpm run lint`, `pnpm test`, `pnpm run build`.
- Browser (the Playwright setup in the scratchpad), open
  `/tools/stroke-order#c=瓦瓶瓷瓮甄甁瓯` at 1280px, 768px and 360px widths:
  - The three buttons have the same `top` (one line) before playing, while playing ("Tạm dừng") and after pausing
    ("Tiếp tục").
  - The pause button's width does not change between the two labels.
  - The row does not overflow its column (`scrollWidth <= clientWidth`).
- Check dark mode and a second accent quickly (only spacing changes, so colours are unaffected).
- Commit on main as `fix(stroke-order): keep playback buttons on one line` and push (the owner asked for push last time;
  confirm before pushing).
