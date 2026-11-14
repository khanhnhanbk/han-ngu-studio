# Đo tốc độ: fonts-truoc (2026-11-14)

- Trang: http://localhost:3200/
- Đo từ: máy của chủ dự án; bản main (be25ccb) build và chạy tại máy bằng pnpm start
- Số lần mỗi phép đo: 3 (bảng ghi trung vị)
- Trình duyệt: Google Chrome 157.0.8103.78; Lighthouse 13.6.0, Playwright 1.64.1
- Lệnh: `pnpm perf --url http://localhost:3200 --label fonts-truoc --runs 3 --where "máy của chủ dự án; bản main (be25ccb) build và chạy tại máy bằng pnpm start"`

**Đạt 20/34 mục tiêu** (tải trang di động: TTFB, FCP, LCP, CLS; luồng: lần đầu).

## Tải trang: Lighthouse di động

Giả lập mặc định của Lighthouse (4G chậm, CPU chậm 4 lần). TTFB là số đo thật từ máy này tới Vercel; FCP, LCP, TBT là số Lighthouse ước tính cho máy chậm.

| Trang | Điểm | TTFB ≤0.8 s | FCP ≤1.8 s | LCP ≤2.5 s | TBT (≈INP) ≤200 ms | CLS ≤0.1 | Tổng tải |
|---|---:|---|---|---|---|---|---:|
| `/` | 70 | 0.01 s ✅ | 2.41 s ❌ | 7.56 s ❌ | 218 ms ❌ | 0.000 ✅ | 1.03 MB |
| `/lesson` | 57 | 0.00 s ✅ | 3.01 s ❌ | 3.01 s ❌ | 519 ms ❌ | 0.420 ❌ | 2.65 MB |
| `/tools/reader` | 87 | 0.01 s ✅ | 2.26 s ❌ | 2.26 s ✅ | 365 ms ❌ | 0.000 ✅ | 1.20 MB |
| `/tools/anki` | 86 | 0.00 s ✅ | 2.26 s ❌ | 2.26 s ✅ | 409 ms ❌ | 0.000 ✅ | 1.00 MB |
| `/tools/stroke-order` | 79 | 0.00 s ✅ | 2.26 s ❌ | 2.26 s ✅ | 407 ms ❌ | 0.158 ❌ | 1.07 MB |
| `/tools/lookup` | 79 | 0.01 s ✅ | 2.26 s ❌ | 2.26 s ✅ | 455 ms ❌ | 0.148 ❌ | 2.95 MB |

## Tải trang: Lighthouse máy tính

Preset desktop của Lighthouse, 1 lần mỗi trang.

| Trang | Điểm | TTFB ≤0.8 s | FCP ≤1.8 s | LCP ≤2.5 s | TBT (≈INP) ≤200 ms | CLS ≤0.1 | Tổng tải |
|---|---:|---|---|---|---|---|---:|
| `/` | 100 | 0.01 s ✅ | 0.53 s ✅ | 0.53 s ✅ | 4 ms ✅ | 0.000 ✅ | 1.03 MB |
| `/lesson` | 90 | 0.00 s ✅ | 0.61 s ✅ | 0.61 s ✅ | 152 ms ✅ | 0.158 ❌ | 2.65 MB |
| `/tools/reader` | 100 | 0.00 s ✅ | 0.49 s ✅ | 0.49 s ✅ | 28 ms ✅ | 0.000 ✅ | 1.20 MB |
| `/tools/anki` | 100 | 0.00 s ✅ | 0.49 s ✅ | 0.49 s ✅ | 14 ms ✅ | 0.000 ✅ | 1.00 MB |
| `/tools/stroke-order` | 96 | 0.00 s ✅ | 0.49 s ✅ | 0.49 s ✅ | 13 ms ✅ | 0.126 ❌ | 1.07 MB |
| `/tools/lookup` | 92 | 0.00 s ✅ | 0.49 s ✅ | 0.49 s ✅ | 23 ms ✅ | 0.175 ❌ | 2.95 MB |

## Thời gian ra kết quả

Playwright + Chromium giả lập điện thoại tầm trung (Pixel 7, CPU chậm 4 lần, mạng 9 Mbps xuống, 1.5 Mbps lên, 60 ms RTT). Đo trong trang, từ lúc bấm/dán tới khung hình đầu tiên có kết quả. **Lần đầu** = trình duyệt mới (chưa có cache, chưa lưu gì); **lần sau** = mở lại trang trong cùng trình duyệt.

