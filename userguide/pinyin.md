# Chuyển chữ Hán sang Pinyin

Dán một chữ, một câu hay cả đoạn văn để nhận Pinyin. Chữ đa âm được đọc theo **ngữ cảnh của cả câu**, ví dụ:

- 我去**银行**取钱，然后**行**走回家。 → yín**háng** … **xíng**zǒu
- 他**长**大了，头发很**长**。 → **zhǎng**dà … hěn **cháng**

**Mở công cụ:** trang chủ → **Công cụ ▾** → **Chuyển Pinyin**
(hoặc vào thẳng https://han-ngu-studio.vercel.app/tools/pinyin)

## Các bước

### 1. Nhập văn bản

- **Gõ hoặc dán** vào ô lớn ("Dán văn bản tiếng Trung vào đây…"), có thể nhiều dòng; hoặc
- bấm nút chọn file dưới dòng **Hoặc tải file (.txt)**.

Tối đa **5000 ký tự** (đếm ở góc dưới bên trái ô nhập).

### 2. Chọn cách hiển thị

| Tùy chọn | Lựa chọn | Ví dụ |
|---|---|---|
| **Kiểu thanh điệu** | **Dấu thanh (nǐ hǎo)**: dấu trên nguyên âm, dễ đọc nhất | nǐ hǎo |
| | **Số (ni3 hao3)**: số thanh sau âm tiết; thanh nhẹ là 5 | ni3 hao3, de5 |
| | **Không dấu (ni hao)**: bỏ thanh điệu | ni hao |
| **Cách viết** | **Theo từ (nǐhǎo)**: âm tiết trong một từ viết liền, đúng chuẩn Pinyin | yínháng, xī'ān |
| | **Theo âm tiết (nǐ hǎo)**: mỗi âm tiết cách nhau, dễ đối chiếu từng chữ | yín háng |

Ở chế độ **Theo từ**, dấu `'` được thêm trước âm tiết bắt đầu bằng a, o, e (ví dụ `xī'ān` 西安) để không đọc nhầm thành `xiān`.

### 3. Bấm **Chuyển Pinyin**

Lần đầu tiên, nút hiện **Đang xử lý…** vài giây để tải từ điển (khoảng 1 MB).

Sau khi có kết quả, bạn có thể **đổi Kiểu thanh điệu hoặc Cách viết**: kết quả cập nhật ngay, không cần bấm lại.

### 4. Chọn kiểu kết quả

Bấm một trong ba thẻ phía trên kết quả:

| Thẻ | Nội dung | Nút |
|---|---|---|
| **Chỉ Pinyin** | Chỉ Pinyin, giữ nguyên xuống dòng. Dấu câu tiếng Trung được đổi sang dấu Latin (`，` → `,`) | **Sao chép**, **Tải .txt** (`pinyin.txt`) |
| **Pinyin trên chữ** | Pinyin nhỏ hiện trên đầu mỗi chữ Hán, tiện để đọc theo hoặc chụp màn hình cho học viên | (chỉ xem) |
| **Bảng TSV** | Mỗi dòng: câu gốc, dấu Tab, Pinyin. Mở bằng Excel / Google Sheets, hoặc import vào Anki | **Sao chép**, **Tải .tsv** (`pinyin.tsv`) |

**Mở file .tsv bằng Excel:** Excel → Mở → chọn `pinyin.tsv`; nếu chữ Hán bị lỗi font, dùng Dữ liệu → Từ văn bản/CSV và chọn mã hóa **UTF-8**. Google Sheets: Tệp → Nhập → Tải lên → Loại dấu phân cách: **Tab**.

## Lưu ý về độ chính xác

Pinyin được tạo tự động và **đúng với hầu hết câu thông dụng**, nhưng có thể sai ở một số chữ đa âm. Hãy kiểm tra lại trước khi dùng để dạy. Ví dụ đã biết:

| Câu | Kết quả công cụ | Đúng là |
|---|---|---|
| 还书 (trả sách) | hái shū | **huán**shū |
| 东西 (đồ vật) | dōngxī | dōng**xi** (thanh nhẹ) |

Ngoài ra, công cụ áp dụng **biến điệu của 一 và 不** như trong sách giáo khoa: 一起 → **yì**qǐ, 不是 → **bú**shì.

## Lỗi thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| "Vui lòng nhập văn bản tiếng Trung." | Ô nhập đang trống. |
| "Văn bản quá dài (tối đa 5000 ký tự)." | Chia văn bản thành nhiều phần. |
| "Chỉ hỗ trợ file .txt." | Lưu file Word thành **Plain Text (.txt)**, mã hóa **UTF-8**. |
| "Không tải được từ điển…" | Kiểm tra mạng rồi bấm **Chuyển Pinyin** lần nữa. |
| Chữ hiếm hiện nguyên chữ Hán, không có Pinyin | Chữ đó không có trong bộ dữ liệu Pinyin; hãy tra từ điển và sửa tay. |
