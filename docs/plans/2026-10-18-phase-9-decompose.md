# Phase 9: `/tools/decompose` "Phân tích chữ" (character component breakdown)


## Context

The owner wants their own version of the "chiết tự" method that Hack Não 3000 Chữ Hán sells as a book, taking ideas from hantang/search-wubi's decomposition diagrams: split any character into all its components (not just the Kangxi radical), name each part in Vietnamese, and help learners build their own memory story. Today `/tools/radicals` only files a character under its one radical, and `/tools/stroke-order` shows strokes with no structure.

**Data:** Make Me a Hanzi `dictionary.txt` (~9.5k characters, **LGPL-3.0+**). It has an IDS `decomposition` (e.g. `⿰氵青`), `etymology` (`pictophonetic` with `semantic` and `phonetic` parts, `ideographic`, or `pictographic`, plus an English `hint`), and `matches`, which maps each stroke to a path in the IDS tree. Our stroke shards come from the same source (hanzi-writer-data ← Make Me a Hanzi graphics), so we can **colour each component's strokes on the character**. search-wubi's own data has no licence, so we take none of it; we only add the Wubi code we already ship.

Mnemonic notes are allowed but **stay local**: they are saved in localStorage, never sent anywhere, and can be exported and imported as TSV. Add this to the CLAUDE.md hard-rule 4 wording as an explicit exception ("user-written notes may be kept in the user's own browser").

## What the page does

1. **Input:** type or paste text. Each distinct Hán character becomes a chip, and clicking a chip selects it. The selected character goes in the URL hash `#c=` (never the query string), so links can be shared and it works with the existing links from radicals and stroke-order.
2. **Coloured character:** a large SVG of the character, with the strokes of each top-level component in a different theme colour. Hovering or focusing a component in the tree highlights its strokes and dims the rest. Without stroke data, show the plain glyph.
3. **Component tree:** the IDS is parsed recursively. Each operator gets a Vietnamese structure label (⿰ "Trái – phải", ⿱ "Trên – dưới", ⿴ "Bao quanh", ⿵ ⿶ ⿷ ⿸ ⿹ ⿺ ⿻ ⿲ ⿳). Each node shows the glyph, Hán Việt reading(s), pinyin, and a **bộ thủ badge** with the Vietnamese name and meaning when the glyph is one of the 214 radicals or a variant (`radicals.json`, so 氵 → "Thủy · Nước"). Nodes expand down to strokes or unknown parts (`？` → "chưa rõ").
4. **How the character is formed** (in Vietnamese): pictophonetic → "Hình thanh: **氵** gợi nghĩa, **青** gợi âm (thanh → thanh/tình…)", ideographic → "Hội ý", pictographic → "Tượng hình". The English hint is shown in a smaller line labelled as the Make Me a Hanzi source.
5. **Character families (the "awesome" part):** for each component, "Chữ có chứa thành phần này" lists other characters that contain it anywhere in their tree (reverse index), most frequent first, with Hán Việt. For a phonetic part this is a **phonetic family** (青 → 清 請 情 晴 睛 精), and each family member is marked when it shares the reading.
6. **Your memory story** (Câu chuyện ghi nhớ): a textarea for the selected character, saved in localStorage (`hns-mnemonics`). Buttons export and import TSV (`char\tnote`) on the client. A short note says the text stays on this device.
7. **Links:** practice sheet (`#chars=…&strokes=1`) and stroke-order (`#c=`), plus the Wubi code from `wubi.json`. Add a "Phân tích" link back from the radicals detail panel and the stroke-order page.

## Data build (`scripts/build-data.mjs`)

- Vendor `assets/dictionary/makemeahanzi-dictionary.txt` (pinned commit noted in its header comment or a `.source` line) and `assets/dictionary/LICENSE-lgpl-3.0.txt`.
- New `buildDecompose()` → `public/data/decompose.json`: `{ char: [ids, type?, semantic?, phonetic?, hint?] }` (compact tuples, hint optional to keep size down). Budget: under 1.5 MB raw, checked with a throw like `MAX_SHARD_BYTES`. If it is over, drop `hint` into a separate lazy file.
- `matches` goes into the **existing stroke shards** as `matches?: (number[] | null)[]`, written only when `matches.length === strokes.length` (guards against hanzi-writer-data stroke fixes). This way it lazy-loads per character with no new fetch. Extend `StrokeData` in `lib/strokes/types.ts`.
- The reverse index is **not** shipped. It is built in the browser from `decompose.json` on first use (in memory, about 10k entries, fast).
- Validate during the build: every IDS parses, count characters with `？`, and log the coverage against `char_hanviet.csv`.

