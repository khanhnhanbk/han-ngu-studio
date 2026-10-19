# Đọc hiểu

Dán một đoạn văn tiếng Trung để **đọc có trợ giúp**:

- Mỗi từ được **gạch chân theo màu cấp HSK** (HSK 3.0, từ cấp 1 đến 7-9); từ mới với bạn có **nền màu**.
- **Bấm vào từ bất kỳ** để xem Pinyin (đọc theo ngữ cảnh cả câu), âm Hán Việt, nghĩa tiếng Việt, nghĩa tiếng Anh và cấp HSK.
- Công cụ **ước tính độ khó** của văn bản, **ghi nhớ từ bạn đã biết** trên máy này, và gom **từ mới** để gửi sang **Tạo thẻ Anki**, **Trắc nghiệm** hoặc **Phiếu tập viết**.

Văn bản chỉ được xử lý trên máy của bạn, không gửi đi đâu.

**Mở công cụ:** trang chủ → **Công cụ ▾** → nhóm **Đọc văn bản** → **Đọc hiểu**
(hoặc vào thẳng https://han-ngu-studio.vercel.app/tools/reader)

## Các bước

### 1. Nhập văn bản

- Gõ hoặc dán vào ô lớn ("Dán văn bản tiếng Trung vào đây…"), hoặc bấm **Chọn file** dưới dòng **Hoặc tải file (.txt)**.
- Bấm **Dùng văn bản mẫu** để thử với một đoạn văn có sẵn.

Tối đa **5000 ký tự**.

### 2. Chọn cách đọc

| Tùy chọn | Ý nghĩa |
|---|---|
| **Trình độ của tôi** | Cấp HSK hiện tại của bạn (HSK 1 … HSK 7-9), mặc định HSK 3 |
| **Pinyin trên chữ** | **Thông minh (chỉ từ mới)**: Pinyin chỉ hiện trên các từ mới với bạn · **Luôn hiện** · **Ẩn** |
| **Coi mọi từ đến cấp này là đã biết** | Bật: mọi từ có cấp HSK ≤ **Trình độ của tôi** được tính là đã biết |
| **Tô màu theo cấp HSK** | Bật/tắt gạch chân màu |

Các lựa chọn này được nhớ trên trình duyệt cho lần sau.

### 3. Bấm **Đọc**

Lần đầu, trang tải dữ liệu (khoảng 1,3 MB). Sau đó văn bản hiện từng từ:

- **Gạch chân**: cấp HSK của từ (xanh lá = HSK 1 … đỏ = HSK 7-9, xám = **Ngoài HSK**).
- **Nền màu**: từ mới với bạn.

**Bấm vào một từ** (hoặc dùng phím Tab rồi Enter) để mở thẻ chi tiết:

- Pinyin, **Hán Việt**, **Nghĩa tiếng Việt**, **Nghĩa tiếng Anh**, cấp HSK, số lần từ xuất hiện trong văn bản.
- Từ **Ngoài HSK** có thêm dòng **Từng chữ**: cấp HSK của từng chữ trong từ (chỉ để tham khảo; từ ghép không dễ bằng từng chữ của nó).
- **✓ Đã biết**: lưu từ vào danh sách từ đã biết (bấm **Bỏ đã biết** để bỏ). Nếu từ đã được tính là biết theo trình độ, thẻ hiện **✓ Đã biết (đến HSK …)**.
- **+ Danh sách học**: thêm từ vào danh sách học bên dưới.
- **Thứ tự nét**, **Chiết tự**: mở từ đó ở công cụ tương ứng.

Đóng thẻ bằng **Đóng**, phím Esc hoặc bấm ra ngoài. Trên điện thoại, thẻ hiện ở cuối màn hình.

### 4. Xem **Độ khó của văn bản**

- **Ước tính: HSK n**: cấp thấp nhất mà các từ của cấp đó và các cấp dưới chiếm ít nhất 95% số từ có trong danh sách HSK (đọc thoải mái khi biết khoảng 95% số từ).
- Các từ **Ngoài HSK** (tên riêng như 越南, 河内, từ ghép, từ hiếm) không tính vào ước tính; tỉ lệ của chúng được ghi riêng. Nếu hơn nửa số từ ngoài danh sách, công cụ báo **Chưa ước tính được**.
- **Bạn biết x% số từ**: theo danh sách từ đã biết và tùy chọn trình độ.
- Thanh màu: tỉ lệ từ ở từng cấp.

### 5. **Bảng từ**

Mọi từ khác nhau trong văn bản, với Pinyin, Hán Việt, cấp, nghĩa, **Số lần** và ô **Đã biết**.

- **Tất cả / Từ mới**: lọc chỉ các từ mới.
- Ô chọn bên cạnh sắp xếp bảng theo **Thứ tự xuất hiện**, **Số lần xuất hiện** hoặc **Cấp HSK**.
- Bấm **Thêm các từ mới vào danh sách học** để thêm mọi từ mới (từ hay gặp nhất trước).

### 6. **Danh sách học**

Các từ bạn đã thêm trong lần dùng này:

- **→ Tạo thẻ Anki**, **→ Trắc nghiệm**: mở công cụ đó với danh sách từ đã điền sẵn.
- **→ Phiếu tập viết**: mở phiếu tập viết với các chữ đó (có thứ tự nét).
- **Tải .tsv**: file `reader_words.tsv` (từ, Pinyin, Hán Việt, cấp HSK, nghĩa tiếng Việt, nghĩa tiếng Anh).
- **Xóa danh sách**.

Danh sách học mất khi tải lại trang.

### 7. **Từ đã biết**

Danh sách từ đã biết **chỉ lưu trên trình duyệt này**, không gửi đi đâu.

- **Tải danh sách (TSV)**: sao lưu, hoặc chuyển sang máy khác.
- **Nhập từ file TSV**: nhập lại file đã tải, hoặc một file mỗi dòng một từ (ví dụ danh sách từ xuất từ Anki).
- **Xóa tất cả**: xóa toàn bộ danh sách (có hỏi lại).

## Chữ phồn thể

Bấm **繁** trên thanh menu: văn bản, thẻ chi tiết, bảng từ và danh sách học hiện bằng chữ phồn thể, dù bạn gõ giản thể hay phồn thể. Từ đã biết được lưu theo chữ giản thể, nên 學習 và 学习 là một từ. Xem [Giản thể / Phồn thể](README.md#giản-thể--phồn-thể).

## Nghe phát âm

Bấm biểu tượng **loa** trong thẻ chi tiết và cạnh mỗi từ trong **Bảng từ** để nghe chữ hoặc từ đó (giọng người thật nếu có bản ghi). Xem [Nghe phát âm](README.md#nghe-phát-âm) để cài giọng cho máy và các tùy chọn.

## Lỗi thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| "Vui lòng nhập văn bản tiếng Trung." | Ô nhập đang trống. |
| "Văn bản quá dài (tối đa 5000 ký tự)." | Chia văn bản thành nhiều phần. |
| "Không tải được dữ liệu…" | Kiểm tra mạng rồi bấm **Đọc** lần nữa. |
| Một từ quen thuộc bị ghi **Ngoài HSK** | Từ đó (thường là từ ghép như 每天, 看书, hoặc tên riêng) không có trong danh sách HSK 3.0 của chúng tôi. Dòng **Từng chữ** cho biết cấp của từng chữ. Bấm **✓ Đã biết** nếu bạn đã biết từ này. |
| **Ước tính** có vẻ quá dễ hoặc quá khó | Ước tính chỉ dựa vào danh sách từ HSK và quy tắc 95%, không xét ngữ pháp hay độ dài câu. Hãy xem thêm **Bạn biết x% số từ** và **Bảng từ**. |
| Mất danh sách từ đã biết | Danh sách nằm trong dữ liệu trình duyệt; xóa dữ liệu trang web hoặc dùng chế độ ẩn danh sẽ mất. Hãy **Tải danh sách (TSV)** để sao lưu. |
| Từ bị tách chưa đúng | Công cụ tách từ theo từ điển tần suất; tên riêng hoặc từ hiếm có thể bị tách sai. |

## Nguồn dữ liệu

- Cấp HSK và nghĩa tiếng Việt: Hán Ngữ Studio (danh sách từ vựng HSK 3.0).
- Nghĩa tiếng Anh: **CC-CEDICT** (CC BY-SA 4.0).
- Pinyin: **pinyin-pro** (MIT). Âm Hán Việt: Hán Ngữ Studio.
