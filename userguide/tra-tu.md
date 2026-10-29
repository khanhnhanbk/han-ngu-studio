# Tra từ

Tra một từ hoặc một chữ Hán: Pinyin, Hán Việt, cấp HSK, từ loại, nghĩa tiếng Việt, lượng từ, câu ví dụ và các từ bắt đầu bằng nó. Từ trang này có thể mở ngay từ đó ở Chiết tự, Thứ tự nét, Phiếu tập viết, Tạo thẻ Anki và Trắc nghiệm.

Đây là trang tra nhanh cho người học, không phải một từ điển đầy đủ. Muốn đọc cả câu hoặc đoạn văn, hãy dùng **Đọc hiểu**.

**Mở công cụ:** trang chủ → **Công cụ ▾** → **Tra từ**
(hoặc vào thẳng https://han-ngu-studio.vercel.app/tools/tra-tu)

Trong **Đọc hiểu**, bấm vào một từ rồi bấm **Xem đầy đủ** cũng mở từ đó ở trang này.

## Các bước

### 1. Nhập từ cần tra

1. Gõ hoặc dán một từ vào ô **Từ hoặc chữ cần tra**, ví dụ `亲戚`. Có thể nhập chữ Giản thể hoặc Phồn thể.
2. Bấm **Tra**.

Chỉ chữ Hán được giữ lại; dấu câu, khoảng trắng, chữ Latin và số bị bỏ qua.
Lần tra đầu tiên tải dữ liệu khoảng 1,5 MB (danh sách từ, Hán Việt, nghĩa, câu ví dụ). Các lần sau chỉ tải thêm một phần nhỏ của từ điển (khoảng 40–110 KB) cho chữ đầu của từ.

Địa chỉ trang đổi thành `…/tools/tra-tu#w=亲戚`. Bạn có thể lưu hoặc gửi đường dẫn này; phần sau dấu `#` không được gửi lên máy chủ.

### 2. Đọc kết quả

Thẻ kết quả có:

- Chữ lớn ở trên, kèm **Phồn thể** nếu dạng Phồn thể khác (親戚).
- Mỗi **cách đọc** một khối riêng (好 có **hǎo** và **hào**). Mỗi khối có:
  - Pinyin, nút 🔊 (khi đã **Bật phát âm**), cấp HSK và **từ loại** (Danh từ, Động từ, Tính từ, Trợ từ…).
  - **Hán Việt** theo đúng cách đọc đó.
  - **Lượng từ** đi kèm, ghi sẵn cụm (一门亲戚 mén · 一个亲戚 gè · 一位亲戚 wèi).
  - **Nghĩa**: các nghĩa tiếng Việt, đánh số.
- Cách đọc viết hoa (ví dụ **Shū** của 书) là tên riêng, luôn nằm sau các cách đọc thường.
- **Nghĩa tiếng Anh** ở cuối thẻ.

Bên dưới:

- **Câu ví dụ**: tối đa 3 câu, câu dễ trước. Câu có nhãn **dịch máy** được dịch tự động.
- **Từ bắt đầu bằng …**: tối đa 20 từ dài hơn bắt đầu bằng từ vừa tra, từ HSK trước. Bấm vào một từ để tra từ đó.
- **Mở trong công cụ khác**: **Chiết tự** và **Thứ tự nét** (chỉ khi tra một chữ), **Phiếu tập viết**, **Tạo thẻ Anki**, **Trắc nghiệm**.
- **Tra thêm trên Hanzii ↗**: mở trang Hanzii ở tab mới. Chỉ khi bạn bấm, từ này mới được gửi tới Hanzii; Hán Ngữ Studio không gửi gì trước đó.

### 3. Giản thể / Phồn thể

Ở chế độ **Phồn thể** (nút ⚙ trên thanh menu), từ, lượng từ, câu ví dụ và các từ liên quan hiện bằng chữ Phồn thể. Dữ liệu vẫn tra theo Giản thể nên kết quả giống nhau.

## Lỗi thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| "Vui lòng nhập một từ tiếng Trung." | Ô nhập trống hoặc không có chữ Hán. |
| "Đoạn này giống một câu hơn là một từ…" | Bạn dán cả câu. Bấm **Mở Đọc hiểu** và dán câu vào đó để xem nghĩa từng từ. |
| "Không tìm thấy … trong từ điển. Tra từng chữ:" | Từ không có trong từ điển (thường là cụm từ hoặc tên riêng). Bấm từng chữ bên dưới để tra. |
| Không có từ loại | Từ loại chỉ có cho từ trong danh sách HSK 3.0. Cụm từ (不客气, 半天…) và từ ngoài danh sách không có. Từ loại ghi cho cả từ, không ghi riêng từng nghĩa. |
| Nghĩa tiếng Việt chưa tự nhiên | Từ điển CVDICT được dịch máy từ CC-CEDICT rồi rà soát lại, nên đôi khi còn vụng. Xem thêm **Nghĩa tiếng Anh**. |
| Câu ví dụ không có bản dịch | Một số câu Tatoeba chưa được dịch. Câu có bản dịch luôn đứng trước. |
| "Không tải được dữ liệu…" | Kiểm tra mạng rồi bấm **Tra** lần nữa. |

## Nguồn dữ liệu

- Cấp HSK và từ loại: danh sách từ vựng HSK 3.0 của Bộ Giáo dục Trung Quốc (GF 0025-2021), dữ liệu [ivankra/hsk30](https://github.com/ivankra/hsk30) (MIT).
- Nghĩa tiếng Việt và lượng từ: từ điển [CVDICT](https://github.com/ph0ngp/CVDICT) của Phong Phan (CC BY-SA 4.0), dịch máy từ CC-CEDICT và được rà soát lại.
- Nghĩa tiếng Anh: **CC-CEDICT** (CC BY-SA 4.0).
- Âm Hán Việt: [hanviet-pinyin-wordlist](https://github.com/ph0ngp/hanviet-pinyin-wordlist) của Phong Phan (MIT), Hán Ngữ Studio chỉnh sửa một số chữ.
- Câu ví dụ: Hán Ngữ Studio và **Tatoeba** (CC BY 2.0 FR); bản dịch câu Tatoeba do **Google Dịch** tạo sẵn một lần.
