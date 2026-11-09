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

Bên trái là chữ lớn, **mỗi thành phần một màu**. Bên dưới có **Pinyin**, **Hán Việt**, **Số nét**, **Bộ thủ** và **Mã Ngũ bút**, hàng **Giản · Phồn · Nhật** (nếu có) và hai nút:

- **Xem thứ tự nét**: mở trang Thứ tự nét với chữ này.
- **Tạo phiếu tập viết**: mở trang Phiếu tập viết với chữ này, có sẵn dải thứ tự nét.

Hàng **Chữ qua các thời kỳ** cho thấy chữ đã được viết thế nào qua từng thời kỳ: **Giáp cốt** (khắc trên mai rùa, xương thú), **Kim văn** (đúc trên đồ đồng), **Đại triện**, **Tiểu triện**, rồi **Khải thư** (chữ ngày nay). Chỉ những dạng có dữ liệu mới hiện, nhiều chữ không có đủ cả bốn dạng cổ; chữ xuất hiện muộn (như 你, 们) thì không có hàng này. Mỗi ô là **một dạng tiêu biểu**, vì cùng một thời kỳ chữ có thể được viết theo nhiều cách. Bấm vào một ô để mở trang nguồn trên Wikimedia Commons. Dữ liệu hiện có cho các chữ trong danh sách HSK.

Hàng **Giản · Phồn · Nhật** chỉ hiện khi chữ có dạng giản thể, phồn thể (kiểu Đài Loan) hay chữ Nhật (shinjitai) khác nhau, ví dụ 广 · 廣 · 広 hoặc 国 · 國 · 国. Chữ có nhiều dạng phồn thể thì có nhiều dòng, ví dụ 发: 發 · 発 (phát, phát ra) và 髮 · 髪 (tóc). Chữ đang xem có viền màu. Bấm vào một chữ khác trong hàng để chiết tự chữ đó; chữ nào không bấm được là chữ chưa có dữ liệu phân tích (thường là chữ Nhật). Dữ liệu lấy từ bảng của OpenCC.

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

**Không muốn tự viết?** Với các chữ HSK 1, khung **Gợi ý ghi nhớ** hiện sẵn một mẹo, ví dụ 休: *Người (亻 nhân) tựa vào cây (木 mộc) → 休 hưu, nghỉ.* Bấm **Dùng mẹo này** để chép mẹo vào ô câu chuyện của bạn, rồi sửa tùy ý. Khi bạn đã có câu chuyện riêng, mẹo được thu gọn; bấm **Xem mẹo gợi ý** để xem lại.

- Mỗi gợi ý có một nhãn (rê chuột vào nhãn để xem giải thích):
  - **Mẹo nhớ**: câu chuyện đặt ra để dễ nhớ, **không phải** lịch sử của chữ. Nguồn gốc thật xem ở bước 4 (**Cách tạo chữ**). Hiện mọi gợi ý đều là mẹo nhớ.
  - **Theo nguồn gốc**: giải thích theo nguồn gốc thật của chữ, luôn ghi **Nguồn: …** bên dưới.
- Mẹo do Hán Ngữ Studio soạn với trợ giúp của AI. Mẹo có nhãn **gợi ý, chưa kiểm duyệt** là mẹo chưa được người kiểm tra lại.
- Ở chế độ **Phồn thể**, mẹo lấy theo chữ giản thể tương ứng (學 dùng mẹo của 学).

Hoặc tự viết: trong khung **Câu chuyện ghi nhớ**, viết một câu ngắn ghép các thành phần lại, ví dụ: *Nước (氵) xanh (青) thì trong (清).* Câu chuyện được lưu ngay khi bạn gõ (hiện **Đã lưu trên máy này.**). Mỗi chữ có một câu chuyện riêng.

- Câu chuyện **chỉ lưu trên trình duyệt này**, không gửi đi đâu. Máy khác hoặc trình duyệt khác sẽ không thấy.
- **Tải câu chuyện (TSV)**: tải mọi câu chuyện đã viết về máy (file `cau-chuyen-ghi-nho.tsv`). Mở được bằng Excel hoặc Google Sheets.
- **Nhập câu chuyện từ file TSV**: bấm **Chọn file** và chọn file đã tải trước đó để chép câu chuyện sang trình duyệt khác. Câu chuyện trong file sẽ ghi đè câu chuyện cùng chữ đang có.
- Xóa hết chữ trong khung để xóa câu chuyện của chữ đó.

