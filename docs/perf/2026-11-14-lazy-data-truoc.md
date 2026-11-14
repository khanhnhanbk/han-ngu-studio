# Đo tốc độ: lazy-data-truoc (2026-11-14)

- Trang: http://localhost:3200/
- Đo từ: máy của chủ dự án; main 8353d01 build và chạy tại máy bằng pnpm start
- Số lần mỗi phép đo: 3 (bảng ghi trung vị)
- Trình duyệt: Google Chrome 157.0.8103.78; Lighthouse 13.6.0, Playwright 1.64.1
- Lệnh: `pnpm perf --url http://localhost:3200 --label lazy-data-truoc --runs 3 --pages /lesson,/tools/lookup,/tools/reader --flows A,B1,B2,C,D --where "máy của chủ dự án; main 8353d01 build và chạy tại máy bằng pnpm start"`

**Đạt 11/18 mục tiêu** (tải trang di động: TTFB, FCP, LCP, CLS; luồng: lần đầu).

## Tải trang: Lighthouse di động

Giả lập mặc định của Lighthouse (4G chậm, CPU chậm 4 lần). TTFB là số đo thật từ máy này tới Vercel; FCP, LCP, TBT là số Lighthouse ước tính cho máy chậm.

| Trang | Điểm | TTFB ≤0.8 s | FCP ≤1.8 s | LCP ≤2.5 s | TBT (≈INP) ≤200 ms | CLS ≤0.1 | Tổng tải |
|---|---:|---|---|---|---|---|---:|
| `/lesson` | 44 | 0.01 s ✅ | 2.44 s ❌ | 2.45 s ✅ | 5.16 s ❌ | 0.420 ❌ | 2.55 MB |
| `/tools/lookup` | 64 | 0.01 s ✅ | 1.52 s ✅ | 1.52 s ✅ | 3.30 s ❌ | 0.148 ❌ | 2.79 MB |
| `/tools/reader` | 77 | 0.01 s ✅ | 1.52 s ✅ | 1.52 s ✅ | 1.05 s ❌ | 0.000 ✅ | 1.04 MB |

## Tải trang: Lighthouse máy tính

Preset desktop của Lighthouse, 1 lần mỗi trang.

| Trang | Điểm | TTFB ≤0.8 s | FCP ≤1.8 s | LCP ≤2.5 s | TBT (≈INP) ≤200 ms | CLS ≤0.1 | Tổng tải |
|---|---:|---|---|---|---|---|---:|
| `/lesson` | 84 | 0.00 s ✅ | 0.54 s ✅ | 0.54 s ✅ | 250 ms ❌ | 0.158 ❌ | 2.55 MB |
| `/tools/lookup` | 87 | 0.01 s ✅ | 0.37 s ✅ | 0.37 s ✅ | 187 ms ✅ | 0.175 ❌ | 2.81 MB |
| `/tools/reader` | 100 | 0.00 s ✅ | 0.38 s ✅ | 0.38 s ✅ | 49 ms ✅ | 0.000 ✅ | 1.04 MB |

## Thời gian ra kết quả

Playwright + Chromium giả lập điện thoại tầm trung (Pixel 7, CPU chậm 4 lần, mạng 9 Mbps xuống, 1.5 Mbps lên, 60 ms RTT). Đo trong trang, từ lúc bấm/dán tới khung hình đầu tiên có kết quả. **Lần đầu** = trình duyệt mới (chưa có cache, chưa lưu gì); **lần sau** = mở lại trang trong cùng trình duyệt.

| Luồng | Mục tiêu | Lần đầu (cold) | Lần sau (warm) | Ghi chú |
|---|---|---|---|---|
| **A** Trang chủ → bấm Soạn bài → ô dán sẵn sàng | ≤2.50 s | 3.68 s ❌ | 3.63 s ❌ | link “Mở Soạn bài” |
| **B1** Soạn bài: dán cả bài ~30 từ → bảng từ đầy đủ | ≤1.00 s | 1.75 s ❌ | 96 ms ✅ | 30 rows |
| **B2** Soạn bài: Lấy từ trong đoạn văn → danh sách từ | ≤1.00 s | 1.07 s ❌ | 208 ms ✅ | 44 words |
| **C** Đọc hiểu: 300 chữ → tô màu HSK xong | ≤1.50 s | 2.17 s ❌ | 1.24 s ✅ | 199 words |
| **C·chạm** chạm một từ → thẻ từ hiện ra | ≤200 ms | 166 ms ✅ | 142 ms ✅ | gần với INP |
| **D** Tra từ: tra một từ → kết quả | ≤1.00 s | 321 ms ✅ | 191 ms ✅ | 商店 |

## Request lớn nhất (Lighthouse di động)

| Trang | 5 request lớn nhất (đã nén khi truyền) |
|---|---|
| `/lesson` | `/data/word_list.txt` 534 KB<br>`/data/meanings.json` 382 KB<br>`/data/vocab.json` 304 KB<br>`/_next/static/chunks/b57066aa-5e6b3ac6c1f46285.js` 139 KB<br>`/data/wubi.json` 104 KB |
| `/tools/lookup` | `/data/word_list.txt` 534 KB<br>`/data/meanings.json` 382 KB<br>`/data/examples/7-9.json` 354 KB<br>`/data/vocab.json` 304 KB<br>`/_next/static/chunks/b57066aa-5e6b3ac6c1f46285.js` 139 KB |
| `/tools/reader` | `/_next/static/chunks/b57066aa-5e6b3ac6c1f46285.js` 139 KB<br>`/_next/static/css/16c761503d6532c9.css` 95 KB<br>`/_next/static/media/a8f0efcf6bdce55a-s.woff2` 75 KB<br>`/_next/static/media/85875d38a77d6c5a-s.woff2` 57 KB<br>`/_next/static/media/48cb14b31e36bddf-s.woff2` 57 KB |

Số liệu đầy đủ từng lần chạy: file `.json` cùng tên.
