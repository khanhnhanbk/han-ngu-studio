# Phase 12: "Hiểu chữ" (remember a character by understanding it)

## Context

The owner saw a Facebook ad for a paid online class that teaches Hán characters by explaining them. Its pitch:

- It names the learner's fear: "không nhớ chữ, không viết được chữ, không hiểu chữ Hán".
- It promises **"nhớ chữ bằng việc hiểu chữ"**.
- It targets three groups at once: learners of Chinese, learners of Japanese, and people reading Hán Nôm or Buddhist texts (kinh sách).
- Per character it covers: components and what each means; why they combine into that character; which formation principle (lục thư); the original meaning; today's meanings and why they grew from it; links between characters; an origin-based chiết tự; Phồn thể, Giản thể, and the Japanese form.
- Two levels: 1000 basic characters, then 2000. Two free trial sessions.

Hán Ngữ Studio already covers part of this. Chiết tự (`/tools/decompose`) shows the component tree, Hình thanh / Hội ý / Tượng hình, component families, and draft "Mẹo nhớ gợi ý" for HSK 1. Phồn thể is a site-wide switch. What is missing is the **story of the character** (origin, old forms, meaning growth), the **Japanese form**, an honest line between **etymology and mnemonic**, and a **guided path** through the first 1000 characters.

The site stays free, so the "free trial" idea does not apply. The equivalent is a landing section that speaks to the same fear and shows one character explained end to end.

## Goals

1. On `/tools/decompose`, each character can show a **"Nguồn gốc chữ"** card: lục thư type, original meaning, how today's meanings grew from it, and old glyph forms where we have licensed data.
2. Show the **Japanese form** (shinjitai) beside Giản thể and Phồn thể when it differs.
3. Mark every explanation as **"Chiết tự theo nguồn gốc"** (etymology, sourced) or **"Mẹo nhớ"** (mnemonic, invented to help memory). Never present a mnemonic as history.
4. A **"Lộ trình 1000 chữ"** path: characters ordered so components come before the characters built from them, split into stages of about 100, each stage exportable as an Anki deck.
5. A landing section and page copy that frame the site as "nhớ chữ bằng hiểu chữ", for Chinese, Japanese, and Hán Nôm learners.

## Non-goals

- No backend, accounts, or progress sync (HARD RULES 1, 2). Stage progress stays in localStorage like known words.
- No scraped content. Every new data source needs a licence that allows redistribution, recorded in `THIRD-PARTY-NOTICES.md` and `/giay-phep`.
- No live classes or video.

## Work items

### 12a. Etymology vs mnemonic label (small, do first)

- `mnemonics.tsv` gets a `kind` column: `goc` (origin-based, must cite a source in a `source` column) or `meo` (mnemonic). All 300 existing HSK 1 rows become `meo` unless the owner changes them during review.
- `scripts/lib/mnemonics.mjs` checks: `kind` is one of the two; `goc` rows have a non-empty `source`.
- UI: a badge on each story, "Theo nguồn gốc" or "Mẹo nhớ", with a one-line tooltip explaining the difference. The existing "gợi ý, chưa kiểm duyệt" label stays for `draft`.
- i18n keys in `vi.ts` and `en.ts`.

### 12b. Japanese form (shinjitai)

- Data: OpenCC `JPVariants.txt` (Apache-2.0), which maps traditional characters to Japanese shinjitai (for example 國→国, 廣→広, 澤→沢). Vendor it into `assets/dictionary/` with its licence and pinned commit.
- `buildData` writes a small `public/data/jp-variants.json` (`{ trad: jp }`, only pairs where the forms differ; a few hundred entries).
- Chiết tự shows a "Giản · Phồn · Nhật" row when any of the three differ, for example 广 · 廣 · 広. Clicking a form opens it in Chiết tự.
- Out of scope: a site-wide "Nhật" script switch. Japanese readings (on/kun) also wait; KANJIDIC2 is CC BY-SA 4.0, and that share-alike licence needs a separate decision.

### 12c. "Nguồn gốc chữ" card

