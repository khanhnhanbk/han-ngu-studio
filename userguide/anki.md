# Tạo bộ thẻ Anki

Nhập danh sách từ vựng, công cụ tạo sẵn bảng thẻ để **import vào Anki**. Mỗi từ có:

| Cột | Ví dụ (大学) |
|---|---|
| **Từ** | 大学 |
| **Pinyin** | dà xué |
| **Nghĩa (tiếng Anh)** | the Great Learning, … in Confucianism; university; college |
| **Câu ví dụ** | 我在大学学习。 |
| **Pinyin của câu** | wǒ zài dàxué xuéxí. |
| **Nghĩa của câu** | Tôi đang học đại học. |
| **Ngũ bút** | dddd ipbf |
| **Hán Việt** | đại học |

**Mở công cụ:** trang chủ → **Công cụ ▾** → **Tạo thẻ Anki**
(hoặc vào thẳng https://han-ngu-studio.vercel.app/tools/anki)

## Các bước

### 1. Nhập từ vựng

- Gõ hoặc dán vào ô lớn, **mỗi dòng một từ**; hoặc
- bấm nút **Chọn file** dưới dòng **Hoặc tải file (.txt)** (file `.txt`, mỗi dòng một từ).

Dòng **Số từ: … / 1000** cho biết số từ (tối đa 1000). Từ trùng lặp được tự động bỏ.

### 2. Bấm **Tạo bộ thẻ**

Lần đầu tiên, nút hiện **Đang xử lý…** vài giây để tải dữ liệu (khoảng 3 MB). Các lần sau gần như tức thì.

### 3. Chọn cột

Ở phần **Cột xuất ra**, bỏ tích các cột bạn không cần (ví dụ **Ngũ bút**). Thứ tự cột luôn giữ nguyên như bảng ở trên.

Ô **Thêm dòng cấu hình cho Anki (#columns…)** (mặc định bật): thêm 3 dòng đầu file để Anki 2.1.55 trở lên tự nhận dấu Tab và tên cột. Nếu dùng Anki cũ hơn và thấy các dòng `#…` bị nhập thành thẻ, hãy bỏ tích ô này.

### 4. Xem trước và chỉnh sửa

Bảng **Xem trước và chỉnh sửa** hiện tất cả thẻ. **Bấm vào ô bất kỳ để sửa** (ví dụ rút gọn nghĩa, đổi câu ví dụ). Nội dung đã sửa sẽ có trong file tải về.

Trên điện thoại, kéo ngang bảng để xem các cột bên phải.

### 5. Kiểm tra mục **Không tìm thấy**

Nếu có, khung **Không tìm thấy** liệt kê:
- **Chưa có nghĩa**: từ không có trong từ điển (thường là cụm từ dài hoặc chữ phồn thể). Hãy tự điền vào ô Nghĩa.
- **Chưa có câu ví dụ**: chưa có câu cho từ này. Hãy tự điền vào ô Câu ví dụ (cột Pinyin của câu sẽ không tự cập nhật).

### 6. Tải file

- **Tải .tsv**: lưu file `anki_deck.tsv` vào thư mục Tải xuống.
- **Sao chép**: chép toàn bộ nội dung (dán vào Excel / Google Sheets nếu muốn chỉnh tiếp).

## Import vào Anki trên máy tính

1. Mở Anki, bấm **File → Import** (Tệp → Nhập) và chọn `anki_deck.tsv`.
2. Trong cửa sổ import:
   - **Field separator** (Dấu phân cách): **Tab** (tự nhận nếu bật dòng cấu hình).
   - **Notetype** (Loại ghi chú): chọn loại ghi chú có đủ trường (xem mẹo bên dưới).
   - **Deck** (Bộ thẻ): chọn bộ thẻ muốn thêm vào.
   - **Field mapping**: kiểm tra mỗi cột (word, pinyin, meaning…) khớp với một trường.
3. Bấm **Import**.

**Mẹo: tạo loại ghi chú riêng một lần.** Tools → Manage Note Types → Add → "Add: Basic" → đặt tên (ví dụ "Tiếng Trung") → Fields → tạo 8 trường theo đúng thứ tự: `word, pinyin, meaning, sentence, sentence_pinyin, sentence_meaning, wubi, hanviet`. Sau đó sửa Cards (mặt trước / mặt sau) theo ý bạn. Các lần import sau chỉ cần chọn loại ghi chú này.

## Import vào AnkiDroid (Android)

1. Chép `anki_deck.tsv` vào điện thoại (hoặc tải trực tiếp trên điện thoại).
2. Mở AnkiDroid → menu **⋮** → **Import** → chọn file.
3. Chọn loại ghi chú và bộ thẻ như trên máy tính, rồi bấm **Import**.

Cách dễ nhất: import trên máy tính rồi **đồng bộ (Sync)** qua AnkiWeb sang điện thoại.

## Nguồn dữ liệu

- Nghĩa tiếng Anh: **CC-CEDICT** (giấy phép CC BY-SA 4.0).
- Mã Ngũ bút (bản 86): **pywubi** (giấy phép MIT).
- Câu ví dụ và bản dịch tiếng Việt: Hán Ngữ Studio. Một số câu hiện mới có bản dịch tiếng Anh; khi đó cột **Nghĩa của câu** hiện tiếng Anh. Bạn có thể sửa sang tiếng Việt ngay trong bảng trước khi tải.
- Pinyin và Hán Việt được tạo tự động; xem lưu ý độ chính xác trong [pinyin.md](pinyin.md#lưu-ý-về-độ-chính-xác) và [hanviet.md](hanviet.md#cách-đọc-kết-quả).

## Lỗi thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| "Vui lòng nhập ít nhất một từ." | Ô nhập đang trống. |
| "Quá nhiều từ (tối đa 1000 từ)." | Chia danh sách thành nhiều lần. |
| "Hãy chọn ít nhất một cột." | Tích ít nhất một cột ở **Cột xuất ra**. |
| "Không tải được dữ liệu…" | Kiểm tra mạng rồi bấm **Tạo bộ thẻ** lần nữa. |
| Anki báo lỗi số cột / thẻ bị lệch trường | Kiểm tra **Field mapping** khi import; loại ghi chú phải có đủ số trường bằng số cột đã chọn. |
| Các dòng `#separator…` thành thẻ | Anki của bạn cũ hơn 2.1.55: bỏ tích **Thêm dòng cấu hình cho Anki** rồi tải lại. |
| Chữ Hán bị lỗi khi mở bằng Excel | Mở bằng Dữ liệu → Từ văn bản/CSV, chọn mã hóa **UTF-8**, dấu phân cách **Tab**. |
