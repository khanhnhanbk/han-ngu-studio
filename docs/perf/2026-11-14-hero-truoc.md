# Đo tốc độ: hero-truoc (2026-11-14)

- Trang: http://localhost:3200/
- Đo từ: máy của chủ dự án; bản main (fbfa1c1) build và chạy tại máy bằng pnpm start
- Số lần mỗi phép đo: 3 (bảng ghi trung vị)
- Trình duyệt: Google Chrome 157.0.8103.78; Lighthouse 13.6.0, Playwright 1.64.1
- Lệnh: `pnpm perf --only lighthouse --url http://localhost:3200 --label hero-truoc --runs 3 --where "máy của chủ dự án; bản main (fbfa1c1) build và chạy tại máy bằng pnpm start"`

**Đạt 20/24 mục tiêu** (tải trang di động: TTFB, FCP, LCP, CLS; luồng: lần đầu).

## Tải trang: Lighthouse di động

Giả lập mặc định của Lighthouse (4G chậm, CPU chậm 4 lần). TTFB là số đo thật từ máy này tới Vercel; FCP, LCP, TBT là số Lighthouse ước tính cho máy chậm.

| Trang | Điểm | TTFB ≤0.8 s | FCP ≤1.8 s | LCP ≤2.5 s | TBT (≈INP) ≤200 ms | CLS ≤0.1 | Tổng tải |
|---|---:|---|---|---|---|---|---:|
| `/` | 70 | 0.01 s ✅ | 1.51 s ✅ | 6.92 s ❌ | 286 ms ❌ | 0.000 ✅ | 908 KB |
| `/lesson` | 62 | 0.00 s ✅ | 2.41 s ❌ | 2.41 s ✅ | 540 ms ❌ | 0.420 ❌ | 2.55 MB |
| `/tools/reader` | 88 | 0.00 s ✅ | 1.36 s ✅ | 1.36 s ✅ | 461 ms ❌ | 0.000 ✅ | 1.04 MB |
| `/tools/anki` | 89 | 0.01 s ✅ | 1.36 s ✅ | 1.36 s ✅ | 424 ms ❌ | 0.000 ✅ | 859 KB |
| `/tools/stroke-order` | 85 | 0.01 s ✅ | 1.36 s ✅ | 1.36 s ✅ | 585 ms ❌ | 0.000 ✅ | 924 KB |
| `/tools/lookup` | 70 | 0.00 s ✅ | 1.36 s ✅ | 1.36 s ✅ | 1.22 s ❌ | 0.148 ❌ | 2.78 MB |

## Tải trang: Lighthouse máy tính

Preset desktop của Lighthouse, 1 lần mỗi trang.

| Trang | Điểm | TTFB ≤0.8 s | FCP ≤1.8 s | LCP ≤2.5 s | TBT (≈INP) ≤200 ms | CLS ≤0.1 | Tổng tải |
|---|---:|---|---|---|---|---|---:|
| `/` | 100 | 0.01 s ✅ | 0.41 s ✅ | 0.41 s ✅ | 6 ms ✅ | 0.000 ✅ | 884 KB |
| `/lesson` | 93 | 0.00 s ✅ | 0.53 s ✅ | 0.53 s ✅ | 22 ms ✅ | 0.158 ❌ | 2.55 MB |
| `/tools/reader` | 100 | 0.00 s ✅ | 0.37 s ✅ | 0.37 s ✅ | 51 ms ✅ | 0.000 ✅ | 1.04 MB |
| `/tools/anki` | 99 | 0.01 s ✅ | 0.37 s ✅ | 0.37 s ✅ | 101 ms ✅ | 0.000 ✅ | 859 KB |
| `/tools/stroke-order` | 95 | 0.01 s ✅ | 0.37 s ✅ | 0.37 s ✅ | 80 ms ✅ | 0.126 ❌ | 948 KB |
| `/tools/lookup` | 80 | 0.01 s ✅ | 0.38 s ✅ | 0.38 s ✅ | 293 ms ❌ | 0.175 ❌ | 2.81 MB |

## Request lớn nhất (Lighthouse di động)

| Trang | 5 request lớn nhất (đã nén khi truyền) |
|---|---|
| `/` | `/_next/static/css/16c761503d6532c9.css` 95 KB<br>`/_next/static/media/813bad2a6b150288-s.woff2` 59 KB<br>`/_next/static/media/85875d38a77d6c5a-s.woff2` 57 KB<br>`/_next/static/media/48cb14b31e36bddf-s.woff2` 57 KB<br>`/_next/static/media/c31a3550bcc5caf4-s.woff2` 56 KB |
| `/lesson` | `/data/word_list.txt` 534 KB<br>`/data/meanings.json` 382 KB<br>`/data/vocab.json` 304 KB<br>`/_next/static/chunks/05417924-e6bcbb6ebf0b127c.js` 139 KB<br>`/data/wubi.json` 104 KB |
| `/tools/reader` | `/_next/static/chunks/05417924-e6bcbb6ebf0b127c.js` 139 KB<br>`/_next/static/css/16c761503d6532c9.css` 95 KB<br>`/_next/static/media/a8f0efcf6bdce55a-s.woff2` 75 KB<br>`/_next/static/media/85875d38a77d6c5a-s.woff2` 57 KB<br>`/_next/static/media/48cb14b31e36bddf-s.woff2` 57 KB |
| `/tools/anki` | `/_next/static/chunks/05417924-e6bcbb6ebf0b127c.js` 139 KB<br>`/_next/static/css/16c761503d6532c9.css` 95 KB<br>`/_next/static/media/48cb14b31e36bddf-s.woff2` 57 KB<br>`/_next/static/media/ce56f69dbe28e9d5-s.woff2` 55 KB<br>`/_next/static/chunks/72dbdb3b-71b543b51f27f764.js` 54 KB |
| `/tools/stroke-order` | `/_next/static/chunks/05417924-e6bcbb6ebf0b127c.js` 139 KB<br>`/_next/static/css/16c761503d6532c9.css` 95 KB<br>`/data/hanviet.json` 75 KB<br>`/_next/static/media/48cb14b31e36bddf-s.woff2` 57 KB<br>`/_next/static/media/ce56f69dbe28e9d5-s.woff2` 55 KB |
| `/tools/lookup` | `/data/word_list.txt` 534 KB<br>`/data/meanings.json` 382 KB<br>`/data/examples/7-9.json` 354 KB<br>`/data/vocab.json` 304 KB<br>`/_next/static/chunks/05417924-e6bcbb6ebf0b127c.js` 139 KB |

Số liệu đầy đủ từng lần chạy: file `.json` cùng tên.
