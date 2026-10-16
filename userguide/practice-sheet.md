# Phiếu tập viết chữ Hán

Tạo phiếu luyện viết khổ A4: mỗi chữ có một ô chữ mẫu màu đen, các ô chữ mờ để đồ theo, và ô trống để tự viết. Có thể thêm một dải ô nhỏ chỉ **thứ tự nét** phía trên mỗi chữ. In ra giấy hoặc lưu thành PDF.

**Mở công cụ:** trang chủ → **Công cụ ▾** → **Phiếu tập viết**
(hoặc vào thẳng https://han-ngu-studio.vercel.app/tools/practice-sheet)

## Các bước

### 1. Nhập chữ Hán

Có hai cách:

- **Gõ hoặc dán** chữ Hán vào ô lớn ở đầu trang ("Nhập hoặc dán chữ Hán vào đây…").
- Bấm nút chọn file dưới dòng **Hoặc tải file (.txt, .csv)** và chọn file trên máy.

Chỉ chữ Hán được giữ lại; dấu câu, khoảng trắng, chữ Latin và số sẽ bị bỏ qua.
Dòng **Số chữ: … / 300** cho biết bạn đã nhập bao nhiêu chữ (tối đa 300 chữ).

Muốn thử nhanh? Bấm **Dùng văn bản mẫu**.

### 2. Chọn tùy chọn

| Tùy chọn | Ý nghĩa | Mặc định |
|---|---|---|
| **Kiểu ô** | **米字格 (ô chữ mễ)**: ô có đường chéo, hoặc **田字格 (ô chữ điền)**: ô chia 4 | 米字格 |
| **Cỡ ô** | Nhỏ (12mm), Vừa (16mm), Lớn (20mm), Rất lớn (25mm). Người mới học nên chọn Lớn | Vừa (16mm) |
| **Độ đậm chữ mờ** | Màu của các chữ để đồ: Vừa, Nhạt, Đậm | Vừa |
| **Số ô chữ mờ để đồ** | Kéo thanh trượt: số ô chữ mờ sau ô chữ mẫu. Các ô còn lại trong hàng để trống | 8 |
| **Số dòng mỗi chữ** | Mỗi chữ chiếm bao nhiêu hàng (1 đến 6) | 1 |
| **Màu ô** | Bấm một màu: Đỏ, Xanh lá, Xanh dương, Đen / xám | Đỏ |
| **Hiện Pinyin** | Tích để in Pinyin của mỗi chữ trên phiếu | Bật |
| **Bỏ chữ trùng lặp** | Tích để mỗi chữ chỉ xuất hiện một lần | Tắt |
| **Hiện thứ tự nét** | Tích để thêm dải ô nhỏ phía trên mỗi chữ (xem bên dưới) | Tắt |

Trang sẽ **nhớ các tùy chọn** của bạn cho lần sau (lưu trên trình duyệt của bạn).

#### Thứ tự nét

Khi tích **Hiện thứ tự nét**, phía trên hàng đầu tiên của mỗi chữ có thêm một dải ô nhỏ:

- Ô thứ 1 có nét thứ 1, ô thứ 2 có nét 1 và 2, … ô cuối cùng là cả chữ.
- Trong mỗi ô, **nét mới viết có màu đen**, các nét đã viết trước đó có màu xám (theo **Độ đậm chữ mờ**).
- Bên trái dải ô ghi tổng số nét, ví dụ "6 nét".
- Chữ nhiều nét thì các ô nhỏ lại để vừa một hàng.

Muốn xem hoạt hình hoặc tự viết thử trước khi in, dùng trang [Tra thứ tự nét](stroke-order.md); nút **Tạo phiếu tập viết với các chữ này** ở đó mở trang này với các chữ đã tra và đã bật **Hiện thứ tự nét**.

Lần đầu bật, trang tải dữ liệu nét chữ (chỉ phần cần cho các chữ bạn nhập). Trong lúc tải, nút in hiện "Đang tải dữ liệu nét…" và chưa bấm được.

Dữ liệu thứ tự nét lấy từ Make Me a Hanzi / hanzi-writer-data (giấy phép Arphic Public License), có khoảng 9.500 chữ giản thể và phồn thể thông dụng.

### 3. Xem trước

Kéo xuống phần **Xem trước (… trang)** để xem phiếu sẽ được in như thế nào.

### 4. In hoặc lưu PDF

1. Bấm **In / Tải PDF**.
2. Hộp thoại in của trình duyệt mở ra. Chọn:
   - **Máy in / Đích:** "Lưu dưới dạng PDF" (Save as PDF) để lưu file, hoặc chọn máy in để in luôn.
   - **Khổ giấy:** A4.
   - **Lề:** Không (None).
   - **Đồ họa nền:** bật (Background graphics), nếu không ô và chữ mờ có thể không hiện.
3. Bấm **Lưu** hoặc **In**.

## Lỗi thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| "Vui lòng nhập ít nhất một chữ Hán." | Ô nhập chưa có chữ Hán nào. Kiểm tra lại văn bản. |
| "Quá nhiều chữ (tối đa 300 chữ)." | Chia văn bản thành nhiều lần in, hoặc tích **Bỏ chữ trùng lặp**. |
| "Chỉ hỗ trợ file .txt hoặc .csv." | Lưu file Word/Excel thành `.txt` hoặc `.csv` trước khi tải lên. |
| PDF không có ô đỏ / chữ mờ | Trong hộp thoại in, bật **Đồ họa nền** (Background graphics). |
| "Chưa có dữ liệu thứ tự nét cho chữ này" trên dải ô | Chữ đó (thường là chữ hiếm) không có trong dữ liệu nét. Phần tập viết của chữ vẫn in bình thường. |
| "Không tải được dữ liệu thứ tự nét. …" | Kiểm tra kết nối mạng rồi tải lại trang, hoặc bỏ tích **Hiện thứ tự nét** để in phiếu không có thứ tự nét. |
| Nút in hiện "Đang tải dữ liệu nét…" rất lâu | Mạng chậm. Đợi thêm một chút; lần sau trình duyệt đã có sẵn dữ liệu nên nhanh hơn. |
| Phiếu bị lệch hoặc thừa trang trắng | Chọn khổ **A4** và lề **Không**; tỷ lệ (Scale) để **100%** / Mặc định. |
