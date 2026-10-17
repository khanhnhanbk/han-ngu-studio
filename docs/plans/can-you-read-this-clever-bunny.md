# Add animated icons from animateicons

## Context

The owner wants to use [animateicons](https://github.com/Avijit07x/animateicons) (MIT, 1,170 animated SVG icons built on `motion`, shapes from Lucide/Hugeicons) across the site. Today the site has almost no icons: tool cards show Chinese-character badges (筆 畫 分 拼 越 札 句), the navbar uses text glyphs (☰ ✕ ▾), the FAQ uses "+", ThemePicker has a hand-drawn palette SVG, and every Copy/Download/Print button is text only.

Agreed scope (owner's answers): **all four areas**: action buttons, navbar/FAQ chrome, tool cards (replace the characters), Hero/landing accents. Install method: **copy icons via the CLI** (we own the source; only `motion` becomes a dependency).

Constraints that still apply: Hobby plan, no backend (pure client components, fine). Colours via theme tokens (icons use `currentColor`, never the `color` prop with hex). Lint must pass in `next build`.

## Approach

### 1. Install

- `pnpm add motion` (pin exact version like the other deps).
- `npx animateicons add --with-utils <names…>` → files land in `components/icons/<name>.tsx`, exported as `<Name>Icon`. `--with-utils` creates the `cn` helper at `lib/utils.ts` (no `lib/utils` exists today). If it pulls in `clsx`/`tailwind-merge`, keep them; if it is a plain join, fine.
- Before adding, confirm each name with `npx animateicons search <term>`; candidates below may need small renames.
- Copied files: make sure each starts with `"use client"`, passes strict TS and ESLint (fix `any` / unused vars if any). Keep the upstream MIT notice: add a short `components/icons/README.md` crediting animateicons (MIT) + Lucide (ISC), and add the credit to the footer/credits list next to the other data credits.
- Reduced motion: docs say "Reduce Motion" is respected automatically; verify in DevTools (emulate `prefers-reduced-motion: reduce`).

### 2. Shared helper

`components/icons/IconButtonContent.tsx`-style tiny client wrappers are needed because hooks can't run in loops and server components can't call `useIconHover`:

- `AnimatedTrigger` (client): takes `icon` component + `as` element props, calls `useIconHover()`, spreads `triggerProps` on the wrapper and `ref` on the icon. Used for buttons, links and cards so hovering the **whole** element plays the icon (not just the 16px SVG).

### 3. Placement and icon mapping

| Where | File | Change | Icon (candidate) |
|---|---|---|---|
| Tool cards | `components/Features.tsx`, `lib/links.ts` | `TOOLS[].icon` becomes an icon key (string union) instead of a character; a map in `components/icons/toolIcons.ts` resolves key → component. Card becomes a client `ToolCard` using `AnimatedTrigger` so card hover animates the badge. Keep the `bg-brand-50 text-brand-700` badge box. Also animate the "→" CTA with `arrow-right`. | practiceSheet `pen-line`, strokeOrder `brush`, segment `scissors`, pinyin `languages`, hanviet `book-open`, anki `layers`, comprehensibleInput `list-ordered` |
| Navbar | `components/Navbar.tsx` | ▾ → `chevron-down` (rotate when `toolsOpen`); ☰/✕ → `menu` / `x` | chevron-down, menu, x |
| Theme picker | `components/ThemePicker.tsx` | replace `PaletteIcon` SVG with animated `palette` | palette |
| FAQ | `components/FAQ.tsx` | "+" → `plus` icon keeping `group-open:rotate-45` | plus |
| Hero | `components/Hero.tsx` | small icons inside the two CTA buttons (`arrow-down` for "#features", `book-open`/`external-link` for user guide) and a `sparkles` in the badge | sparkles, arrow-down, external-link |
| Other landing sections | `HowItWorks.tsx`, `ForTeachers.tsx` (read first) | one icon per step/benefit item where items already exist; no new content | chosen per item |
| Copy buttons | `app/tools/{pinyin,hanviet,segment,anki}/page.tsx` | `copy` icon, swap to `check` while `copied` is true | copy, check |
| Download buttons | same pages + `comprehensible-input`, `anki` (.apkg) | `download` icon | download |
| Print/PDF | `app/tools/practice-sheet/page.tsx` | `printer` icon | printer |
| Font upload | `components/practice-sheet/FontPicker.tsx` | `upload` icon | upload |

Buttons: icon `size={16}`, `aria-hidden`, placed before the label with `inline-flex items-center gap-1.5`; button text stays from `lib/i18n` (no i18n changes needed). Where a page renders several buttons in a map, extract a small `ActionButton` client component that wraps `AnimatedTrigger`.

### 4. Docs

- `userguide/`: buttons keep the same labels, so guide text stays valid; add one line to `userguide/README.md` noting icons are decorative (only if there's a natural spot; otherwise no change).
- `lib/links.test.ts`: update if it asserts on `icon` values.

## Critical files

`package.json`, `lib/utils.ts` (new), `components/icons/*` (new), `lib/links.ts`, `components/{Features,Navbar,ThemePicker,FAQ,Hero,HowItWorks,ForTeachers,Footer}.tsx`, `components/practice-sheet/FontPicker.tsx`, `app/tools/*/page.tsx`.

## Verification

1. `pnpm run lint`, `pnpm test`, `pnpm run build` all pass; check the build's First Load JS for `/` and note the size increase from `motion`.
2. `pnpm run dev`: hover each tool card, navbar chevron, menu toggle (mobile width), theme picker, FAQ open/close, every Copy/Download/Print button on all 7 tools: icon animates when hovering the whole element; copy swaps to check.
3. Dark mode and a second accent via ThemePicker: icons follow `currentColor` / brand tokens.
4. DevTools → emulate `prefers-reduced-motion: reduce`: icons render static.
5. Keyboard: Tab through buttons; no focus/ARIA regressions (icons `aria-hidden`).
6. Commit on `main` (no PR), message ending with the Co-Authored-By line.
