# FAQ cho thầy cô + dữ liệu FAQPage cho Google

12/11/2026, việc 5 trong kế hoạch 6 việc học từ tinhtiemxan.com.

## Làm gì

- `faq.items` trong `lib/i18n/vi.ts` / `en.ts`:
  - Thêm 3 câu cho thầy cô: "Dùng file Word có sẵn được không?" (Soạn bài nhận .docx hoặc dán cả bài), "Học viên có cần tạo tài khoản hay cài gì không?" (thay câu "cần cài phần mềm gì không"), "In ra giấy có đẹp không?" (phiếu tập viết dựng đúng A4; bảng từ và đề trắc nghiệm A4 lề 15 mm).
  - Sửa câu cũ: file Anki giờ là .apkg (vẫn có TSV); "Dữ liệu có được lưu không" nói rõ bài soạn, từ đã biết, chữ đã học được lưu trong trình duyệt trên máy, không gửi đi (đúng luật 4); "Hướng dẫn ở đâu" chỉ thêm trang /guide.
- `components/FAQ.tsx`: thêm `<script type="application/ld+json">` kiểu FAQPage, lấy đúng câu hỏi/đáp của ngôn ngữ trang (`/` tiếng Việt, `/en` tiếng Anh). Escape `<` để chữ không đóng thẻ script.

## Không làm

- Không thêm tính năng, không đổi giao diện thẻ câu hỏi.
- Không ghi số liệu hay nhận xét không có thật.

## Kiểm tra

- `pnpm run build`, `pnpm run lint`, `pnpm test`.
- Đọc JSON-LD trong HTML của `/` và `/en`, so số câu với số thẻ trên trang.
- Ảnh chụp sáng, tối, màu nhấn khác, điện thoại 390 px.
