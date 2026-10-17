# N+1 sentence ordering: review fixes, statistics, "Quá nhiều từ mới" explanation

## Context

myADE built `/tools/comprehensible-input` across five PRs (now on `origin/main`, f90d71d). On review, the on-screen ordering matches the Python script, but:

- the TSV export doesn't match the script: the `idx` column holds the output row number instead of the original line number, and `new_words` is joined with a space instead of `,`
- the summary merges the 0-new and 2+-new rows into "câu cần chú ý" instead of counting 0, 1 and 2+ separately
- the word filter includes `\p{M}`, which Python's `\w` does not match (the test even expects `"é"` to match)
- `parseSentences`/`parseKnownWords` split only on `\r?\n`; Python text-mode file iteration also treats a lone `\r` as a line break
- there is no user guide page

The owner also asked for two additions:

1. A statistics block: total new words and average new words per sentence, among others.
2. An explanation of "Quá nhiều từ mới" so users understand why a row is flagged and what to do next.

## Step 0: sync

Local `main` is 5 commits behind. Run `git pull --ff-only origin main`. The local `.gitignore` edit and `.agent/` are not touched by those commits.

## Fixes

1. **TSV matches the script** (`lib/comprehensible-input/tsv.ts`)
   - `TsvRow` gets an `idx: number` field, written as-is (the original 0-based line number, like `sentence["id"]` in Python). Remove the "idx is derived" comment.
   - Join `newWords` arrays with `","` (Python `",".join(sorted(...))`).
   - Update `tsv.test.ts`: real idx values like `7` and `2`, plus `爱,你`.
2. **0-based line index** (`lib/comprehensible-input/words.ts`, `types.ts`)
   - `parseSentences` stores `idx: i` (Python `enumerate`), and the doc comments are updated.
   - The page shows a human line number: `dict.originalLine(line + 1)`. The TSV uses `line` (0-based, as the script does).
   - Split lines on `/\r\n|\r|\n/` in both `parseSentences` and `parseKnownWords`, with a comment about Python's universal newlines.
3. **Python `\w`** (`words.ts`)
   - Regex becomes `/^[一-鿿\p{L}\p{N}_]+$/u`. Rewrite the header comment: Python `\w` = `str.isalnum()` + `_` = L*, Nd/Nl/No and `_`; combining marks are not included.
   - In `words.test.ts`, move the decomposed `"é"` (e + U+0301) to the reject list and keep the precomposed `"é"` as accepted.
4. **Page wiring** (`app/tools/comprehensible-input/page.tsx`)
   - Pass `idx: r.line` to `toTsv`. Replace the single summary line with the statistics block below.

## New: statistics

- In `lib/comprehensible-input/order.ts`, extend `OrderSummary`/`summarize()` with:
  - `totalNewWords`: sum of `newCount`. It equals the distinct count, because each word is new exactly once. Keep `distinctNewWords` as the source and add a test asserting they are equal.
  - `average`: `totalNewWords / rows.length` (0 when there are no rows).
  - `maxNew`: the most new words in one row.
  - `longCount`: rows over 25 code points. Expose `LONG_THRESHOLD` and an `isLongSentence(text)` helper, and reuse it in `orderSentences`.
- Add `summarize()` cases to `order.test.ts`.
- **UI:** a small grid of stat cards above the list, using existing tokens (`card`, `bg-ink-50`, `text-ink-*`):
  - Số câu
  - Tổng từ mới
  - TB từ mới / câu (1 decimal, `toLocaleString("vi-VN")`)
  - Câu đúng 1 từ mới (n · %)
  - Câu 0 từ mới (ôn tập)
  - Câu ≥ 2 từ mới
  - Nhiều nhất trong một câu
- All labels go in `vi.ts` under `comprehensibleInput.stats`.

## New: why "Quá nhiều từ mới", and what to do

- **Notice box** (shown only when `twoPlus > 0`), above the list, in Vietnamese:
  - **Why:** the tool always takes the easiest remaining sentence first. A sentence is flagged once no remaining sentence adds just one new word. The ones left bring 2 or more new words at once. Long sentences (more than 25 characters) are always put at the end.
  - **What to do:**
    1. Learn the listed words first, add them to **Từ đã biết**, and click **Sắp xếp** again.
    2. Add simpler sentences that contain those words. Each one becomes a step before the hard sentence.
    3. Split a long sentence into shorter ones.
