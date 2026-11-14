# Đo tốc độ (`pnpm perf`)

Kịch bản trong `scripts/perf/` đo tốc độ trang web từ chính máy chạy lệnh (mạng thật của máy đó), rồi ghi kết quả vào thư mục này. Chỉ là số đo phòng thí nghiệm: không thu thập gì từ người dùng thật, không cần Vercel Speed Insights.

## Cần gì

- Đã `pnpm install` (Lighthouse, Playwright, chrome-launcher là devDependencies).
- Một Chrome hoặc Chromium đã cài trên máy. Kịch bản tự tìm; nếu không thấy thì đặt `CHROME_PATH=/đường/dẫn/tới/chrome`. Không cần `playwright install`.

## Chạy

```bash
pnpm perf --label baseline
```

Tùy chọn:

| Tùy chọn | Mặc định | Ý nghĩa |
|---|---|---|
| `--url` | `https://han-ngu-studio.vercel.app` | Trang cần đo (có thể là `http://localhost:3000` sau `pnpm build && pnpm start`, hoặc link preview của Vercel) |
| `--runs` | `3` | Số lần đo mỗi mục; bảng ghi trung vị |
| `--label` | `run` | Tên file: `docs/perf/<YYYY-MM-DD>-<label>.md` và `.json` |
| `--only` | (cả hai) | `lighthouse` hoặc `flows` để chỉ đo một phần |
| `--flows` | (tất cả) | Chỉ chạy vài luồng, ví dụ `--flows B3,B4` |
| `--out` | `docs/perf` | Thư mục ghi kết quả |
| `--where` | `máy của người chạy lệnh` | Ghi chú nơi đo (mạng, thành phố) vào báo cáo |

Cả bộ (3 lần) mất khoảng 25–40 phút.

## Đo những gì

1. **Tải trang** (Lighthouse 13, di động với giả lập mặc định, thêm 1 lần preset máy tính): `/`, `/lesson`, `/tools/reader`, `/tools/anki`, `/tools/stroke-order`, `/tools/lookup`. Điểm, TTFB, FCP, LCP, TBT, CLS, tổng dung lượng và 5 request lớn nhất.
2. **Thời gian ra kết quả** (Playwright + Chrome giả lập Pixel 7, CPU chậm 4 lần, mạng 9 Mbps xuống / 1.5 Mbps lên / 60 ms). Mỗi luồng chạy “lần đầu” (trình duyệt mới, chưa có cache) và “lần sau” (cùng trình duyệt, mở lại trang). Thời gian đo trong trang, từ lúc bấm (hoặc dán) tới khung hình đầu tiên có kết quả:

| Luồng | Việc | Mục tiêu |
|---|---|---|
| A | Trang chủ → bấm nút tới Soạn bài → ô “Dán cả bài vào đây” dùng được | ≤ 2.5 s |
| B1 | Dán cả bài (`scripts/perf/fixtures/handout.txt`, 30 từ) → bảng từ đủ 30 hàng | ≤ 1 s |
| B2 | “Lấy từ trong đoạn văn” → có thông báo đã thêm từ | ≤ 1 s |
| B3 | Slide mẫu “Ba trang mỗi từ”, 20 từ → file .pptx bắt đầu tải | ≤ 3 s |
| B4 | “Tải bộ thẻ Anki (.apkg)”, 20 từ, có giọng đọc, không ảnh → file bắt đầu tải | ≤ 5 s |
| B5 | Thẻ “Phiếu tập viết” 20 chữ → hộp thoại in được gọi (`window.print` bị thay bằng hàm ghi giờ) | ≤ 3 s |
| C | Đọc hiểu 300 chữ (`fixtures/reader.txt`) → tô màu HSK xong; chạm một từ → thẻ từ hiện | ≤ 1.5 s; chạm ≤ 200 ms |
| D | Tra từ “商店” → kết quả | ≤ 1 s |
| E | Thứ tự nét “爱” → hoạt hình bắt đầu | ≤ 1 s |

Mục tiêu tải trang: FCP ≤ 1.8 s, LCP ≤ 2.5 s, CLS ≤ 0.1, TTFB ≤ 0.8 s (ngưỡng “tốt” của Core Web Vitals). TBT được so với 200 ms như số thay cho INP trong phòng thí nghiệm.

Hộp “Tải dữ liệu?” (khi một việc cần tải hơn 2 MB) được kịch bản tự bấm “Tải xuống” ngay; báo cáo ghi lại khi có hộp này.

## Đọc kết quả

- Số Lighthouse dao động 10–20 % giữa các lần; so sánh trung vị, cùng máy, cùng mạng.
- TTFB là số đo thật tới Vercel; FCP/LCP/TBT di động là ước tính của Lighthouse cho máy chậm, nên thường xấu hơn trải nghiệm trên máy thật.
- Đo lại sau mỗi PR tăng tốc với `--label <tên-pr>` để so với `2026-11-14-baseline.md`.
