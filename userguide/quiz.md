# Trắc nghiệm từ vựng

Nhập danh sách từ vựng, công cụ tự tạo **câu hỏi trắc nghiệm** để bạn làm ngay trên trình duyệt, hoặc **in ra giấy** kèm đáp án. Có 6 loại câu hỏi:

| Loại câu hỏi | Đề bài | Chọn đáp án (ví dụ với 大学) |
|---|---|---|
| **Chữ Hán → Nghĩa** | 大学 | đại học, trường đại học |
| **Nghĩa → Chữ Hán** | nghĩa của từ | 大学 |
| **Chữ Hán → Pinyin** | 大学 | dà xué (các đáp án sai thường chỉ khác thanh điệu: dà xuě, dà xuè…) |
| **Chữ Hán → Âm Hán Việt** | 大学 | đại học |
| **Điền từ vào câu** | 我在＿＿学习。 (Nghĩa của câu: Tôi đang học đại học.) | 大学 |
| **Sắp xếp câu** | Nghĩa: Tôi đang học đại học. Các từ: 学习 / 我 / 大学 / 在 。 | 我在大学学习。 |

Bốn loại đầu có 4 đáp án (ít hơn nếu danh sách quá ngắn và không đủ đáp án sai khác nhau). **Điền từ vào câu** và **Sắp xếp câu** dùng câu ví dụ có sẵn (cùng kho câu với công cụ Tạo thẻ Anki, khoảng 9.600 từ). Mỗi lần bấm **Tạo bài trắc nghiệm**, công cụ chọn ngẫu nhiên một trong 3 câu dễ nhất của từ, nên làm lại đề sẽ gặp câu khác. Nhãn **dịch máy** cạnh **Nghĩa của câu** nghĩa là bản dịch do Google Dịch tạo.

