# Quy ước giao diện Hán Ngữ Studio

Bản ngắn, dùng được ngay, không cần Figma. Mỗi luật một dòng; soát hết danh sách ở cuối trước khi chụp screenshot cho PR. Viết 12/11/2026 theo yêu cầu của Novian: ưu tiên đơn giản và thực dụng.

Nguồn tham khảo: lưới 8 điểm ([Breakdance](https://breakdance.com/the-8-point-grid-system-a-practical-guide/), [Design+Code](https://designcodeui.com/components/spacing)), mẹo UI cho lập trình viên ([UX Planet](https://uxplanet.org/14-logic-driven-ui-design-tips-145ee08ea5a5), [Superdesign](https://www.superdesign.dev/blog/ui-design-tips-for-developers)), CSS cho bản in ([Flavio Copes](https://flaviocopes.com/css-printing/), [Piccalil](https://piccalil.li/blog/printing-the-web-making-webpages-look-good-on-paper/)), vùng chạm 44 px (WCAG 2.2 mục 2.5.8 / Apple HIG).

## 1. Khoảng cách

- Chỉ dùng bậc Tailwind theo lưới 4/8 px: `1 2 3 4 6 8 12 16` (4, 8, 12, 16, 24, 32, 48, 64 px). Không dùng số lẻ như `mt-[13px]`.
- Gần nhau là cùng nhóm: khoảng trong nhóm nhỏ hơn khoảng giữa các nhóm (ví dụ nhãn → ô nhập `gap-1`, giữa các ô `gap-4`, giữa các khối `mt-8`).
- Khung trang: `container-page`; khối lớn: `section`; hộp: `card`. Không tự đặt lại lề cho từng trang.

## 2. Căn hàng

- Các nút xếp **chung một cột** thì rộng bằng nhau (`w-full justify-center`, `FileInput fullWidth`).
- Các nút xếp **chung một hàng** thì cao bằng nhau: cùng `px-3 py-2 text-sm` (nhỏ) hoặc mặc định `btn` (lớn), không trộn.
- Thẻ cùng cấp trong lưới: cùng màu nền, cùng chiều cao (`h-full` trong grid), chữ bắt đầu cùng một đường.
- Cột số (STT, HSK) căn giữa; cột chữ căn trái; không căn giữa đoạn văn dài.

## 3. Nút và vùng bấm

- Mỗi khu vực chỉ **một** nút chính (`btn-primary`) cho việc quan trọng nhất; còn lại `btn-secondary`.
- Vùng bấm tối thiểu 44 × 44 px trên điện thoại (nút nhỏ `py-2` + chữ `text-sm` là đạt; icon đơn thì thêm `p-2`).
- Nhãn nút là động từ + vật: "Tải CSV", "In / lưu PDF", không viết "OK", "Xử lý".
- Nút bị khóa thì `disabled`, không ẩn đi, để người dùng biết nó có ở đó.

## 4. Chữ

- Tiêu đề không ngắt dòng lủng củng: tiêu đề ngắn, hoặc `text-balance`.
- Một trang tối đa 3 cỡ chữ cho nội dung (tiêu đề, thân, chú thích) + cỡ riêng cho chữ Hán (`hanzi`).
- Dòng văn bản không dài quá ~75 ký tự (`max-w-3xl` cho đoạn mô tả).
- Chữ phụ dùng `text-ink-500`/`text-ink-700`, không dùng màu xám tự chọn.

## 5. Màu và giao diện tối

- Chỉ dùng token: `brand-*`, `ink-*`, `surface`, `page`. Không hex, không `bg-white`.
- Mọi màn hình mới phải xem ở cả sáng và tối, và với một màu nhấn khác (ThemePicker).
- Nút sáng/tối nằm yên ở đầu trang, không thả nổi đè nội dung.

## 6. Điện thoại

- Thử ở bề rộng 390 px: không cuộn ngang cả trang. Bảng rộng thì cuộn ngang **trong** khung của bảng (`overflow-x-auto`).
- Lưới nhiều cột thì về 1 cột dưới `md`/`lg`.

## 7. Bản in và PDF

- Khổ A4, lề 15 mm (`@page quiz` trong `app/globals.css`, gắn bằng class `quiz-print` hoặc `wordlist-print`).
- Bản in là bố cục riêng (`hidden print:block`), không in thẳng giao diện màn hình có ô nhập, nút.
- Bảng in có viền, hàng tiêu đề tô nền và lặp lại ở mỗi trang (`thead`), mỗi hàng không bị cắt đôi (`break-inside-avoid`).
- Ô chữ dài thì rút gọn trước khi in (ví dụ `briefMeaning`), không để một ô kéo dài nửa trang.
- Trên đầu tờ in: tên bài + một dòng phụ (số mục, tên trang web).
- Kiểm tra bằng PDF thật (Playwright `page.pdf` hoặc Ctrl+P → Lưu PDF), xem cả trang cuối.

## 8. Trạng thái

- Mỗi việc chờ lâu có chữ "Đang…" hoặc nút đổi chữ; lỗi hiện ngay cạnh chỗ bấm, màu đỏ, nói cách sửa.
- Trang trống (chưa có dữ liệu) có một câu hướng dẫn hoặc dữ liệu mẫu, không để trắng.

## Soát trước khi chụp screenshot

- [ ] Nút cùng cột rộng bằng nhau, nút cùng hàng cao bằng nhau
- [ ] Khoảng cách theo bậc 4/8, nhóm rõ ràng
- [ ] Một nút chính mỗi khu vực
- [ ] Tiêu đề không ngắt dòng xấu
- [ ] Sáng + tối + điện thoại 390 px, không cuộn ngang
- [ ] Bản in: A4, lề 15 mm, xem PDF thật đến trang cuối
- [ ] Chữ trên giao diện có đủ bản Việt và Anh (`lib/i18n`)
