# Ô "Thử ngay" ở đầu trang chủ

12/11/2026. Việc 1 trong kế hoạch 6 việc học từ tinhtiemxan.com (mỗi việc một PR, mở song song từ `main`).

## Làm gì

Khung bên phải `components/Hero.tsx` trước là ảnh mô phỏng phiếu tập viết đứng yên (6 ô 米字格, chữ 永和九年岁在). Nay thành ô thử thật:

- Ô nhập "Gõ hoặc dán chữ Hán", mặc định 永和九年.
- 6 ô 米字格 hiện ngay 6 chữ Hán đầu tiên; dòng Pinyin phía trên.
- Một nút chính "Tạo phiếu tập viết" mở `/tools/practice-sheet#chars=<chữ>` (trang này đã đọc `#chars=`). Chữ nằm sau `#` nên không gửi lên máy chủ (luật 4), Analytics cũng cắt URL ở `#`.
- Nút `disabled` khi chưa có chữ Hán, dòng gợi ý đổi thành lời nhắc màu đỏ.

## Cách làm

- Logic thuần ở `lib/hero/tryBox.ts` (lọc chữ Hán giống `parseCharacters`, tạo link có hash), test ở `lib/hero/tryBox.test.ts`.
- Pinyin: `getPinyin` trong `lib/practiceSheet.ts` tải trễ bằng `import()` chỉ khi chữ khác mặc định; Pinyin của 永和九年 viết sẵn (`TRY_DEFAULT_PINYIN`, test so với `getPinyin`). Nhờ vậy trang chủ không tải pinyin-pro cho người chỉ xem (First Load của `/` không đổi so với các trang không dùng Pinyin).
- `tryBox.ts` không import `lib/practiceSheet` để pinyin-pro không lọt vào gói trang chủ.
- Không tải từ điển nào ở trang chủ. Không gọi OpenCC: trang phiếu tập viết tự đổi Giản/Phồn theo nút ở Navbar.
- Chữ: `hero.mockupTitle` đổi nội dung, bỏ `hero.mockupLabels`, thêm `tryLabel`, `tryButton`, `tryHint`, `tryEmpty`, `tryPreview` ở `vi.ts` + `en.ts`.
- `userguide/practice-sheet.md` thêm đoạn "Thử nhanh từ trang chủ".

## Soát

Sáng, tối, màu nhấn khác (hoa), điện thoại 390 px (không cuộn ngang), bấm nút → trang phiếu có đúng chữ.