**Mở công cụ:** trang chủ → **Công cụ ▾** → **Trắc nghiệm**
(hoặc vào thẳng https://han-ngu-studio.vercel.app/tools/quiz)

## Các bước

### 1. Nhập từ vựng

- Gõ hoặc dán vào ô lớn, **mỗi dòng một từ**; hoặc
- bấm nút **Chọn file** dưới dòng **Hoặc tải file (.txt, .tsv)**.

Dòng **Số từ: … / 200** cho biết số từ (tối đa 200). Từ trùng lặp được tự động bỏ.

**Nghĩa lấy từ đâu?** Nghĩa mặc định là **tiếng Việt** theo danh sách từ vựng HSK 3.0 (khoảng 10.800 từ). Từ không có trong danh sách dùng nghĩa **tiếng Anh** (CC-CEDICT). Để dùng nghĩa của bạn, ghi nghĩa **sau dấu Tab** trên cùng dòng:

```
大学	đại học
学习	học tập
朋友	bạn bè
```

Cách dễ nhất: soạn hai cột (cột A là từ, cột B là nghĩa) trong Excel hoặc Google Sheets, chọn cả hai cột, sao chép rồi dán vào ô. Hoặc lưu thành file `.tsv` rồi tải lên.

Đáp án sai của câu **Chữ Hán → Nghĩa** luôn cùng ngôn ngữ với đáp án đúng: nghĩa tiếng Việt (của bạn hoặc của danh sách HSK) đi với nghĩa tiếng Việt, nghĩa tiếng Anh đi với nghĩa tiếng Anh, để không đoán được đáp án nhờ ngôn ngữ.

### 2. Chọn **Loại câu hỏi**

Mặc định tích cả 6 loại. Bỏ tích loại bạn không muốn luyện.

Với **Điền từ vào câu** và **Sắp xếp câu**, từ chưa có câu ví dụ (hoặc câu ví dụ chưa có bản dịch) sẽ được bỏ qua. **Sắp xếp câu** cũng bỏ qua câu quá ngắn (dưới 3 từ) hoặc quá dài (trên 12 từ).

Ở **Thứ tự câu hỏi**, chọn:

- **Ngẫu nhiên** (mặc định): mọi loại câu hỏi trộn lẫn, mỗi lần tạo một khác.
- **Theo loại câu hỏi**: đề chia thành từng phần, theo thứ tự các loại ở trên (hết **Chữ Hán → Nghĩa** rồi đến **Nghĩa → Chữ Hán**…). Trong mỗi phần, các từ giữ đúng thứ tự bạn nhập. Đề in ra và file TSV cũng theo thứ tự này.

Ở cả hai cách, các đáp án A–D (và các từ của câu sắp xếp) luôn được xáo trộn.

### 3. Bấm **Tạo bài trắc nghiệm**

Lần đầu tiên, nút hiện **Đang tạo câu hỏi…** vài giây để tải dữ liệu. Các lần sau gần như tức thì.

### 4. Làm bài

- Dòng **Câu … / …** và thanh tiến độ cho biết bạn đang ở câu nào.
- Bấm vào một đáp án (hoặc nhấn phím **1**, **2**, **3**, **4** trên bàn phím).
  - Đúng: hiện **Đúng rồi!**
  - Sai: hiện **Chưa đúng. Đáp án đúng được tô xanh.** Đáp án bạn chọn có dấu ✗, đáp án đúng có dấu ✓.
- Câu **Điền từ vào câu**: chọn từ đúng cho chỗ trống `＿＿`. Dòng **Nghĩa của câu** cho biết câu cần nói gì: nhiều từ có thể đúng ngữ pháp (他是我的＿＿ có thể là 朋友 hay 老师), đáp án là từ khớp với nghĩa này.
- Câu **Sắp xếp câu**: bấm lần lượt các từ bên dưới theo đúng thứ tự. Bấm nhầm thì bấm vào từ đã chọn để bỏ ra. Dấu câu cuối (。？！) đã được đặt sẵn. Chọn đủ các từ rồi bấm **Kiểm tra**. Nếu sai, trang hiện **Câu đúng**. Đáp án là câu gốc khớp với **Nghĩa của câu**; một thứ tự khác dù đúng ngữ pháp cũng tính là sai.
- Bấm **Câu tiếp theo** (hoặc nhấn **Enter**). Ở câu cuối, nút là **Xem kết quả**.
- Muốn dừng giữa chừng: bấm **Dừng bài**. Kết quả chỉ tính các câu đã trả lời.

### 5. Xem **Kết quả**

- **Bạn trả lời đúng … / … câu.**
- **Các câu trả lời sai**: mỗi câu ghi **Bạn chọn** và **Đáp án**.
- Các nút:
  - **Làm lại câu sai**: chỉ làm lại các câu sai, đáp án được xáo lại.
  - **Trộn lại và làm lại**: làm lại toàn bộ bài theo thứ tự mới. Nếu đã chọn **Theo loại câu hỏi**, thứ tự câu hỏi giữ nguyên, chỉ các đáp án được xáo lại.
  - **Sửa danh sách từ**: quay lại bước 1 (danh sách từ vẫn còn).

### 6. In đề hoặc tải file

Khi đang làm bài hoặc ở trang **Kết quả**, có hai nút:

- **In đề / Lưu PDF**: mở hộp thoại in của trình duyệt. Đề gồm dòng **Họ tên / Lớp / Ngày**, các câu hỏi đánh số (đáp án A, B, C, D; câu sắp xếp có dòng kẻ để viết), và trang **Đáp án** riêng ở cuối. Muốn lưu PDF, chọn máy in **Lưu dưới dạng PDF / Save as PDF**. Chỉ in đề cho học sinh: ở mục **Trang**, bỏ trang cuối (trang Đáp án).
- **Tải .tsv**: lưu file `trac_nghiem.tsv` với các cột `type, question, hint, A, B, C, D, answer`. Mở bằng Excel / Google Sheets, hoặc chép sang Quizizz, Kahoot… (kiểm tra lại thứ tự cột theo mẫu của từng trang). Câu sắp xếp ghi các từ ở cột `question` và câu đúng ở cột `answer`.

Mỗi lần bấm **Tạo bài trắc nghiệm** hay **Trộn lại và làm lại**, câu hỏi và đáp án được xáo lại, nên đề in ra cũng khác. In đề ngay sau khi tạo nếu muốn đề trùng với bài đang làm.

### Khung **Không tạo được câu hỏi**

Nếu có, khung này liệt kê từ nào bị bỏ qua ở loại câu hỏi nào. Lý do: thiếu dữ liệu (ví dụ từ không có trong từ điển, nghĩa trong từ điển chỉ là "xem từ khác", hoặc chưa có câu ví dụ), hoặc không tìm được đáp án sai nào khác đáp án đúng. Công cụ **không tự đoán** dữ liệu còn thiếu. Với nghĩa, bạn có thể tự ghi nghĩa sau dấu Tab.

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
| Một từ vẫn hiện nghĩa tiếng Anh | Từ đó không có trong danh sách HSK 3.0. Ghi nghĩa tiếng Việt của bạn sau dấu Tab. |
| Nghĩa tiếng Anh dài hoặc chưa sát | Nghĩa lấy từ CC-CEDICT, mỗi từ chỉ có một mục. Ghi nghĩa tiếng Việt của bạn sau dấu Tab. |
| Đề in ra bị lẫn thanh menu hoặc nút bấm | Dùng nút **In đề / Lưu PDF** của trang (không dùng ảnh chụp màn hình). Trong hộp thoại in, đặt **Lề** là **Mặc định**. |
| File PDF bị lỗi phông: Pinyin (lǚ, nǐ…) hoặc chữ tiếng Việt có dấu hiện sang phông khác | Dùng nút **In đề / Lưu PDF** của trang (nút này tải đủ phông trước khi mở hộp thoại in). Nếu vẫn lỗi, đợi trang tải xong rồi bấm lại. Nên dùng Chrome hoặc Edge và chọn **Lưu dưới dạng PDF**. |
| Muốn đề chia theo từng phần (mỗi loại câu hỏi một phần) | Ở **Thứ tự câu hỏi**, chọn **Theo loại câu hỏi** rồi bấm **Tạo bài trắc nghiệm** lại. |
| Muốn câu điền từ cho chính các từ khó | Câu ví dụ có sẵn cho khoảng 9.600 từ (gần hết danh sách HSK 3.0); từ ngoài danh sách thường bị bỏ qua ở hai loại câu này. |
| **Nghĩa của câu** chưa sát | Câu có nhãn **dịch máy** được dịch tự động bằng Google Dịch và có thể chưa chính xác. |
| Một chữ có nhiều cách đọc (好 hǎo / hào) | Pinyin và Hán Việt theo cách đọc phổ biến. Các cách đọc khác của chữ đó không bao giờ được dùng làm đáp án sai. |

## Nguồn dữ liệu

- Nghĩa tiếng Việt: Hán Ngữ Studio, theo danh sách từ vựng HSK 3.0.
- Nghĩa tiếng Anh: **CC-CEDICT** (giấy phép CC BY-SA 4.0).
- Pinyin: **pinyin-pro** (MIT), tạo tự động; xem lưu ý trong [pinyin.md](pinyin.md#lưu-ý-về-độ-chính-xác).
- Âm Hán Việt: Hán Ngữ Studio; xem [hanviet.md](hanviet.md#cách-đọc-kết-quả).
- Câu ví dụ: Hán Ngữ Studio và **Tatoeba** (tatoeba.org, CC BY 2.0 FR). Bản dịch câu Tatoeba: **Google Dịch**, tạo một lần khi xây dựng dữ liệu (nhãn **dịch máy**). Một số câu chỉ có bản dịch tiếng Anh; khi đó **Nghĩa của câu** hiện tiếng Anh.
- Danh sách từ của bạn chỉ được xử lý trên máy bạn, không gửi đi đâu.