| Luồng | Mục tiêu | Lần đầu (cold) | Lần sau (warm) | Ghi chú |
|---|---|---|---|---|
| **A** Trang chủ → bấm Soạn bài → ô dán sẵn sàng | ≤2.50 s | 1.70 s ✅ | 1.52 s ✅ | link “Mở Soạn bài” |
| **B1** Soạn bài: dán cả bài ~30 từ → bảng từ đầy đủ | ≤1.00 s | 1.80 s ❌ | 95 ms ✅ | 30 rows |
| **B2** Soạn bài: Lấy từ trong đoạn văn → danh sách từ | ≤1.00 s | 1.16 s ❌ | 533 ms ✅ | 44 words |
| **B3** Soạn bài: tải .pptx mẫu “Ba trang mỗi từ”, 20 từ | ≤3.00 s | 1.74 s ✅ | 1.25 s ✅ | Bài 2.pptx 103 KB |
| **B4** Soạn bài: tải .apkg 20 từ, có giọng đọc, không ảnh | ≤5.00 s | 2.39 s ✅ | 1.56 s ✅ | Tiếng Trung.apkg 96 KB; “Tạo bộ thẻ” before it took 1111 ms |
| **B5** Soạn bài: Phiếu tập viết 20 chữ → hộp thoại in | ≤3.00 s | 911 ms ✅ | 682 ms ✅ | from opening the tab; print button ready after 531 ms |
| **C** Đọc hiểu: 300 chữ → tô màu HSK xong | ≤1.50 s | 2.31 s ❌ | 1.32 s ✅ | 199 words |
| **C·chạm** chạm một từ → thẻ từ hiện ra | ≤200 ms | 192 ms ✅ | 157 ms ✅ | gần với INP |
| **D** Tra từ: tra một từ → kết quả | ≤1.00 s | 327 ms ✅ | 206 ms ✅ | 商店 |
| **E** Thứ tự nét: tra một chữ → hoạt hình bắt đầu | ≤1.00 s | 204 ms ✅ | 199 ms ✅ | 爱 (Hanzi Writer drawing created, animateCharacter called) |

## Request lớn nhất (Lighthouse di động)

| Trang | 5 request lớn nhất (đã nén khi truyền) |
|---|---|
| `/` | `/_next/static/css/7a7c0bb88a47efed.css` 106 KB<br>`/_next/static/css/1cf0585ed5cf773a.css` 95 KB<br>`/_next/static/media/813bad2a6b150288-s.woff2` 59 KB<br>`/_next/static/media/85875d38a77d6c5a-s.woff2` 57 KB<br>`/_next/static/media/48cb14b31e36bddf-s.woff2` 57 KB |
| `/lesson` | `/data/word_list.txt` 534 KB<br>`/data/meanings.json` 382 KB<br>`/data/vocab.json` 304 KB<br>`/_next/static/chunks/05417924-e6bcbb6ebf0b127c.js` 139 KB<br>`/_next/static/css/7a7c0bb88a47efed.css` 106 KB |
| `/tools/reader` | `/_next/static/chunks/05417924-e6bcbb6ebf0b127c.js` 139 KB<br>`/_next/static/css/7a7c0bb88a47efed.css` 106 KB<br>`/_next/static/css/1cf0585ed5cf773a.css` 95 KB<br>`/_next/static/media/a8f0efcf6bdce55a-s.woff2` 75 KB<br>`/_next/static/media/85875d38a77d6c5a-s.woff2` 57 KB |
| `/tools/anki` | `/_next/static/chunks/05417924-e6bcbb6ebf0b127c.js` 139 KB<br>`/_next/static/css/7a7c0bb88a47efed.css` 106 KB<br>`/_next/static/css/1cf0585ed5cf773a.css` 95 KB<br>`/_next/static/media/48cb14b31e36bddf-s.woff2` 57 KB<br>`/_next/static/media/ce56f69dbe28e9d5-s.woff2` 55 KB |
| `/tools/stroke-order` | `/_next/static/chunks/05417924-e6bcbb6ebf0b127c.js` 139 KB<br>`/_next/static/css/7a7c0bb88a47efed.css` 106 KB<br>`/_next/static/css/1cf0585ed5cf773a.css` 95 KB<br>`/data/hanviet.json` 75 KB<br>`/_next/static/media/48cb14b31e36bddf-s.woff2` 57 KB |
| `/tools/lookup` | `/data/word_list.txt` 534 KB<br>`/data/meanings.json` 382 KB<br>`/data/examples/7-9.json` 354 KB<br>`/data/vocab.json` 304 KB<br>`/_next/static/chunks/05417924-e6bcbb6ebf0b127c.js` 139 KB |

Số liệu đầy đủ từng lần chạy: file `.json` cùng tên.
