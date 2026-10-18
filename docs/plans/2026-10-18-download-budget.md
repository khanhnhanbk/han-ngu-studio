# Ask before large downloads, and shrink stroke data

> Status: done (2026-10-18). Notes from implementation:
> - With 8-code-point shards, even a 300-character sheet is about 1.7–1.9 MB gzip, so the practice sheet stays under the 2 MB threshold. Its prompt path was tested with inflated sizes.
> - Decompose is not gated: its data is about 0.4 MB, and the page has no retry button.
> - The hanviet, radicals, decompose and vocab loaders now use `memoJson` (same behaviour), so `markLoaded` lives in one place (`lib/data/loaded.ts`).

## Context

Every tool already loads its data lazily, but some actions can still download a lot without warning:

| Action | Download today (gzip) |
|---|---|
| Ngắt từ / Pinyin | word_list ≈ 0.5 MB |
| Hán Việt | ≈ 0.6 MB |
| Anki / Quiz (first build) | ≈ 1.4 MB + example shards (up to ≈ 1.5 MB) |
| Phồn thể switch | OpenCC ≈ 0.5 MB |
| Practice sheet / stroke order, **20 characters** | 19 stroke shards ≈ **1.9 MB raw** |
| Practice sheet, **300 characters** | 163 shards ≈ **15.6 MB raw** |

Stroke shards hold 64 code points each, so the characters of ordinary text land in different shards. The practice sheet also fetches them while the user types.

**Owner's decisions:**
- Ask before any action whose *new* download exceeds **2 MB** (compressed transfer).
- The prompt has a **"Không hỏi lại trên máy này"** checkbox, saved in localStorage.
- Shrink stroke shards to **8 code points**.

## 1. Smaller stroke shards (8 code points)

- `scripts/build-data.mjs`: `STROKE_SHARD_BITS = 6` → `3`, which gives ≈ 2,584 files of about 11 KB each. Check that the build still clears the old shard directory before writing.
- `lib/strokes/load.ts`: `SHARD_BITS = 6` → `3`. The comment there says it must match the build script.
- Run `pnpm build:data` and commit the regenerated `public/data/strokes/`.
- Expected effect: 20 characters ≈ 0.2 MB raw instead of 1.9 MB; 300 characters ≈ 3 MB instead of 15.6 MB.
- Update CLAUDE.md, which says "64-code-point shards".
- After deploying, check that Vercel accepts the file count (≈ 2,600 static files).

## 2. Size manifest: `public/data/sizes.json`

`scripts/build-data.mjs` writes it last:
- Each file under `public/data/` (except `sizes.json` itself) maps to its gzip size in bytes (`zlib.gzipSync`, default level). Keys are site paths, e.g. `/data/strokes/9a8.json`.
- Two more keys, `opencc:t2cn` and `opencc:cn2t`, give the gzip size of `node_modules/opencc-js/dist/esm/{t2cn,cn2t}.js`.
- Expected size about 60 KB raw / 20 KB gzip. It is fetched only when a check runs, and is never itself gated.

## 3. Download gate: `lib/data/budget.ts`

- `THRESHOLD = 2 * 1024 * 1024`.
- `loadSizes`: uses `memoJson("/data/sizes.json")` from `lib/fetchJson.ts`.
- `pendingBytes(sizes, keys, isCached): number` is a pure function. It sums the sizes of keys that are not already available.
- **Already available** means fetched this visit (a `loaded` set) or in the browser's HTTP cache. The cache check is a `fetch(url, { cache: "only-if-cached", mode: "same-origin" })` probe. If the probe errors (unsupported browser), the key counts as not cached.
- The data loaders call `markLoaded(url)` after a successful fetch: `lib/fetchJson.ts` `memoJson`, `lib/segment/load.ts`, `lib/strokes/load.ts`, and the hanviet, radicals, decompose and vocab loaders.
- `confirmDownload(keys): Promise<boolean>`:
  - Returns `true` at once if prompts are off (localStorage key `download-prompt` = `off`, read in try/catch), if `sizes.json` fails to load (never block a tool), or if `pendingBytes <= THRESHOLD`.
  - Otherwise it asks the prompt component through a small listener store in the same module, and resolves with the user's choice. If the user ticks "Không hỏi lại" and accepts, save `off`.
- Key helpers next to each loader, so the pages don't hard-code URLs:
  - `TOKENIZER_FILES` (`lib/segment/load.ts`).
  - `strokeFiles(chars)` (`lib/strokes/load.ts`, uses `shardKey`).
  - `exampleFiles(words)` and `levelFiles(level)` (`lib/examples/load.ts`, after `loadManifest()`, which is small).
  - Constants for hanviet, meanings, wubi, vocab, decompose and radicals.

