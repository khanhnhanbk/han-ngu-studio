# Chữ Hán làm biểu tượng trên thẻ công cụ (việc 6)

12/11/2026, việc 6 trong kế hoạch "6 việc ưu tiên 1" học từ tinhtiemxan.com.

## Làm gì

- `components/ToolCard.tsx`: thay icon SVG động trong ô `bg-brand-50` bằng một chữ Hán (font `hanzi`, `text-2xl`, `text-brand-700`). Ô giữ nguyên 44 × 44 px, cùng màu, cùng chỗ cho mọi thẻ, nên các thẻ cùng hàng vẫn thẳng nhau.
- Bảng chữ ở `lib/tool-glyphs/glyphs.ts` (việc 4, ảnh xem trước từng công cụ, dùng lại bảng này):
  路 lộ trình · 笔/筆 thứ tự nét · 拆 chiết tự · 部 bộ thủ · 写/寫 phiếu tập viết · 读/讀 đọc hiểu · 故 truyện · 拼 pinyin · 越 Hán Việt · 分 ngắt từ · 查 tra từ · 卡 Anki · 考 trắc nghiệm · 句 câu N+1.
- Giản/Phồn: bản phồn thể để sẵn trong bảng; thẻ in cả hai, CSS theo `<html data-script="trad">` (đặt trước lần vẽ đầu) chỉ hiện một. Không tải OpenCC, không nháy chữ khi tải trang. `glyphs.test.ts` so từng chữ phồn với OpenCC cn→tw.
- Giữ hiệu ứng mũi tên khi rê chuột hoặc focus thẻ. Chữ Hán là trang trí (`aria-hidden`), tên thẻ vẫn là tiêu đề.
- Các file icon không còn dùng ở `components/icons/` để nguyên (chưa xóa khi chủ repo chưa đồng ý); bundler bỏ qua file không import.
