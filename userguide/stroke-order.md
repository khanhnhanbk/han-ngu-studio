# Tra thứ tự nét

Xem cách viết từng nét của chữ Hán: hoạt hình, sơ đồ từng bước, và tự viết thử bằng chuột hoặc ngón tay. Có nút để tạo ngay phiếu tập viết cho các chữ vừa tra.

**Mở công cụ:** trang chủ → **Công cụ ▾** → **Thứ tự nét**
(hoặc vào thẳng https://han-ngu-studio.vercel.app/tools/stroke-order)

## Các bước

### 1. Nhập chữ cần tra

1. Gõ hoặc dán chữ Hán vào ô **Chữ Hán cần tra (tối đa 20 chữ)**. Có thể nhập nhiều chữ một lúc, ví dụ `永字学写`.
2. Bấm **Tra**.

Chỉ chữ Hán được giữ lại; dấu câu, chữ Latin và số bị bỏ qua. Chữ trùng lặp chỉ hiện một lần.
Nếu nhập nhiều chữ, mỗi chữ hiện thành một ô nhỏ bên dưới ô nhập: bấm vào ô để chuyển sang chữ đó.

### 2. Xem cách viết

Thẻ **Xem cách viết** (mặc định) phát hoạt hình từng nét trong ô 米字格:

| Nút | Tác dụng |
|---|---|
| **Phát** | Phát lại hoạt hình một lần |
| **Phát lặp lại** | Phát liên tục, hết chữ thì bắt đầu lại |
| **Tạm dừng** / **Tiếp tục** | Dừng hoặc chạy tiếp hoạt hình |
| **Tốc độ** | **Chậm**, **Vừa** hoặc **Nhanh** |
| **Hiện chữ mờ** | Hiện hoặc ẩn chữ mờ phía sau |

Bên cạnh ô viết có **Pinyin**, **Hán Việt**, **Số nét** và mục **Từng bước**: mỗi ô thêm một nét, nét màu là nét mới viết ở bước đó.

### 3. Tự viết thử

1. Bấm thẻ **Tự viết thử**.
2. Dùng chuột (máy tính) hoặc ngón tay (điện thoại, máy tính bảng) viết từng nét vào ô, **đúng thứ tự**.
   - Viết đúng: nét được giữ lại.
   - Viết sai: nét bị xóa, viết lại. Sai 3 lần thì nét đúng sẽ nhấp nháy để gợi ý.
3. Dòng bên dưới cho biết tiến độ, ví dụ "Đã viết đúng 3 / 6 nét · Sai 1 lần". Viết xong cả chữ sẽ hiện "Hoàn thành!".
4. Bấm **Viết lại** để làm lại từ đầu. Bỏ tích **Hiện chữ mờ** để viết mà không nhìn chữ mẫu.

### 4. Tạo phiếu tập viết

Bấm **Tạo phiếu tập viết với các chữ này**: trang [Phiếu tập viết](practice-sheet.md) mở ra với các chữ vừa tra và đã bật **Hiện thứ tự nét**.

Bấm **Chiết tự chữ này** để mở trang [Chiết tự](decompose.md) với chữ đang xem: chữ được tô màu theo từng thành phần.

### Chia sẻ

Sau khi bấm **Tra**, địa chỉ trang có thêm các chữ bạn tra (phần sau dấu `#`). Gửi địa chỉ này cho học viên, họ sẽ mở thẳng các chữ đó. Phần sau dấu `#` không được gửi lên máy chủ.

## Dữ liệu

Thứ tự nét lấy từ Make Me a Hanzi / hanzi-writer-data (giấy phép Arphic Public License), khoảng 9.500 chữ giản thể và phồn thể thông dụng. Hoạt hình và phần tự viết dùng thư viện Hanzi Writer (MIT). Âm Hán Việt lấy từ dữ liệu của trang [Hán Việt](hanviet.md).

## Lỗi thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| "Vui lòng nhập ít nhất một chữ Hán." | Ô nhập chưa có chữ Hán nào. |
| "Quá nhiều chữ (tối đa 20 chữ khác nhau)." | Tra ít chữ hơn mỗi lần. Muốn in nhiều chữ, dùng thẳng [Phiếu tập viết](practice-sheet.md). |
| "Chưa có dữ liệu thứ tự nét cho chữ này." | Chữ đó (thường là chữ hiếm) không có trong dữ liệu nét. Pinyin và Hán Việt vẫn hiện nếu có. |
| "Không tải được dữ liệu. …" | Kiểm tra kết nối mạng rồi bấm **Tra** lại. |
| Viết đúng mà vẫn bị báo sai | Viết đúng **chiều** của nét (ngang: trái sang phải; sổ: trên xuống dưới) và đúng thứ tự. Viết chậm, nét dài vừa đủ. |
| Trên điện thoại, kéo ngón tay làm cuộn trang | Đặt ngón tay bắt đầu từ bên trong ô viết. |
