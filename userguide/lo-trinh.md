# Lộ trình 1000 chữ

Học **1000 chữ Hán thông dụng nhất** theo một thứ tự có sẵn, chia thành **10 chặng**, mỗi chặng khoảng 100 chữ. Lộ trình có **đủ mọi chữ HSK 1–3**, phần còn lại là các chữ thông dụng nhất.

Thứ tự được sắp để dễ nhớ: **thành phần học trước, chữ ghép từ nó học sau**. Ví dụ 尔 đứng ngay trước 你, 木 đứng trước 林 và 森. Ngoài ra chữ càng thông dụng càng đứng trước.

**Mở công cụ:** trang chủ → **Công cụ ▾** → **Lộ trình 1000 chữ** (nhóm **Chữ Hán**)
(hoặc vào thẳng https://han-ngu-studio.vercel.app/tools/path)

Lần mở đầu tiên tải dữ liệu khoảng 1,7 MB (phân tích chữ, danh sách HSK, Hán Việt).

## Các bước

### 1. Chọn chặng

Khung **Các chặng** có 10 ô, từ **Chặng 1** đến **Chặng 10**. Mỗi ô có vài chữ đầu của chặng và thanh tiến độ **Đã học …/100**. Dòng **Đã học …/1000 chữ** ở góc trên cho biết tổng tiến độ.

Bấm vào một ô để mở chặng đó. Địa chỉ trang đổi thành `…/tools/path#chang=5`, nên bạn có thể lưu lại hoặc gửi đúng chặng đang học.

### 2. Học các chữ trong chặng

Mỗi chữ có một ô với:

- Chữ lớn: bấm vào để mở chữ đó trong **Chiết tự** (thành phần, mẹo nhớ, chữ qua các thời kỳ…).
- Âm Hán Việt và nhãn cách tạo chữ (**Hình thanh**, **Hội ý**, **Tượng hình**) nếu có.
- Nghĩa tiếng Việt ngắn (nếu chữ có trong danh sách HSK).
- Ô **Đã học**: đánh dấu khi bạn đã nhớ chữ. Bấm lần nữa để bỏ đánh dấu.

Khung **Họ chữ cùng phần gợi âm** (nếu có) gom các chữ trong chặng có chung phần gợi âm, ví dụ `艮 → 眼 根`. Chúng thường đọc gần giống nhau, nên học cùng lúc sẽ dễ nhớ hơn.

### 3. Ôn với Anki hoặc tập viết

- **Tạo thẻ Anki cho chặng này**: mở **Tạo thẻ Anki** với 100 chữ của chặng điền sẵn. Bấm **Tạo bộ thẻ** rồi tải file `.apkg` (có giọng đọc và thẻ **Nghe**, xem [anki.md](anki.md)).
- **Tạo phiếu tập viết**: mở **Phiếu tập viết** với các chữ của chặng, kèm dải thứ tự nét.

### 4. Lưu và chuyển tiến độ

Tiến độ (các chữ đã đánh dấu **Đã học**) **chỉ lưu trên trình duyệt này**, không gửi đi đâu.

- **Tải tiến độ (TSV)**: tải file `lo-trinh-da-hoc.tsv` (mỗi dòng một chữ và ngày đánh dấu).
- **Nhập tiến độ từ file TSV**: bấm **Chọn file**, chọn file đã tải để chuyển tiến độ sang máy hoặc trình duyệt khác.

## Chữ phồn thể

Khi bật **Phồn thể** trên thanh menu, các chữ hiện ở dạng phồn thể. Thứ tự và chặng không đổi (lộ trình tính theo chữ giản thể).

## Lỗi thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| "Không tải được dữ liệu…" | Kiểm tra mạng rồi tải lại trang. |
| Mất tiến độ | Tiến độ nằm trong bộ nhớ trình duyệt: xóa dữ liệu duyệt web, dùng chế độ ẩn danh hoặc đổi trình duyệt đều làm mất. Hãy **Tải tiến độ (TSV)** thường xuyên. |
| "Trình duyệt không cho lưu…" | Trình duyệt đang chặn lưu dữ liệu (thường do chế độ ẩn danh). Đánh dấu xong hãy bấm **Tải tiến độ (TSV)**. |
| Một chữ không có nghĩa tiếng Việt | Chữ đó không đứng riêng thành từ trong danh sách HSK. Bấm vào chữ để xem thêm ở **Chiết tự**, hoặc tra ở **Tra từ**. |

## Nguồn dữ liệu

Thứ tự thông dụng: SUBTLEX-CH (Cai & Brysbaert, 2010). Thành phần và cách tạo chữ: Make Me a Hanzi (LGPL-3.0). Cấp HSK: danh sách HSK 3.0. Nghĩa tiếng Việt: CVDICT của Phong Phan (CC BY-SA 4.0). Âm Hán Việt: hanviet-pinyin-wordlist của Phong Phan (MIT), có chỉnh sửa.