## 4. Prompt UI: `components/DownloadPrompt.tsx`

- A client component mounted once in `app/layout.tsx`. It subscribes to the store in `lib/data/budget.ts`.
- A modal `role="alertdialog"`, styled with theme tokens (`bg-surface`, `ink-*`, `brand-*`) and checked in dark mode and at phone width. Focus goes to the main button; Esc means "Để sau".
- Strings go in `lib/i18n/vi.ts` under `download`:
  - title "Tải dữ liệu?"
  - body "Công cụ cần tải khoảng {size} dữ liệu. Dữ liệu chỉ tải một lần và được trình duyệt lưu lại; văn bản của bạn không gửi đi đâu."
  - buttons "Tải xuống" / "Để sau"
  - checkbox "Không hỏi lại trên máy này"
  - `declined`: "Chưa tải dữ liệu. Bấm lại nút khi bạn muốn tải."
  - `strokesDeclined` / `strokesLoad` for the practice sheet
- Sizes are formatted in Vietnamese ("2,4 MB") with `toLocaleString("vi-VN", { maximumFractionDigits: 1 })`.

## 5. Where tools call the gate

Each call goes before the existing `Promise.all` of loaders. On "Để sau", the page shows `download.declined` and stops; nothing else changes.

| Page | Keys |
|---|---|
| `app/tools/segment/page.tsx`, `pinyin/page.tsx` | tokenizer |
| `hanviet/page.tsx` | tokenizer, hanviet |
| `anki/page.tsx` | tokenizer, hanviet, meanings, wubi, vocab, `exampleFiles(words)` |
| `quiz/page.tsx` | the same, without wubi |
| `comprehensible-input/page.tsx` | Sort: tokenizer. **Lấy câu**: `levelFiles(level)` (+ vocab when known words are pre-filled) |
| `stroke-order/page.tsx` | `strokeFiles(chars)`, hanviet |
| `decompose/page.tsx` | decompose, hanviet, radicals, wubi on open; `strokeFiles` per character |
| `practice-sheet/page.tsx` | `strokeFiles(characters)` |

**Practice sheet.** The stroke effect runs on every edit, so:
- Debounce it by 400 ms before the gate.
- If the user declines, set `strokeState: { status: "declined", bytes }`. The page stops auto-loading and shows `strokesDeclined` with a **Tải dữ liệu thứ tự nét** button, which loads without asking again.
- Turning **Hiện thứ tự nét** off and on clears "declined".
- Printing is held while strokes are pending, as today.

**Not gated** (always far below 2 MB): radicals (53 KB) and the Phồn thể converter (≈ 0.5 MB). They still call `markLoaded`.

## 6. Tests

- `lib/data/budget.test.ts`:
  - `pendingBytes` skips loaded and cached keys.
  - Threshold boundary.
  - "off" preference.
  - Size formatting.
  - `sizes.json` lists every file in `public/data/` (read from disk).
- `lib/strokes`: `shardKey` with 3 bits (例 U+4F8B → `9f1`); every shard file name matches `shardKey` of its characters.
- Existing golden tests unchanged.

## 7. Docs

- `userguide/README.md`, "Mẹo chung": large downloads ask first, with the 2 MB threshold. How to turn prompts back on after "Không hỏi lại": clear the site data.
- `userguide/practice-sheet.md`: the declined notice, and a "Lỗi thường gặp" row.
- CLAUDE.md: shard size; new rule "gate new data loads with `confirmDownload` (`lib/data/budget.ts`); add new files to `sizes.json` via `pnpm build:data`".

## Verification

1. `pnpm build:data`, `pnpm test`, `pnpm run lint`, `pnpm run build`.
2. Browser (Playwright, production build):
   - Practice sheet with 300 distinct characters and stroke order on: the prompt shows about 3 MB. "Để sau" shows the notice; the button loads the data.
   - 20 characters: no prompt, and the Network tab shows ≈ 0.2 MB of shards.
   - Anki with words from every HSK level on a fresh profile: the prompt appears (> 2 MB). After reloading, cached data does not prompt again.
   - "Không hỏi lại" ticked: later large loads do not ask.
   - Prompt in dark mode, at phone width, with Esc and keyboard.
   - Every tool still works in Giản thể and Phồn thể mode.
3. Commit on main, push, and check the Vercel deployment succeeds with the new file count.
