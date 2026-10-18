# Chuyển chữ Hán sang Hán Việt

Dán câu hoặc đoạn văn tiếng Trung: công cụ **ngắt từ**, ghi **Pinyin** và **âm Hán Việt** cho từng từ. Ví dụ:

| Ngắt từ | 我 | 喜欢 | 学习 | 中文 |
|---|---|---|---|---|
| Pinyin | wǒ | xǐhuan | xuéxí | zhōngwén |
| Hán Việt | ngã | hỷ_hoan | học_tập | trung_văn |

Âm Hán Việt được chọn **theo cách đọc của chữ trong câu**: 银**行** (yínháng) → ngân_**hàng**, nhưng **行**走 (xíngzǒu) → **hành**_tẩu.

**Mở công cụ:** trang chủ → **Công cụ ▾** → **Hán Việt**
(hoặc vào thẳng https://han-ngu-studio.vercel.app/tools/hanviet)

## Các bước

### 1. Nhập văn bản

- **Gõ hoặc dán** vào ô lớn ("Dán văn bản tiếng Trung vào đây…"), có thể nhiều dòng; hoặc
- bấm nút **Chọn file** dưới dòng **Hoặc tải file (.txt)**.

Tối đa **5000 ký tự** (đếm ở góc dưới bên trái ô nhập). Hiện công cụ đọc **chữ giản thể**; chữ phồn thể có thể không có âm Hán Việt.

### 2. Bấm **Chuyển Hán Việt**

Lần đầu tiên, nút hiện **Đang xử lý…** vài giây để tải từ điển (khoảng 1,3 MB). Các lần sau gần như tức thì.

### 3. Chọn kiểu kết quả

Bấm một trong ba thẻ phía trên kết quả:

| Thẻ | Nội dung | Nút |
|---|---|---|
| **Theo từ** | Mỗi từ là một ô: Pinyin ở trên, chữ Hán ở giữa, Hán Việt ở dưới. **Bấm vào một ô** để mở bảng **Chi tiết** | (chỉ xem) |
| **Văn bản** | Mỗi câu ba dòng: **Ngắt từ**, **Pinyin**, **Hán Việt** | **Sao chép**, **Tải .txt** (`hanviet.txt`) |
| **Bảng TSV** | Mỗi câu một hàng, 4 cột: câu gốc, ngắt từ, Pinyin, Hán Việt (có hàng tiêu đề) | **Sao chép**, **Tải .tsv** (`hanviet.tsv`) |

### 4. Xem chi tiết một từ

Ở thẻ **Theo từ**, bấm vào một từ. Bảng **Chi tiết** hiện bên dưới, mỗi chữ một hàng:

- **Âm đang dùng**: Pinyin của chữ trong câu và âm Hán Việt tương ứng.
- **Tất cả âm đọc**: mọi âm Hán Việt của chữ, theo từng cách đọc Pinyin (ví dụ 当: `dang1: đương / đang`, `dang4: đáng`). "mọi cách đọc" nghĩa là âm đó dùng cho mọi Pinyin của chữ.

Bấm **Đóng** để ẩn bảng.

## Cách đọc kết quả

- Âm của các chữ trong một từ ghép nối bằng **`_`**: 中国 → `trung_quốc`.
- Chữ có nhiều âm Hán Việt cho cùng một cách đọc được ghi cách nhau bằng **`/`**: 当 (dāng) → `đương/đang`. Hãy chọn âm phù hợp nghĩa.
- Dấu câu, chữ Latin và số được giữ nguyên.
- Chữ không có trong dữ liệu Hán Việt được giữ nguyên chữ Hán.
- Pinyin có thể sai ở một số chữ đa âm (xem [pinyin.md](pinyin.md#lưu-ý-về-độ-chính-xác)); khi Pinyin sai, âm Hán Việt cũng có thể sai.

**Mở file .tsv:** xem hướng dẫn trong [pinyin.md](pinyin.md#4-chọn-kiểu-kết-quả) (Excel: mã hóa UTF-8; Google Sheets: dấu phân cách Tab).

## Lỗi thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| "Vui lòng nhập văn bản tiếng Trung." | Ô nhập đang trống. |
| "Văn bản quá dài (tối đa 5000 ký tự)." | Chia văn bản thành nhiều phần. |
| "Chỉ hỗ trợ file .txt." | Lưu file Word thành **Plain Text (.txt)**, mã hóa **UTF-8**. |
| "Không tải được dữ liệu…" | Kiểm tra mạng rồi bấm **Chuyển Hán Việt** lần nữa. |
| Một chữ hiện nguyên chữ Hán, không có âm | Chữ đó (thường là chữ phồn thể hoặc chữ hiếm) chưa có trong dữ liệu. |
