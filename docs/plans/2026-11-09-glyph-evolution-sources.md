# Research note: licensed sources for old glyph forms (phase 12d, roadmap B1)

Date: 2026-11-09. Status: **approved by the owner on 2026-11-09** (Commons ACC, without lệ thư for now); built as described under "Proposed implementation", for the HSK 3.0 characters.

Goal of 12d: a strip per character showing its older forms, giáp cốt (oracle bone) → kim văn (bronze) → triện (seal) → lệ (clerical) → khải (regular), in Chiết tự and later in the "Nguồn gốc chữ" card (12c). HARD RULE: no data without a licence that allows redistribution, and nothing hot-linked.

## Summary

| Form | Best source found | Licence | HSK 1 coverage (300 characters) |
|---|---|---|---|
| Giáp cốt (`oracle`) | Wikimedia Commons, Ancient Chinese characters project (ACC) | Public domain (`{{PD-ancient-script}}`), 1 file CC0 | 131 |
| Kim văn (`bronze`) | ACC | Public domain, 1 file CC0 | 155 |
| Đại triện (`bigseal`) | ACC | Public domain | 175 |
| Tiểu triện (`seal`, Shuowen) | ACC | Public domain | 225 |
| Lệ thư | **none found** with an open licence | — | 0 |
| Khải thư | the site's own fonts (LXGW WenKai, Noto) | SIL OFL 1.1, already shipped | 300 |

- At least one old form: **231 / 300**. Oracle + bronze + seal together: **119 / 300**; all four ACC forms: **109 / 300**.
- No old form at all: **69 / 300**, mostly late or Simplified-only characters (你 他 她 们 吗 呢 这 谁 很 找 想 …); full list below.
- Size: ACC files are SVG, median about 3.5 KB (sample of 50, largest 7.6 KB). All 686 HSK 1 files are about 2.4 MB before minifying and gzip, so they would be split per character and loaded on demand, like the stroke shards.

## Source 1: Wikimedia Commons, Ancient Chinese characters project (recommended)

Project page: https://commons.wikimedia.org/wiki/Commons:Ancient_Chinese_characters_project

- **Files**: `File:<char>-oracle.svg`, `-bronze.svg`, `-bigseal.svg`, `-seal.svg`, named by the **Traditional** form (车 is `車-oracle.svg`). Period variants (`-oracle-zhouyuan`, `-bronze-spring`, numbered variants 2–6) also exist; this survey checked only the four main names.
- **Licence on the files**: every file is uploaded with `{{ACClicense}}`, whose licence section is `{{PD-ancient-script}}` ("This SVG representation of an ancient script is in the public domain"). Attribution is not required but asked for. Files traced from the Academia Sinica database carry CC0 1.0 instead (2 of the 686 HSK 1 files).
- **The project's own terms**: "All this work is in the public domain", with a moral request to state the source (the Commons page or the file page) and "Licence: Public Domain".
- **Origin of the shapes**: most were drawn from Richard Sears's Chinese Etymology database (hanziyuan.net), which itself copies printed reference books (續甲骨文編, 金文編, 說文解字 徐鉉 edition, 六書通). The Commons "Richard Sears Agreement" page records Sears stating that **the images are public domain**, while the GPL he mentions applies to his database schema and the way he organised it, which we would not use.
- **Survey method** (reproducible): MediaWiki API `prop=imageinfo&iiprop=extmetadata`, `LicenseShortName` for `File:<c>-{oracle,bronze,bigseal,seal}.svg`, for the 300 characters of `assets/dictionary/mnemonics.tsv`, first by the Simplified form, then by the OpenCC Traditional form for the ones not found. Result: 686 files, 684 "Public domain", 2 "CC0", 0 with any other licence.

### Risks and how to handle them

1. **Public domain is a claim on each file page, not a guarantee.** The shapes are traced copies of 2,000–3,000-year-old inscriptions, so there is no original authorship in them, but the tracings come through modern books and Sears's site. Commons accepts them under that tag (the project dates from about 2007). Mitigation: keep the per-file record (title, licence string, revision id) in a vendored manifest, credit "Wikimedia Commons, Ancient Chinese characters project" and Richard Sears on `/giay-phep` and `THIRD-PARTY-NOTICES.md`, and drop any file whose page later changes licence.
2. **Accuracy.** Each file is one drawing of one attested shape; an inscription can have many shapes, and this note did not check how representative each drawing is. The strip should say "Một dạng tiêu biểu" and link to the Commons file page for each form.
3. **Coverage is uneven.** 69 HSK 1 characters have no old form at all (many did not exist yet). The strip must handle 0–4 forms and say so honestly, never fill the gap with a made-up shape.
4. **Download at build time only.** Files are fetched once by a script (pinned revision ids), minified, and committed under `assets/` → `public/data/`; the site never loads anything from Commons (HARD RULES 2 and 5).

## Source 2: Academia Sinica 小學堂 (xiaoxue.iis.sinica.edu.tw)

The ACC template says images from the Sinica database are CC0 1.0 and points to https://xiaoxue.iis.sinica.edu.tw/License. Not checked further in this note: it would need its own review of the licence page and of whether bulk download is allowed. Worth a look only if ACC coverage is not enough.

## Sources ruled out

- **hanziyuan.net (Richard Sears) directly**: the database as a whole is not openly licensed (GPL claim on the schema, site terms). Use the Commons copies instead.
- **zi.tools, 國學大師, 漢典 and similar dictionary sites**: no redistribution licence; scraping is against the project's rules.
- **Lệ thư (clerical) fonts**: no font with an open licence (OFL or similar) was found in this search. Free-to-use fonts exist, but "free for personal use" is not enough to self-host them. If the owner wants a lệ form, the next step is a targeted search of Chinese open-font projects; until then the strip skips lệ.

## Proposed implementation (only after approval)

- `scripts/fetch-acc.mjs` (one-off, like `build-audio.mjs`): for the characters in `decompose.json`, query the four main ACC names (Simplified, then Traditional), keep only files whose licence is "Public domain" or "CC0", save SVG + `{ title, licence, revid }` to `assets/ancient/` with a manifest.
- `pnpm build:data`: minify into per-character JSON shards in `public/data/ancient/`, listed in `sizes.json`.
- Chiết tự: a row "Giáp cốt · Kim văn · Đại triện · Tiểu triện · Khải" under the glyph, only the forms we have, each with a link to its Commons page; Khải uses the site font.
- Credits on `/giay-phep`, `THIRD-PARTY-NOTICES.md`, the user guide and the tool page.

## Decision needed from the owner

1. Approve Wikimedia Commons ACC (public domain + CC0) as the source for old glyph forms? If yes, 12d can be built as above; if no, 12d falls back to "Khải only + a link to the Commons page".
2. Show the strip without lệ thư for now (recommended), or wait for a lệ font search first?

## HSK 1 characters with no ACC file

忙 帮 吧 爸 病 杯 茶 穿 站 等 错 影 脑 第 店 净 关 跟 哥 诉 孩 蛋 场 答 很 绍 楼 住 快 课 试 玩 妈 累 们 慢 吗 你 呢 难 奶 哪 钱 跑 您 谁 认 候 晚 太 她 他 送 谢 想 现 欢 洗 爷 息 着 这 找 怎 样 条 做 桌 准
