# Tiêu đề + mô tả riêng từng công cụ cho Google (SEO)

12/11/2026. Việc 3 trong 6 việc học từ tinhtiemxan.com. Một PR, tách từ `main`.

## Vấn đề

`toolMetadata` (`lib/i18n/metadata.ts`) lấy tiêu đề và mô tả trang công cụ từ thẻ ở trang chủ (`features.items`). Chữ trên thẻ ngắn, hợp để đọc lướt ("Chuyển Pinyin", "Âm Hán Việt") nhưng không phải chữ người ta gõ Google ("chuyển chữ Hán sang pinyin có dấu", "tra âm Hán Việt").

## Cách làm

- Thêm mục `seo` riêng trong `lib/i18n/vi.ts` và `en.ts` (ngay sau `meta`), mỗi công cụ một `title` + `description`, cùng khóa với `features.items`.
- `toolMetadata` đọc `seo` thay cho `features.items`; `<title>`, `description` và `openGraph` (Zalo, Facebook) dùng chung chữ này. Mọi `app/tools/*/layout.tsx`, `app/lesson/layout.tsx` và `app/en/...` đã gọi `toolMetadata` nên không phải sửa.
- Chữ trên thẻ trang chủ giữ nguyên.
- Không dùng thẻ meta keywords (Google bỏ qua).
- Luật viết: tiêu đề theo từ khóa người ta tìm, cả tên trang ≤ 67 ký tự; mô tả 120–160 ký tự; chỉ nói tính năng có thật trên giao diện (vd Anki tải .apkg).
- `lib/i18n/metadata.test.ts` kiểm tra: đủ công cụ, độ dài, và trang dùng đúng chữ `seo`.

## Ngoài phạm vi

- Ảnh xem trước riêng từng công cụ (việc 4).
- Trang `/guide` và `/tools/anki/guide` đã có `metaTitle`/`metaDescription` riêng, giữ nguyên.