Content per character, stored in a new `assets/dictionary/origins.tsv`:

| column | meaning |
|---|---|
| `char` | the character (Phồn thể or Giản thể; both forms map to one row) |
| `luc_thu` | `tuong_hinh` · `chi_su` · `hoi_y` · `hinh_thanh` · `gia_ta` · `chuyen_chu` |
| `nghia_goc` | the original meaning, one line |
| `nghia_mo_rong` | today's meanings, each with a short "vì sao": `nghĩa — vì sao` entries separated by ` | ` |
| `source` | where the etymology comes from (book, Wiktionary page, Make Me a Hanzi hint) |
| `status` | `draft` / `reviewed` |

- Start with the 300 HSK 1 characters, using Make Me a Hanzi `etymology` as the base for `luc_thu` (it already gives pictographic, ideographic, or pictophonetic). Claude writes drafts; the owner reviews, the same flow as `mnemonics.tsv`.
- Make Me a Hanzi has no chỉ sự / giả tá / chuyển chú. Those are set by hand, only where a source supports it.
- The card shows a **meaning tree**: the original meaning at the root and today's meanings as branches, each branch with its "vì sao" line. Plain HTML list, no graph library.
- Checker in `scripts/lib/origins.mjs`, same style as the mnemonics checker. Built into `public/data/origins.json`.
- Every card carries a "Góp ý" link (the feedback flow from 4202cbb), because this is the content most likely to need corrections.

### 12d. Old glyph forms (giáp cốt → kim văn → triện → lệ → khải), research first

- This only ships if we find images or fonts with a licence that allows redistribution. Candidates to check: the Wikimedia Commons "Ancient Chinese characters project" (many files are public domain or CC BY-SA, so licences vary per file), and open-licence seal-script fonts.
- Deliverable for this item is a short research note (`docs/plans/…-glyph-evolution-sources.md`) listing sources, licences, and coverage of the HSK 1 set. Build the strip only after the owner approves the source.
- If nothing usable exists, show only the Khải form plus a link out to the source page (a link only, no hot-linked images).

### 12e. "Lộ trình 1000 chữ" (`/tools/lo-trinh`)

- Character set: the 1000 most frequent characters (SUBTLEX-CH ranks we already ship), with HSK 1–3 characters guaranteed in.
- Order: a topological sort over the component tree in `decompose.json`, so a component that is itself a common character (人, 口, 木, 青…) comes before the characters that contain it. Ties go by frequency. Pure logic in `lib/path/` with unit tests (the order must be stable, and every component in the set must come before its users).
- Stages of about 100 characters. Each stage page lists the characters with Hán Việt, meaning, lục thư badge, and a link to Chiết tự. Characters that share a phonetic part are grouped and shown as a family (青 → 清 晴 請 情 精), reusing the reverse index from Chiết tự.
- "Tạo thẻ Anki cho chặng này" exports the stage through the existing `.apkg` builder, with the memory story and the origin line as extra fields (this also covers the "memory story in Anki cards" idea from `2026-10-20-next-steps.md`).
- Progress: "đã học" ticks in localStorage (`hns-path-progress`), with TSV export/import like known words. Add this to the HARD RULE 4 exception list in `CLAUDE.md`.
- Stage 2 (1000 → 2000 characters) uses the same code with a larger set; content review is the bottleneck, not code.

### 12f. Landing and copy

- A landing section in three steps, written in the learner's words: *Không nhớ chữ? Không viết được? Không hiểu vì sao chữ lại viết như vậy?* → *Hiểu chữ thì nhớ chữ* → one worked example (for example 晴: 日 gives the meaning, 青 gives the sound, family 清 情 請 精) linking to Chiết tự and the Lộ trình.
- Three entry cards: "Học tiếng Trung", "Học tiếng Nhật (Kanji)", "Đọc Hán Nôm / kinh sách", each pointing to the tools that fit that goal.
- English twin under `/en`, with the copy adapted rather than translated word for word.
- Use the `vietnamese-education-copy` skill for the Vietnamese text.

## Order and sizes

