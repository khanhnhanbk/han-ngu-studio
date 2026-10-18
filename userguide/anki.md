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
| **Cấp HSK** | HSK 1 |
| **Nghĩa tiếng Việt** | đại học, trường đại học |

**Cấp HSK** và **Nghĩa tiếng Việt** lấy từ danh sách từ vựng HSK 3.0 (khoảng 10.800 từ, cấp 1 đến 7-9). Một từ có trong nhiều cấp thì ghi cấp thấp nhất. Chữ đa âm lấy nghĩa theo cách đọc ở cột Pinyin (好 hǎo: "tốt; rất", không lấy nghĩa của hào).

**Mở công cụ:** trang chủ → **Công cụ ▾** → **Tạo thẻ Anki**
(hoặc vào thẳng https://han-ngu-studio.vercel.app/tools/anki)

## Các bước

### 1. Nhập từ vựng

- Gõ hoặc dán vào ô lớn, **mỗi dòng một từ**; hoặc
- bấm nút **Chọn file** dưới dòng **Hoặc tải file (.txt)** (file `.txt`, mỗi dòng một từ).

Dòng **Số từ: … / 1000** cho biết số từ (tối đa 1000). Từ trùng lặp được tự động bỏ.

Ô **Số câu ví dụ mỗi thẻ** (1, 2 hoặc 3; mặc định 1): mỗi thẻ có bấy nhiêu câu ví dụ. Có khoảng 9.600 từ (gần hết danh sách HSK 3.0) có câu ví dụ, nhiều từ có tới 15 câu. Công cụ chọn **câu dễ nhất**: ít từ khó hơn cấp HSK của từ đang học nhất, rồi đến câu ngắn hơn. Với 2–3 câu, mỗi câu nằm trên một dòng riêng trong cùng một ô của Anki.

### 2. Bấm **Tạo bộ thẻ**

Lần đầu tiên, nút hiện **Đang xử lý…** vài giây để tải dữ liệu (khoảng 3–5 MB, câu ví dụ chỉ tải phần chứa từ của bạn). Các lần sau gần như tức thì.

Nếu đổi **Số câu ví dụ mỗi thẻ** sau khi đã tạo, hãy bấm **Tạo bộ thẻ** lại (nội dung đã sửa trong bảng sẽ mất).

### 3. Chọn cột

Ở phần **Cột xuất ra**, bỏ tích các cột bạn không cần (ví dụ **Ngũ bút**). Thứ tự cột luôn giữ nguyên như bảng ở trên.

Ô **Thêm dòng cấu hình cho Anki (#columns…)** (mặc định bật): thêm 3 dòng đầu file để Anki 2.1.55 trở lên tự nhận dấu Tab và tên cột. Nếu dùng Anki cũ hơn và thấy các dòng `#…` bị nhập thành thẻ, hãy bỏ tích ô này.

### 4. Xem trước và chỉnh sửa

Bảng **Xem trước và chỉnh sửa** hiện tất cả thẻ. **Bấm vào ô bất kỳ để sửa** (ví dụ rút gọn nghĩa, đổi câu ví dụ). Nội dung đã sửa sẽ có trong file tải về. Khi có 2–3 câu ví dụ, ba ô câu ví dụ có nhiều dòng: mỗi dòng là một câu, hãy giữ các dòng khớp nhau giữa **Câu ví dụ**, **Pinyin của câu** và **Nghĩa của câu**.

Nhãn **dịch máy** cạnh ô **Nghĩa của câu**: bản dịch của câu này do Google Dịch tạo, chưa được người kiểm tra. Hãy đọc lại trước khi học.

Trên điện thoại, kéo ngang bảng để xem các cột bên phải.

### 5. Kiểm tra mục **Không tìm thấy**

Nếu có, khung **Không tìm thấy** liệt kê:
- **Chưa có nghĩa**: từ không có trong từ điển (thường là cụm từ dài hoặc chữ phồn thể). Hãy tự điền vào ô Nghĩa.
- **Chưa có câu ví dụ**: chưa có câu cho từ này. Hãy tự điền vào ô Câu ví dụ (cột Pinyin của câu sẽ không tự cập nhật).
- **Chưa có trong danh sách HSK**: từ không thuộc danh sách HSK 3.0, nên cột **Cấp HSK** và **Nghĩa tiếng Việt** để trống. Bạn có thể tự điền nghĩa tiếng Việt.

### 6. Tải file

- **Tải .tsv**: lưu file `anki_deck.tsv` vào thư mục Tải xuống.
- **Sao chép**: chép toàn bộ nội dung (dán vào Excel / Google Sheets nếu muốn chỉnh tiếp).

## Chữ phồn thể

Bấm **繁** trên thanh menu trước khi bấm **Tạo bộ thẻ**: cột **Từ vựng** và **Câu ví dụ** hiện bằng chữ phồn thể (学习 → 學習), cột **Ngũ bút** dùng mã của chữ phồn thể (學 → wfqb). Bạn có thể gõ từ bằng giản thể hoặc phồn thể; 學習 và 学习 tính là một từ. Nghĩa, Pinyin, Hán Việt và cấp HSK giữ nguyên.

Đổi **简 / 繁** sau khi tạo bộ thẻ thì bảng hiện lại theo loại chữ mới, **mất các chỉnh sửa** bạn đã gõ trong bảng. Xem [Giản thể / Phồn thể](README.md#giản-thể--phồn-thể).

## Import vào Anki trên máy tính

> **Mới dùng Anki?** Trang [Dùng bộ thẻ với Anki](https://han-ngu-studio.vercel.app/tools/anki/huong-dan) (nút **Hướng dẫn dùng với Anki và mẫu thẻ có sẵn →** ở trang Tạo thẻ Anki) hướng dẫn từng bước và có 4 mẫu thẻ dán sẵn: **Nhận diện**, **Nhớ chữ**, **Câu ví dụ**, **Gõ chữ**, kèm xem trước.

1. Mở Anki, bấm **File → Import** (Tệp → Nhập) và chọn `anki_deck.tsv`.
2. Trong cửa sổ import:
   - **Field separator** (Dấu phân cách): **Tab** (tự nhận nếu bật dòng cấu hình).
   - **Notetype** (Loại ghi chú): chọn loại ghi chú có đủ trường (xem mẹo bên dưới).
   - **Deck** (Bộ thẻ): chọn bộ thẻ muốn thêm vào.
   - **Field mapping**: kiểm tra mỗi cột (word, pinyin, meaning…) khớp với một trường.
3. Bấm **Import**.

**Mẹo: tạo loại ghi chú riêng một lần.** Tools → Manage Note Types → Add → "Add: Basic" → đặt tên (ví dụ "Tiếng Trung") → Fields → tạo 10 trường theo đúng thứ tự: `word, pinyin, meaning, sentence, sentence_pinyin, sentence_meaning, wubi, hanviet, hsk_level, meaning_vi`. Sau đó vào Cards và dán mẫu thẻ có sẵn ở [trang hướng dẫn Anki](https://han-ngu-studio.vercel.app/tools/anki/huong-dan#mau-the). Vì tên trường giống hệt tên cột, Anki 2.1.55 trở lên tự ghép cột vào trường khi import. Các lần import sau chỉ cần chọn loại ghi chú này.

## Import vào AnkiDroid (Android)

1. Chép `anki_deck.tsv` vào điện thoại (hoặc tải trực tiếp trên điện thoại).
2. Mở AnkiDroid → menu **⋮** → **Import** → chọn file.
3. Chọn loại ghi chú và bộ thẻ như trên máy tính, rồi bấm **Import**.

Cách dễ nhất: import trên máy tính rồi **đồng bộ (Sync)** qua AnkiWeb sang điện thoại.

## Nguồn dữ liệu

- Nghĩa tiếng Anh: **CC-CEDICT** (giấy phép CC BY-SA 4.0).
- Mã Ngũ bút (bản 86): **pywubi** (giấy phép MIT).
- Cấp HSK và nghĩa tiếng Việt: Hán Ngữ Studio, theo danh sách từ vựng HSK 3.0.
- Câu ví dụ: Hán Ngữ Studio và **Tatoeba** (tatoeba.org, giấy phép CC BY 2.0 FR). Bản dịch của câu Tatoeba do **Google Dịch** tạo một lần khi xây dựng dữ liệu (nhãn **dịch máy**); trang web không gửi gì cho Google. Một số câu chỉ có bản dịch tiếng Anh; khi đó cột **Nghĩa của câu** hiện tiếng Anh. Bạn có thể sửa sang tiếng Việt ngay trong bảng trước khi tải.
- Pinyin và Hán Việt được tạo tự động; xem lưu ý độ chính xác trong [pinyin.md](pinyin.md#lưu-ý-về-độ-chính-xác) và [hanviet.md](hanviet.md#cách-đọc-kết-quả).

## Lỗi thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| "Vui lòng nhập ít nhất một từ." | Ô nhập đang trống. |
| "Quá nhiều từ (tối đa 1000 từ)." | Chia danh sách thành nhiều lần. |
| "Hãy chọn ít nhất một cột." | Tích ít nhất một cột ở **Cột xuất ra**. |
| "Không tải được dữ liệu…" | Kiểm tra mạng rồi bấm **Tạo bộ thẻ** lần nữa. |
| Loại ghi chú cũ chỉ có 8 trường (trước khi có cột HSK) | Hai cột mới nằm ở cuối nên 8 cột đầu vẫn khớp. Bỏ tích **Cấp HSK** và **Nghĩa tiếng Việt**, hoặc thêm hai trường `hsk_level`, `meaning_vi` vào cuối loại ghi chú. |
| Anki báo lỗi số cột / thẻ bị lệch trường | Kiểm tra **Field mapping** khi import; loại ghi chú phải có đủ số trường bằng số cột đã chọn. |
| Các dòng `#separator…` thành thẻ | Anki của bạn cũ hơn 2.1.55: bỏ tích **Thêm dòng cấu hình cho Anki** rồi tải lại. |
| Ô câu ví dụ trong Anki hiện chữ `<br>` | File được tạo với 2–3 câu ví dụ nên dùng HTML. Giữ ô **Thêm dòng cấu hình cho Anki** (dòng `#html:true`), hoặc khi import tích **Allow HTML in fields**. |
| Bản dịch câu ví dụ chưa sát nghĩa | Câu có nhãn **dịch máy** được dịch tự động và có thể chưa chính xác. Sửa ngay trong bảng trước khi tải. |
| Chữ Hán bị lỗi khi mở bằng Excel | Mở bằng Dữ liệu → Từ văn bản/CSV, chọn mã hóa **UTF-8**, dấu phân cách **Tab**. |
| Chữ phồn thể hiện sai mặt chữ (ví dụ 發 ở chỗ cần 髮) | Một số chữ giản thể ứng với nhiều chữ phồn thể (发 → 發 / 髮); bộ chuyển đổi chọn theo ngữ cảnh và đôi khi chọn nhầm. Hãy sửa tay trước khi dùng. |
| Đứng mãi ở "Đang tải bộ chuyển đổi Phồn thể…" hoặc báo "Không tải được bộ chuyển đổi Phồn thể…" | Kiểm tra mạng rồi tải lại trang, hoặc bấm **简** để dùng giản thể. |
