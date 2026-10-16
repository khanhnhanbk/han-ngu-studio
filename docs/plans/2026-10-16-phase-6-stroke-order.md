# Phase 6: Stroke order (sheet strip + lookup page)

## Context

Learners need to know *how* to write a character, not just what it looks like. Today the practice sheet (`/tools/practice-sheet`) shows a model character and faint trace copies, with no stroke order. The references show how others handle this:

- **strokeorder.com**: per-character page with animation, step-by-step diagram, stroke count, trace/quiz modes and printable sheets.
- **Yark-yao/Chinese-Stroke-Order-Generator**: renders GIFs with **Hanzi Writer** + **hanzi-writer-data** (Puppeteer/FFmpeg, server-side). We only need the data and the library, not the GIF pipeline.
- **xiehanzi.com**: Vietnamese vở tập viết generator with a "Hiển thị thứ tự nét" toggle and A4 PDF export.

Everything here can run on Vercel Hobby as static files + client JS: stroke outlines come from `hanzi-writer-data` (≈9.5k simplified + traditional chars, Arphic Public License, derived from Make Me a Hanzi). We self-host the data in `public/data/` (no CDN calls at runtime) and draw it as SVG, which prints as vectors through the existing `window.print()` flow.

User decisions:
- On the sheet: a **strip of small cells** above each character's first practice line; cell *k* shows strokes 1..k, stroke *k* highlighted.
- Lookup page: **animation + step diagram + quiz**, plus Pinyin, Hán Việt, stroke count and a link to the sheet.

Split into two PRs to stay under the ~1000-line limit: **6a** data + sheet strip, **6b** lookup page.

Linked from `docs/plans/2026-10-15-roadmap.md` as rows 6a / 6b.

## Data (6a)

- Add `hanzi-writer-data@2.0.1` as a **devDependency** (exact pin). Copy its `ARPHICPL.TXT` to `assets/dictionary/LICENSE-arphic.txt`.
- Extend `scripts/build-data.mjs`: read each `<char>.json` (`{ strokes: string[], medians: number[][][], radStrokes?: number[] }`), group by `codepoint >> 6` (64-codepoint blocks, ~330 shards for the CJK block, ~100 KB each), write `public/data/strokes/<hex>.json` = `{ [char]: { s, m } }` (strokes, medians; drop nothing else needed by Hanzi Writer). Keep values exactly as in the source (correctness first, no path simplification). Fail the build if any shard exceeds 1.5 MB.
- `lib/strokes/load.ts`: `shardKey(char)` (uses `codePointAt(0)`, works outside BMP), memoised per-shard `fetch` like `lib/hanviet/load.ts`, `loadStrokes(chars): Promise<Map<string, StrokeData>>`, `loadStroke(char)`.
- `lib/strokes/render.ts` (pure): constants for the Hanzi Writer coordinate system (1024 box, `translate(0, 900) scale(1, -1)`), `strokeTransform(x, y, size)`, `strokeSteps(data)` → cumulative step list. Shared by sheet and lookup page.

## Sheet strip (6a)

- `lib/practiceSheet.ts`:
  - `SheetOptions.showStrokeOrder: boolean` (persisted in `StoredOptions`, default `false`).
  - `SheetRow` gets `kind: "first" | "extra" | "strokes"`. `buildPages` packs by **height**: group height = `lines × boxSize + (showStrokeOrder ? boxSize / 2 : 0)`; groups never split across pages (current rule kept). `getLayout` exposes the available page height instead of only `rowsPerPage`.
  - `stripCellSize(boxSize, gridWidth, strokeCount)`: `boxSize / 2`, shrunk so all strokes fit one row (min 5 mm).
- `components/practice-sheet/StrokeStrip.tsx` (new): for each step, a small GridBox-style cell with previous strokes in trace grey and the new stroke in black; label column shows the stroke count ("6 nét"). Characters with no data show a small "Chưa có dữ liệu nét" note instead.
- `components/practice-sheet/SheetPage.tsx`: compute `y` cumulatively per row (rows no longer all `boxSize` tall); render `StrokeStrip` for `kind: "strokes"`. Reuse `GridBox`, `GRID_COLORS`, `TRACE_COLORS`.
- `app/tools/practice-sheet/page.tsx`: checkbox "Hiển thị thứ tự nét"; when on, `loadStrokes(characters)` into state; print button disabled with "Đang tải dữ liệu nét…" until loaded; error message on fetch failure. Also read `?chars=` / `?strokes=1` from `window.location` on mount (for the lookup page link; avoids a Suspense boundary).
- Credit line under the sheet options: "Dữ liệu nét chữ: Make Me a Hanzi / hanzi-writer-data (Arphic Public License)".

## Lookup page (6b): `/tools/stroke-order`

- Add `hanzi-writer@3.7.3` (MIT) as a dependency. Use `charDataLoader: (c, onLoad, onError) => loadStroke(c).then(...)` so it never hits jsDelivr.
- `app/tools/stroke-order/page.tsx` (`"use client"`):
  - Input (one or more chars; `parseCharacters` from `lib/practiceSheet.ts`), chips to switch between them, `?c=` query param for sharing.
  - Animated writer in a 米字格 box: Phát / Tạm dừng / Lặp lại / speed select / "Từng nét" (step forward).
  - "Tự viết thử" quiz mode (`writer.quiz()`), showing mistakes and a "Gợi ý" after N misses (Hanzi Writer options).
  - Info: Pinyin (`getPinyin`), Hán Việt (`loadHanviet` + existing lookup in `lib/hanviet/lookup.ts`), stroke count.
  - Static step diagram reusing `StrokeStrip` (on-screen size).
  - Button "Tạo phiếu tập viết với chữ này" → `/tools/practice-sheet?chars=…&strokes=1`.
  - Colours via theme tokens (`brand-*`, `ink-*`, `surface`); writer stroke colours read from CSS variables so dark mode / accents work.
- Register: `lib/links.ts` `TOOLS` + `ToolId` (`strokeOrder`, icon 畫), `lib/i18n/vi.ts` (tool card + page strings), landing `Features` picks it up automatically.

## Docs (each PR updates its part)

- `userguide/practice-sheet.md` (new toggle, exact labels, Lỗi thường gặp: chữ không có dữ liệu nét, tải chậm lần đầu), new `userguide/stroke-order.md`, `userguide/README.md` index.
- `CLAUDE.md` tools table + data credits.

## Verification

- `pnpm build:data` → shard count and max size printed; commit output.
- `pnpm test`: new `lib/strokes/*.test.ts` (shardKey incl. a non-BMP char, 字 = 6 strokes, 永 = 5 from real shard files, `strokeSteps` cumulative lengths), updated `buildPages` tests for height packing with and without the strip and no group split.
- `pnpm lint` and `pnpm build` pass.
- `pnpm dev`: practice sheet with 永和九年 + toggle on: strip appears, all box sizes, print preview (Ctrl+P → Save as PDF) shows vector strokes, page breaks keep groups whole; a char without data shows the note. Lookup page: animate/quiz 字 and a traditional char (學), dark mode + another accent, phone width, link prefills the sheet. Network tab shows only `/data/strokes/*.json` requests.