| Item | Size | Depends on |
|---|---|---|
| 12a label | S | owner's mnemonic review (can ship with all rows as `meo`) |
| 12b Japanese form | S | — |
| 12c origin card (code + HSK 1 drafts) | M | owner review of drafts |
| 12e Lộ trình (code) | M | 12c is optional; the stage page shows the origin line when it exists |
| 12f landing | S | 12c and 12e live |
| 12d old glyph forms | research | owner picks a source |
| 12g share image | S–M | 12a |

Suggested order: 12a → 12g → 12b → 12c → 12e → 12f, with 12d research in parallel.

## Done when

- `pnpm run build`, `pnpm run lint`, `pnpm test` pass; new i18n keys exist in `vi.ts` and `en.ts`.
- New data sources are in `THIRD-PARTY-NOTICES.md` and `/giay-phep`.
- `userguide/decompose.md` explains the "Theo nguồn gốc" vs "Mẹo nhớ" badges and the Nguồn gốc card; a new `userguide/lo-trinh.md` covers the path.
- Every `/tools/…` page added has its `app/en/…` twin.

## Design references (Pinterest, 2026-10-29)

Searches: "chinese character etymology infographic", "oracle bone script evolution chinese character", "language learning app learning path ui", "chiết tự chữ hán". Only layout ideas are taken; no images or text are copied.

What the popular pins share, and what we take from each:

1. **One-character poster (Vietnamese, for example 富 Phú).** Layout, top to bottom: big glyph with Hán Việt and meaning; "Phân tích các bộ thủ" (each component with Hán Việt and meaning); a formula row `宀 + 口 + 田 = 富`; "Giải thích" (why the parts mean this); "Hình dung ý nghĩa" (the parts placed around the glyph); "Ví dụ" (2–3 words using it); a closing one-line saying. **Use this order for the Nguồn gốc card (12c)**, and add the formula row to Chiết tự above the tree, since the tree is harder to read at a glance.
2. **Short memory card (for example 焚 = 林 + 火).** Big glyph, components on the right as `木 mộc: gỗ, cây cối`, one-line story at the bottom. This is exactly our Mẹo nhớ content; it is the format people save and share. See 12g.
3. **Evolution rows.** A picture of the thing → giáp cốt → kim văn → triện → lệ → khải, left to right, with the oracle-bone column highlighted. A table version puts one character per row with columns per script, plus Pinyin and meaning. **Use the row layout for 12d** if a licensed source is found; on mobile, wrap to two rows of three.
4. **Radical family grid (水 → 江 河 湖 海 …).** Characters sharing a component grouped by sub-meaning ("nơi có nước", "chất lỏng", "hành động với nước"), each with Pinyin and meaning. **Use for the family lists in Chiết tự and the Lộ trình stages**: group by semantic part with a sub-meaning heading, rather than one flat list sorted by frequency.
5. **Component network graph.** Characters as nodes linked to their components. Pretty, but hard to read and heavy to render; **skip**, the grouped grid in 4 carries the same idea.
6. **Learning-path apps.** A course page with chapters as cards, each with a progress bar and a "continue" button; a streak counter; badges. **Take the chapter cards with progress bars for the Lộ trình stage list.** Skip streaks and badges: they need daily return tracking, which adds stored state for little gain.

### 12g. "Thẻ chữ" share image (new, from reference 2)

- On Chiết tự, a "Tải ảnh thẻ chữ" button renders a portrait PNG (1080×1350) in the browser with a canvas: big glyph, components with Hán Việt and meaning, the formula row, the memory story with its "Mẹo nhớ" / "Theo nguồn gốc" badge, and the site URL in small text at the bottom.
- Fonts: the same self-hosted fonts as the practice sheet, loaded before drawing (`lib/sheetFonts.ts`). No server rendering (HARD RULE 2).
- A user's own local note can go on the card only if they tick "Dùng ghi chú của tôi"; the default is the suggested story. The image is downloaded, never uploaded.
- Size S–M. Do after 12a, so the badge exists. This is the free-site version of the ad's reach: learners share the cards, and each card carries the site's address.
