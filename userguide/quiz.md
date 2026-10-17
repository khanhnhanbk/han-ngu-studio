# Trắc nghiệm từ vựng

Nhập danh sách từ vựng, công cụ tự tạo **câu hỏi trắc nghiệm** để bạn làm ngay trên trình duyệt. Có 4 loại câu hỏi:

| Loại câu hỏi | Đề bài | Chọn đáp án (ví dụ với 大学) |
|---|---|---|
| **Chữ Hán → Nghĩa** | 大学 | the Great Learning, one of the Four Books in Confucianism; university; college |
| **Nghĩa → Chữ Hán** | nghĩa của từ | 大学 |
| **Chữ Hán → Pinyin** | 大学 | dà xué (các đáp án sai thường chỉ khác thanh điệu: dà xuě, dà xuè…) |
| **Chữ Hán → Âm Hán Việt** | 大学 | đại học |

Mỗi câu có 4 đáp án (ít hơn nếu danh sách quá ngắn và không đủ đáp án sai khác nhau).

**Mở công cụ:** trang chủ → **Công cụ ▾** → **Trắc nghiệm**
(hoặc vào thẳng https://han-ngu-studio.vercel.app/tools/quiz)

## Các bước

### 1. Nhập từ vựng

- Gõ hoặc dán vào ô lớn, **mỗi dòng một từ**; hoặc
- bấm nút **Chọn file** dưới dòng **Hoặc tải file (.txt, .tsv)**.

Dòng **Số từ: … / 200** cho biết số từ (tối đa 200). Từ trùng lặp được tự động bỏ.

**Muốn dùng nghĩa tiếng Việt?** Nghĩa mặc định là tiếng Anh (CC-CEDICT). Để dùng nghĩa của bạn, ghi nghĩa **sau dấu Tab** trên cùng dòng:

```
大学	đại học
学习	học tập
朋友	bạn bè
```

Cách dễ nhất: soạn hai cột (cột A là từ, cột B là nghĩa) trong Excel hoặc Google Sheets, chọn cả hai cột, sao chép rồi dán vào ô. Hoặc lưu thành file `.tsv` rồi tải lên.

Khi một từ có nghĩa riêng của bạn, các đáp án sai của câu **Chữ Hán → Nghĩa** cũng chỉ lấy từ nghĩa bạn đã ghi (để không lẫn tiếng Việt với tiếng Anh). Vì vậy hãy ghi nghĩa cho **ít nhất 4 từ**.

### 2. Chọn **Loại câu hỏi**

Mặc định tích cả 4 loại. Bỏ tích loại bạn không muốn luyện.

### 3. Bấm **Tạo bài trắc nghiệm**

Lần đầu tiên, nút hiện **Đang tạo câu hỏi…** vài giây để tải dữ liệu. Các lần sau gần như tức thì. Câu hỏi được xáo trộn ngẫu nhiên, mỗi lần tạo một khác.

### 4. Làm bài

- Dòng **Câu … / …** và thanh tiến độ cho biết bạn đang ở câu nào.
- Bấm vào một đáp án (hoặc nhấn phím **1**, **2**, **3**, **4** trên bàn phím).
  - Đúng: hiện **Đúng rồi!**
  - Sai: hiện **Chưa đúng. Đáp án đúng được tô xanh.** Đáp án bạn chọn có dấu ✗, đáp án đúng có dấu ✓.
- Bấm **Câu tiếp theo** (hoặc nhấn **Enter**). Ở câu cuối, nút là **Xem kết quả**.
- Muốn dừng giữa chừng: bấm **Dừng bài**. Kết quả chỉ tính các câu đã trả lời.

### 5. Xem **Kết quả**

- **Bạn trả lời đúng … / … câu.**
- **Các câu trả lời sai**: mỗi câu ghi **Bạn chọn** và **Đáp án**.
- Các nút:
  - **Làm lại câu sai**: chỉ làm lại các câu sai, đáp án được xáo lại.
  - **Trộn lại và làm lại**: làm lại toàn bộ bài theo thứ tự mới.
  - **Sửa danh sách từ**: quay lại bước 1 (danh sách từ vẫn còn).

### Khung **Không tạo được câu hỏi**

Nếu có, khung này liệt kê từ nào bị bỏ qua ở loại câu hỏi nào. Lý do: thiếu dữ liệu (ví dụ từ không có trong từ điển, hoặc nghĩa trong từ điển chỉ là "xem từ khác"), hoặc không tìm được đáp án sai nào khác đáp án đúng. Công cụ **không tự đoán** dữ liệu còn thiếu. Với nghĩa, bạn có thể tự ghi nghĩa sau dấu Tab.

## Lỗi thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| "Vui lòng nhập ít nhất một từ." | Ô nhập đang trống. |
| "Quá nhiều từ (tối đa 200 từ)." | Chia danh sách thành nhiều bài. |
| "Hãy chọn ít nhất một loại câu hỏi." | Tích ít nhất một ô ở **Loại câu hỏi**. |
| "Chỉ hỗ trợ file .txt hoặc .tsv." | Lưu danh sách dưới dạng `.txt` hoặc `.tsv` (Excel: Lưu thành → Văn bản Unicode / Tab delimited). |
| "Không tạo được câu hỏi nào…" | Các từ đều thiếu dữ liệu cho loại câu hỏi đã chọn. Thêm từ khác hoặc chọn thêm loại câu hỏi. |
| "Không tải được dữ liệu…" | Kiểm tra mạng rồi bấm **Tạo bài trắc nghiệm** lần nữa. |
| Gõ phím Tab trong ô nhập thì con trỏ nhảy ra ngoài | Trình duyệt dùng Tab để chuyển ô. Hãy dán từ Excel / Google Sheets, hoặc soạn trong Notepad rồi dán vào. |
| Nghĩa tiếng Anh dài hoặc chưa sát | Nghĩa lấy từ CC-CEDICT, mỗi từ chỉ có một mục. Ghi nghĩa tiếng Việt của bạn sau dấu Tab. |
| Một chữ có nhiều cách đọc (好 hǎo / hào) | Pinyin và Hán Việt theo cách đọc phổ biến. Các cách đọc khác của chữ đó không bao giờ được dùng làm đáp án sai. |

## Nguồn dữ liệu

- Nghĩa tiếng Anh: **CC-CEDICT** (giấy phép CC BY-SA 4.0).
- Pinyin: **pinyin-pro** (MIT), tạo tự động; xem lưu ý trong [pinyin.md](pinyin.md#lưu-ý-về-độ-chính-xác).
- Âm Hán Việt: Hán Ngữ Studio; xem [hanviet.md](hanviet.md#cách-đọc-kết-quả).
- Danh sách từ của bạn chỉ được xử lý trên máy bạn, không gửi đi đâu.
