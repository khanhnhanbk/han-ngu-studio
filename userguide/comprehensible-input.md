# Sắp xếp câu theo N+1

Khi học bằng câu, mỗi câu chỉ nên có **khoảng một từ mới** (phương pháp N+1): bạn hiểu gần hết câu, chỉ cần học thêm một từ. Công cụ này sắp xếp danh sách câu của bạn từ dễ đến khó theo nguyên tắc đó.

**Mở công cụ:** trang chủ → **Công cụ ▾** → **Sắp xếp câu N+1**
(hoặc vào thẳng https://han-ngu-studio.vercel.app/tools/comprehensible-input)

## Các bước

1. Dán các câu tiếng Trung vào ô **Các câu (mỗi dòng một câu)**.
   - Mỗi dòng là một câu. Dòng trống được bỏ qua.
2. (Không bắt buộc) Dán các từ bạn đã biết vào ô **Từ đã biết (không bắt buộc, mỗi dòng một từ)**.
   - Mỗi dòng một từ, ví dụ `我`, `你好`, `知道`. Từ phải viết đúng như trong câu.
3. Bấm **Sắp xếp**.
   - Lần đầu tiên, nút hiện **Đang xử lý…** trong vài giây vì trang đang tải danh sách từ. Các lần sau nhanh hơn.
4. Xem kết quả (giải thích bên dưới).
   - Khi có nhiều câu, trang chỉ hiện **100 câu đầu**. Chọn số câu muốn xem ở ô **Hiện** (50, 100, 200 hoặc 500 câu đầu).
   - Bảng **Thống kê** luôn tính trên **toàn bộ** danh sách, không chỉ phần đang hiện.
5. Bấm **Tải sentence_sorted.tsv** để lưu **toàn bộ** danh sách đã sắp xếp (mở được bằng Excel, Google Sheets hoặc nhập vào Anki). Dưới danh sách cũng có nút tải này khi danh sách bị rút gọn.

## Đọc kết quả

### Thống kê

Phía trên danh sách có bảng **Thống kê**:

| Ô | Ý nghĩa |
|---|---|
| **Số câu** | Số câu đã sắp xếp (không tính dòng trống) |
| **Tổng từ mới** | Số từ mới bạn sẽ học qua toàn bộ danh sách (mỗi từ chỉ tính một lần) |
| **TB từ mới / câu** | Tổng từ mới chia cho số câu. Càng gần 1 càng đúng N+1 |
| **Câu đúng 1 từ mới** | Số câu (và tỉ lệ %) đúng chuẩn N+1 |
| **Câu 0 từ mới (ôn tập)** | Câu mà bạn đã biết hết các từ |
| **Câu ≥ 2 từ mới** | Câu mang từ 2 từ mới trở lên |
| **Nhiều nhất trong một câu** | Số từ mới lớn nhất trong một câu |
| **Câu dài (> 25 ký tự)** | Số câu dài, luôn được xếp cuối |

### Mỗi dòng kết quả

- Số thứ tự học (1, 2, 3…), rồi **Dòng gốc N**: câu này nằm ở dòng thứ N trong ô bạn đã dán.
- Số từ mới của câu, ví dụ `1 từ mới`.
- Câu, với các từ mới được tô sáng.
- **Từ mới:** các từ mới của câu.
- Nhãn đánh dấu (rê chuột lên nhãn để xem giải thích):
  - **Không có từ mới**: bạn đã biết mọi từ trong câu, dùng để ôn tập.
  - **Quá nhiều từ mới**: câu có từ 2 từ mới trở lên.
  - **Câu dài**: câu dài hơn 25 ký tự (tính cả dấu câu).

## Vì sao có câu "Quá nhiều từ mới"?

Công cụ luôn chọn **câu dễ nhất còn lại** trước. Khi không còn câu nào chỉ thêm 1 từ mới, câu tiếp theo buộc phải mang 2 từ mới trở lên cùng lúc, nên được đánh dấu **Quá nhiều từ mới**. Câu dài hơn 25 ký tự luôn được xếp cuối danh sách.

Khi có câu như vậy, phía trên danh sách sẽ hiện một khung giải thích. Bạn có thể:

1. **Học trước các từ mới** được liệt kê, thêm chúng vào ô **Từ đã biết** rồi bấm **Sắp xếp** lần nữa.
2. **Thêm câu ngắn, đơn giản** có chứa những từ đó: mỗi câu như vậy là một bậc thang trước câu khó.
3. **Tách câu dài** thành nhiều câu ngắn hơn.

Danh sách càng nhiều câu ngắn, dễ thì càng ít câu bị đánh dấu.

## File TSV

File `sentence_sorted.tsv` có 4 cột, theo đúng thứ tự học:

| Cột | Nội dung |
|---|---|
| `idx` | Vị trí dòng gốc, **đếm từ 0** (dòng đầu tiên là `0`, nên `idx` = **Dòng gốc** − 1) |
| `sentence` | Câu |
| `new_words` | Các từ mới, cách nhau bằng dấu phẩy `,` |
| `unknown_count` | Số từ mới |

## Lỗi thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| "Vui lòng nhập ít nhất một câu tiếng Trung." | Ô **Các câu** đang trống. Dán ít nhất một câu. |
| "Không tải được danh sách từ. Vui lòng kiểm tra kết nối mạng rồi bấm Sắp xếp để thử lại." | Kiểm tra mạng rồi bấm **Sắp xếp** lần nữa. |
| Rất nhiều câu **Quá nhiều từ mới** | Danh sách câu quá ít hoặc quá khó so với từ đã biết. Xem mục "Vì sao có câu Quá nhiều từ mới?" ở trên. |
| Từ đã biết mà vẫn bị tính là từ mới | Từ trong ô **Từ đã biết** phải giống hệt từ mà công cụ tách ra (xem dòng **Từ mới**). Ví dụ biết `你` và `好` chưa đủ nếu công cụ tách ra từ `你好`. |
| Một từ bị tách chưa đúng | Công cụ tách từ dựa trên tần suất từ (giống công cụ **Tách từ**); với tên riêng hoặc từ hiếm có thể chưa chính xác. |
| File TSV mở bằng Excel bị lỗi font | Mở bằng Google Sheets, hoặc trong Excel dùng **Data → From Text/CSV** và chọn mã hóa UTF-8. |
