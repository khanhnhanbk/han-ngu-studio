# Chiết tự

Tách một chữ Hán thành **các thành phần** (không chỉ bộ thủ) theo cách "chiết tự": mỗi thành phần được tô một màu ngay trên chữ, có tên Hán Việt, Pinyin và tên bộ thủ (nếu là bộ thủ). Công cụ còn cho biết phần nào **gợi nghĩa**, phần nào **gợi âm**, liệt kê **các chữ có cùng thành phần**, và cho bạn tự viết **câu chuyện ghi nhớ** cho từng chữ.

Ví dụ với 清 (thanh, trong):

| Thông tin | Ví dụ |
|---|---|
| **Các thành phần** | 氵 (Thủy · Nước) + 青 (thanh · Màu xanh); 青 lại gồm 龶 + 月 |
| **Cách tạo chữ** | **Hình thanh**: 氵 gợi nghĩa (nước), 青 gợi âm (thanh) |
| **Chữ có chứa thành phần 青** | 情 tình, 请 thỉnh, 精 tinh, 晴 tình, 睛 tình… |

**Mở công cụ:** trang chủ → **Công cụ ▾** → **Chiết tự**
(hoặc vào thẳng https://han-ngu-studio.vercel.app/tools/decompose)

## Các bước

### 1. Nhập chữ

Gõ hoặc dán chữ Hán vào ô **Chữ Hán cần phân tích (tối đa 20 chữ)** rồi bấm **Chiết tự**. Nếu nhập nhiều chữ, mỗi chữ hiện thành một ô ở dưới; bấm vào ô để xem chữ đó.

### 2. Xem chữ tô màu và thông tin chung

Bên trái là chữ lớn, **mỗi thành phần một màu**. Bên dưới có **Pinyin**, **Hán Việt**, **Số nét**, **Bộ thủ** và **Mã Ngũ bút**, cùng hai nút:

- **Xem thứ tự nét**: mở trang Thứ tự nét với chữ này.
- **Tạo phiếu tập viết**: mở trang Phiếu tập viết với chữ này, có sẵn dải thứ tự nét.

### 3. Xem các thành phần

Mục **Các thành phần** cho thấy chữ được ghép thế nào, ví dụ **Trái – phải**, **Trên – dưới**, **Bao quanh**. Mỗi thành phần có:

- Chấm màu: trùng với màu của phần đó trên chữ lớn.
- Âm Hán Việt và Pinyin của thành phần.
- **Bộ thủ: …** nếu thành phần là một trong 214 bộ thủ (hoặc dạng khác của bộ, như 氵 của 水).
- Nhãn **Gợi nghĩa** / **Gợi âm** với chữ hình thanh.
- **Thành phần cơ bản**: phần không tách nhỏ hơn được nữa.

Rê chuột vào một thành phần (trên điện thoại: chạm vào) để **tô sáng các nét của nó** trên chữ lớn. Bấm **Mở rộng** để xem thành phần đó lại gồm những phần nào; **Thu gọn** để ẩn đi. Phần **Gợi âm** lúc đầu được thu gọn (thường học cả khối); bấm **Mở rộng** nếu muốn xem nó gồm những phần nào.

### 4. Đọc cách tạo chữ

Mục **Cách tạo chữ** ghi một trong ba loại:

- **Hình thanh**: một phần gợi nghĩa, một phần gợi âm (dòng **Gợi nghĩa** và **Gợi âm** cho biết phần nào).
- **Hội ý**: ghép các thành phần lại để gợi ra ý nghĩa mới.
- **Tượng hình**: vẽ lại hình dáng sự vật.

Dòng nhỏ **Ghi chú gốc (tiếng Anh, Make Me a Hanzi)** là ghi chú tiếng Anh của nguồn dữ liệu.

### 5. Xem các chữ cùng thành phần

Bấm vào một thành phần ở bước 3. Khung **Chữ có chứa thành phần …** liệt kê các chữ khác có thành phần đó (ở bất kỳ tầng nào), chữ thông dụng đứng trước, kèm âm Hán Việt.

- Nhãn **âm** ở góc: trong chữ đó, thành phần này là **phần gợi âm**. Đây là cách nhanh để học cả một "họ" chữ đọc gần giống nhau (青 → 清 情 晴 请 睛).
- Lúc mới mở, công cụ tự chọn phần gợi âm (nếu có), không thì chọn thành phần đầu tiên.
- Bấm **Xem tất cả** để hiện hết danh sách (tối đa 300 chữ), **Thu gọn** để quay lại.
- Bấm vào một chữ trong danh sách để chiết tự chữ đó. Chữ được thêm vào hàng ô ở trên, nên bạn có thể quay lại chữ cũ.

### 6. Viết câu chuyện ghi nhớ

Trong khung **Câu chuyện ghi nhớ**, viết một câu ngắn ghép các thành phần lại, ví dụ: *Nước (氵) xanh (青) thì trong (清).* Câu chuyện được lưu ngay khi bạn gõ (hiện **Đã lưu trên máy này.**). Mỗi chữ có một câu chuyện riêng.

- Câu chuyện **chỉ lưu trên trình duyệt này**, không gửi đi đâu. Máy khác hoặc trình duyệt khác sẽ không thấy.
- **Tải câu chuyện (TSV)**: tải mọi câu chuyện đã viết về máy (file `cau-chuyen-ghi-nho.tsv`). Mở được bằng Excel hoặc Google Sheets.
- **Nhập câu chuyện từ file TSV**: bấm **Chọn file** và chọn file đã tải trước đó để chép câu chuyện sang trình duyệt khác. Câu chuyện trong file sẽ ghi đè câu chuyện cùng chữ đang có.
- Xóa hết chữ trong khung để xóa câu chuyện của chữ đó.

### Chia sẻ

Địa chỉ trang đổi thành `…/tools/decompose#c=清晴&s=晴` (`c`: các chữ, `s`: chữ đang xem). Gửi địa chỉ này cho người khác để mở đúng các chữ đó. Câu chuyện ghi nhớ **không** nằm trong địa chỉ.

Trang **214 bộ thủ** (nút **Chiết tự**) và trang **Thứ tự nét** (nút **Chiết tự chữ này**) cũng mở thẳng công cụ này.

## Chữ phồn thể

Bấm **繁** trên thanh menu: chữ được phân tích ở dạng phồn thể, dù bạn gõ giản thể (们 → 們: 亻 + 門). Pinyin và Hán Việt lấy theo chữ giản thể tương ứng. Danh sách **Chữ có chứa thành phần** chỉ hiện chữ phồn thể. Xem [Giản thể / Phồn thể](README.md#giản-thể--phồn-thể).

## Nghe phát âm

Bấm nút **Phát âm: tắt** trên thanh menu đầu trang (hoặc nút **Bật phát âm** ngay dưới tên công cụ) một lần, sau đó bấm biểu tượng **loa** cạnh Pinyin của chữ đang xem và ở góc mỗi chữ cùng thành phần để nghe chữ hoặc từ đó (giọng người thật nếu có bản ghi). Xem [Nghe phát âm](README.md#nghe-phát-âm) để cài giọng cho máy và các tùy chọn.

## Lỗi thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| "Không tải được dữ liệu…" | Kiểm tra mạng rồi tải lại trang. |
| "Chưa có dữ liệu phân tích cho chữ này…" | Dữ liệu có khoảng 9.500 chữ thông dụng (giản thể và phồn thể). Chữ hiếm chưa có; thử chữ khác hoặc dạng giản thể/phồn thể của nó. |
| Một thành phần ghi **？ Chưa rõ** | Nguồn dữ liệu chưa xác định được phần đó. Các phần còn lại vẫn đúng. |
| Chữ lớn không có màu / "Chưa có dữ liệu nét để tô màu chữ này." | Chữ chưa có dữ liệu nét; phần phân tích thành phần vẫn dùng được. |
| Rê chuột vào thành phần sâu bên trong mà không tô sáng nét | Thứ tự nét của thành phần đó không khớp hoàn toàn với chữ lớn, nên công cụ không tô để tránh tô sai. |
| Mất câu chuyện ghi nhớ | Câu chuyện nằm trong bộ nhớ trình duyệt: xóa dữ liệu duyệt web, dùng chế độ ẩn danh hoặc đổi trình duyệt đều làm mất. Hãy **Tải câu chuyện (TSV)** thường xuyên để có bản sao. |
| "Trình duyệt không cho lưu…" | Trình duyệt đang chặn lưu dữ liệu (thường do chế độ ẩn danh). Viết xong hãy bấm **Tải câu chuyện (TSV)**. |
| "File không có câu chuyện nào hợp lệ." | Chỉ nhập được file do nút **Tải câu chuyện (TSV)** tạo ra (mỗi dòng: một chữ, dấu Tab, câu chuyện). |
| Chữ trong danh sách "Chữ có chứa…" ghi "—" thay vì âm Hán Việt | Thường là chữ phồn thể hoặc chữ hiếm chưa có trong bảng Hán Việt. |
| Chữ phồn thể hiện sai mặt chữ (ví dụ 發 ở chỗ cần 髮) | Một số chữ giản thể ứng với nhiều chữ phồn thể (发 → 發 / 髮); bộ chuyển đổi chọn theo ngữ cảnh và đôi khi chọn nhầm. Hãy gõ thẳng chữ phồn thể đúng. |
| Đứng mãi ở "Đang tải bộ chuyển đổi Phồn thể…" hoặc báo "Không tải được bộ chuyển đổi Phồn thể…" | Kiểm tra mạng rồi tải lại trang, hoặc bấm **简** để dùng giản thể. |

## Nguồn dữ liệu

- Thành phần, cách tạo chữ, phần gợi nghĩa / gợi âm: **Make Me a Hanzi** (giấy phép LGPL-3.0).
- Nét chữ để tô màu: Make Me a Hanzi / hanzi-writer-data (Arphic Public License).
- Tên và nghĩa bộ thủ: Hán Ngữ Studio. Âm Hán Việt: [hanviet-pinyin-wordlist](https://github.com/ph0ngp/hanviet-pinyin-wordlist) của Phong Phan (MIT), Hán Ngữ Studio chỉnh sửa một số chữ; xem [radicals.md](radicals.md) và [hanviet.md](hanviet.md).
- Mã Ngũ bút: pywubi (MIT).