- **Per row:** give the badges a `title` tooltip with a short reason, e.g. "Câu này thêm 3 từ mới cùng lúc vì không còn câu nào chỉ thêm 1 từ mới." For 0-new rows: "Mọi từ trong câu đều đã biết: dùng để ôn tập." For long rows, add an extra small "Câu dài" chip with the same explanation.
- The new strings go in `vi.ts` as `manyNotice` (title plus list items), `flagManyHint(n)`, `flagZeroHint` and `flagLong`.

## User guide

- New `userguide/comprehensible-input.md`, following the format of `userguide/segment.md`:
  - open the tool, then the steps quoting the exact labels from `vi.ts`
  - how to read a row (Dòng gốc, Từ mới, badges)
  - the statistics block
  - the "Quá nhiều từ mới" section
  - the TSV columns (`idx` = 0-based original line)
  - a "Lỗi thường gặp" table: empty input, load failure, many flagged rows, a wrongly segmented word
- Add a row to the table in `userguide/README.md`, and add the tool to its "dictionary download" tip.

## Verification

- Run `pnpm test`, `pnpm run lint` and `pnpm run build`; all must pass.
- Run `pnpm run dev` and open `/tools/comprehensible-input`:
  - Paste the 107 sentences and known words; the order stays the same as before (only the TSV and display change).
  - The stats show 107 câu, 330 từ mới, TB ≈ 3.1.
  - The notice box appears and the tooltips work.
  - Check dark mode and another accent.
- Download the TSV:
  - `idx` holds original line numbers (0-based, not 0..106 in order).
  - `new_words` is comma-separated.
  - The file has a BOM.
- Optional, by the owner: run the Python script on the same input and `diff` it with the TSV.

## Commit

Commit on `main` (no PR), one commit per part: fixes, stats, explanation, user guide. Ask before pushing, since a push deploys to Vercel.

---

# Follow-up (2026-10-17): show only the first N rows

## Context

With 1,907 sentences the page renders every row, so the result is far too long. The owner wants the page to show only the first rows (100 by default, or a number the user picks) and to leave the full list to the TSV download.

## Approach

All in `app/tools/comprehensible-input/page.tsx` and `lib/i18n/vi.ts`. The ordering, statistics and TSV keep using all rows.

- Add a constant `SHOW_OPTIONS = [50, 100, 200, 500] as const` and state `const [limit, setLimit] = useState(100)`. There is no "show all" option on purpose: the full list goes through the download.
- Render `rows.slice(0, limit)` in the `<ol>`. The numbering is unchanged (`i + 1`), because the visible rows are always the first ones.
- **Statistics and notice:** still use `summarize(rows)` over all rows.
- **Show control:** above the list, after the notice, a `<label>` + `<select>` in the same style as the selects on `app/tools/pinyin/page.tsx` (`rounded-lg border border-ink-900/10 px-3 py-2`). The select is labelled "Hiện" and its options read "50 câu đầu", "100 câu đầu", and so on. It only appears when `rows.length > 50`.
- **Truncation note:** when `rows.length > limit`, show a line under the list: "Đang hiện {limit} / {total} câu đầu tiên. Tải sentence_sorted.tsv để xem toàn bộ danh sách.", followed by a second download button that reuses `handleDownload`.
- **New `vi.ts` strings** under `comprehensibleInput`:
  - `showLabel: "Hiện"`
  - `showOption: (n) => \`${n} câu đầu\``
  - `truncated: (shown, total) => …`
- **User guide:** in `userguide/comprehensible-input.md`, add a step for the **Hiện** selector and explain that the full list is in the TSV.

## Verification

- `pnpm test`, `pnpm run lint` and `pnpm run build` pass.
- Run `pnpm run dev`:
  - With more than 100 sentences, only 100 rows show, the statistics still count every sentence, and the truncation note and download button appear.
  - Choosing 500 shows more rows.
  - The downloaded TSV has every row.
  - With fewer than 50 sentences, no selector or note appears.
- Commit on `main`, push, and check the Vercel status.