## Code layout

- `lib/decompose/types.ts`: `IdsNode = { kind: "char", char } | { kind: "op", op, children } | { kind: "unknown" }`, `Etymology`.
- `lib/decompose/ids.ts`: `parseIds(str)` (operator arity: ⿲ ⿳ = 3, others 2; `Array.from` for non-BMP), `expandTree(char, data, depth)`, `componentsOf(char)` (set of all descendant glyphs).
- `lib/decompose/strokes.ts`: `strokeGroups(matches, topLevelCount)` → stroke index → component index, and `strokesForPath(matches, path)` for highlighting a deeper node.
- `lib/decompose/family.ts`: `buildReverseIndex(data)`, `familyOf(component, index, freq)`, with frequency from the `char_hanviet.csv` order already in `hanviet.json` (check the actual field when implementing).
- `lib/decompose/notes.ts`: localStorage read and write with try/catch, plus `notesToTsv` and `parseNotesTsv`. Follow the pattern in `lib/theme.ts` and `app/tools/practice-sheet/page.tsx:98`.
- `lib/decompose/load.ts`: memoised fetch, like `lib/radicals/load.ts`.
- `components/decompose/`: `ColoredGlyph.tsx` (reuses `strokeTransform` from `lib/strokes/render.ts`), `ComponentTree.tsx`, `FamilyList.tsx`, `NotesBox.tsx`.
- `app/tools/decompose/page.tsx`: `"use client"`, same shell as `app/tools/radicals/page.tsx` (Navbar, Footer, `card`). It loads `decompose.json`, `hanviet.json`, `radicals.json` and `wubi.json` lazily, and the stroke shard per character through `loadStrokes`.
- Component colours: a small palette made from theme tokens (`brand-*` plus 3–4 fixed accent CSS variables added to `app/globals.css` with light and dark values). No raw hex in components.

## Wiring and docs

- `lib/links.ts`: add `decompose` to `ToolId` and `TOOLS` (after `radicals`). Update `lib/links.test.ts` if it counts tools.
- `lib/i18n/vi.ts`: a `decompose` section and `nav.decompose` / feature card text.
- Credits on the page and in the footer or credits area: "Phân tách thành phần: Make Me a Hanzi (LGPL-3.0)". Add the data credits line to CLAUDE.md.
- `userguide/decompose.md` (Vietnamese, exact labels, "Lỗi thường gặp": character not covered, `？` parts, notes lost after clearing browser data, export notes first) and the README index.
- CLAUDE.md tools table, roadmap row 9.

## Tests (Vitest)

- `lib/decompose/ids.test.ts`: parse `⿰氵青`, the 3-ary `⿲`, nested trees, `？`, a non-BMP component, malformed input throws.
- `strokes.test.ts`: real `清` data from the built files. Stroke groups cover all strokes, and a deeper path picks a subset.
- `family.test.ts`: 青's family includes 清 and 晴, sorted by frequency, and excludes 青 itself.
- `notes.test.ts`: TSV round trip with tabs and newlines escaped.
- No Python original exists, so no golden tests are needed. Spot-check fixtures against `dictionary.txt` lines.

## Verification

1. `pnpm build:data` → check the size of `decompose.json` and that the shards gained `matches`. Commit the output.
2. `pnpm test`, `pnpm run lint`, `pnpm run build` all pass.
3. `pnpm run dev` → `/tools/decompose#c=清`: the colours split 氵 and 青, hovering highlights the right strokes, the tree shows "Thủy" on 氵, it reads "Hình thanh", and the 青 family is listed. Try 意 (nested ⿱), 國 (⿴), a character outside coverage (a friendly message), a note kept after reload, and TSV export and import.
4. Check dark mode and a second accent through the ThemePicker. At phone width, check there is no horizontal scroll.
