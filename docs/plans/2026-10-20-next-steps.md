# Next steps after the Anki .apkg export and suggested memory stories — 2026-10-20

## Shipped

- **Pronunciation switch in the Navbar** (41ee09e) and **simpler Navbar with one ⚙ settings menu** (36c3095).
- **Anki .apkg export** (4c1c628): one file with deck + note type "Hán Ngữ Studio" + 4 templates; TSV stays.
- **Suggested memory stories ("Mẹo nhớ gợi ý") in Chiết tự**: 300 HSK 1 characters, all `draft` (labelled "gợi ý, chưa kiểm duyệt"). Content in `assets/dictionary/mnemonics.tsv`, checked by `scripts/lib/mnemonics.mjs`.

## TODO

### 1. Review the HSK 1 memory stories (owner)
- Read `assets/dictionary/mnemonics.tsv`; edit a story or set `status` to `reviewed`, then `pnpm build:data` and commit `public/data/mnemonics.json`.
- Look first at the stories built on graphic-only splits: 车 东 年 南 师 气 页 树 条 用 前 商.

### 2. Write HSK 2 and HSK 3 memory stories (Claude, after step 1)
- 300 + 300 characters (HSK 3.0 levels 2 and 3), same rules: real parts from `decompose.json`, Hán Việt, sound part named honestly, ≤ 160 chars, `draft`.
- Apply what the owner changed in step 1 (tone, length, wording).
- Update the "Không thấy Mẹo nhớ gợi ý" row in `userguide/decompose.md` (currently says HSK 1 only).

### 3. Test the .apkg file in real apps (owner)
- Download a deck from the live site; import in Anki desktop and AnkiDroid; check card looks (light/night), 2–3 example lines, Phồn thể, re-import.

### 4. Story reader "Truyện" (next feature, needs its own plan)
- Short modern stories by HSK level (gọi món, thuê nhà, đi tàu, WeChat Pay, thành ngữ dùng ngày nay), each teaching 5–8 new words + a short culture note.
- Opens in Đọc hiểu (HSK colours, tap-a-word card, study list → Anki / Quiz).
- Content: Claude drafts offline, owner reviews (same "gợi ý" label until reviewed). No runtime AI.

### Later ideas (from the Anki journey map)
- Voice recordings (audio-cmn) inside the .apkg cards.
- Word picker in Tạo thẻ Anki: "add all words of HSK level N", skip words marked known in Đọc hiểu.
- Memory story as an extra field in the Anki cards.