### 7. Tải ảnh thẻ chữ

Bấm **Tải ảnh thẻ chữ** (dưới hai nút **Xem thứ tự nét** và **Tạo phiếu tập viết**) để tải về một ảnh PNG dọc 1080×1350, hợp để lưu vào điện thoại hay chia sẻ lên mạng xã hội. Ảnh có:

- Chữ lớn trên ô 米字格, Pinyin, âm Hán Việt và nghĩa (nếu có trong dữ liệu).
- Dòng công thức, ví dụ `氵 + 青 = 清` (chỉ hiện khi biết hết các thành phần).
- Từng thành phần kèm âm Hán Việt và nghĩa.
- Mẹo gợi ý kèm nhãn **Mẹo nhớ** / **Theo nguồn gốc** (và **gợi ý, chưa kiểm duyệt** nếu mẹo chưa được kiểm tra).
- Địa chỉ trang ở cuối ảnh.

Mặc định ảnh dùng **mẹo gợi ý**. Muốn in câu chuyện của riêng bạn thì đánh dấu **Dùng ghi chú của tôi** trước khi bấm; ảnh khi đó có nhãn **Câu chuyện của tôi**.

Ảnh được tạo ngay trên trình duyệt và lưu thẳng về máy (file `the-chu-<chữ>.png`), không tải lên đâu. Ảnh luôn có nền sáng, kể cả khi trang đang ở chế độ tối; màu nhấn theo màu bạn chọn cho trang.

### Chia sẻ

Địa chỉ trang đổi thành `…/tools/decompose#c=清晴&s=晴` (`c`: các chữ, `s`: chữ đang xem). Gửi địa chỉ này cho người khác để mở đúng các chữ đó. Câu chuyện ghi nhớ **không** nằm trong địa chỉ.

Trang **214 bộ thủ** (nút **Chiết tự**) và trang **Thứ tự nét** (nút **Chiết tự chữ này**) cũng mở thẳng công cụ này.

## Chữ phồn thể

Chọn **繁 Phồn thể** (nút **⚙** trên thanh menu → **Loại chữ**): chữ được phân tích ở dạng phồn thể, dù bạn gõ giản thể (们 → 們: 亻 + 門). Pinyin và Hán Việt lấy theo chữ giản thể tương ứng. Danh sách **Chữ có chứa thành phần** chỉ hiện chữ phồn thể. Xem [Giản thể / Phồn thể](README.md#giản-thể--phồn-thể).

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
| Không thấy **Gợi ý ghi nhớ** | Hiện mới có mẹo cho các chữ HSK 1; chữ khác sẽ được thêm dần. |
| Mẹo nhớ nghe gượng hoặc chưa đúng | Mẹo có nhãn **gợi ý, chưa kiểm duyệt** chưa được người đọc lại. Bấm **Góp ý mẹo này** để báo cho Hán Ngữ Studio: trang GitHub mở ra với chữ và mẹo điền sẵn (không có câu chuyện của bạn), bạn ghi đề xuất rồi gửi (cần tài khoản GitHub). Hoặc bấm **Dùng mẹo này** rồi sửa theo ý bạn. |
| Ảnh thẻ chữ không có câu chuyện của tôi / "Chữ này chưa có ghi chú của bạn, ảnh dùng mẹo gợi ý." | Đánh dấu **Dùng ghi chú của tôi** trước khi bấm **Tải ảnh thẻ chữ**, và chữ đó phải có câu chuyện trong khung **Câu chuyện ghi nhớ**. |
| Không thấy hàng **Chữ qua các thời kỳ** | Chữ chưa có bản vẽ chữ cổ (thường là chữ xuất hiện muộn, hoặc chữ ngoài danh sách HSK). Ở chế độ **Phồn thể**, chữ giản thể gộp từ nhiều chữ phồn thể (发 ← 發, 髮) chỉ hiện chữ cổ khi xem đúng chữ phồn thể đó. |
| Ảnh thẻ chữ không có dòng công thức | Có thành phần **？ Chưa rõ** hoặc chữ chỉ có một thành phần, nên công cụ bỏ dòng công thức để không ghi sai. |
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
- Gợi ý ghi nhớ: Hán Ngữ Studio (soạn với trợ giúp AI, đang kiểm duyệt dần).
