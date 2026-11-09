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
| **Từ loại** | Danh từ |

**Cấp HSK** và **Nghĩa tiếng Việt** lấy từ danh sách từ vựng HSK 3.0 (khoảng 11.000 từ, cấp 1 đến 7-9) và từ điển CVDICT. Một từ có trong nhiều cấp thì ghi cấp thấp nhất. Chữ đa âm lấy nghĩa theo cách đọc ở cột Pinyin (好 hǎo: "tốt; thích hợp; đúng; …", không lấy nghĩa của hào). **Từ loại** cũng lấy từ danh sách HSK 3.0, ghi cho cả từ (爱好: Động từ, Danh từ); cụm từ và từ ngoài danh sách để trống.

**Mở công cụ:** trang chủ → **Công cụ ▾** → **Tạo thẻ Anki**
(hoặc vào thẳng https://han-ngu-studio.vercel.app/tools/anki)

## Các bước

Mở từ **Đọc hiểu** (nút **→ Tạo thẻ Anki** trong **Danh sách học**) thì ô nhập đã có sẵn các từ bạn chọn; danh sách được truyền trong địa chỉ trang (phần sau dấu `#`), không gửi lên máy chủ.

### 1. Nhập từ vựng

- Gõ hoặc dán vào ô lớn, **mỗi dòng một từ**; hoặc
- bấm nút **Chọn file** dưới dòng **Hoặc tải file (.txt)** (file `.txt`, mỗi dòng một từ).
- dùng khung **Thêm từ theo cấp HSK**: chọn **Cấp** (HSK 1 … 7-9) rồi bấm **Thêm vào danh sách** để thêm mọi từ của cấp đó vào ô lớn (thêm vào sau các từ đang có). Cấp có hơn 1000 từ (HSK 5, 6, 7-9) có thêm ô **Phần** để chọn từng phần. Ô **Bỏ qua từ đã đánh dấu “đã biết” trong Đọc hiểu** (bật sẵn) bỏ những từ bạn đã đánh dấu đã biết ở công cụ Đọc hiểu trên trình duyệt này. Dòng bên dưới cho biết đã thêm bao nhiêu từ, bỏ qua bao nhiêu.

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

### 6. Tải bộ thẻ

**Cách dễ nhất: file .apkg** (khung **Tải bộ thẻ cho Anki**):

1. **Tên bộ thẻ**: mặc định **Tiếng Trung**. Dùng `::` để tạo bộ thẻ con, ví dụ `Tiếng Trung::HSK 1`.
2. **Loại thẻ (mỗi loại tạo một thẻ cho mỗi từ)**: mặc định **Nhận diện** và **Nhớ chữ**; có thể chọn thêm **Câu ví dụ** và **Gõ chữ**. Rê chuột lên tên để xem mô tả.
3. Bấm **Tải bộ thẻ Anki (.apkg)**. Lần đầu, trang tải bộ SQLite (khoảng 0,3 MB) để tạo file ngay trên máy bạn; không gửi gì lên mạng. File tải về có tên theo bộ thẻ, ví dụ `Tiếng Trung - HSK 1.apkg`.

Cột bạn bỏ tích ở **Cột xuất ra** sẽ để trống trong thẻ. Xem cách mở file ở mục [Import file .apkg](#import-file-apkg-cách-dễ-nhất).

**Hoặc xuất bảng (.tsv) để tự import:**

- **Tải .tsv**: lưu file `anki_deck.tsv` vào thư mục Tải xuống.
- **Sao chép**: chép toàn bộ nội dung (dán vào Excel / Google Sheets nếu muốn chỉnh tiếp).

## Chữ phồn thể

Chọn **繁 Phồn thể** (nút **⚙** trên thanh menu → **Loại chữ**) trước khi bấm **Tạo bộ thẻ**: cột **Từ vựng** và **Câu ví dụ** hiện bằng chữ phồn thể (学习 → 學習), cột **Ngũ bút** dùng mã của chữ phồn thể (學 → wfqb). Bạn có thể gõ từ bằng giản thể hoặc phồn thể; 學習 và 学习 tính là một từ. Nghĩa, Pinyin, Hán Việt và cấp HSK giữ nguyên.

Đổi **简 / 繁** sau khi tạo bộ thẻ thì bảng hiện lại theo loại chữ mới, **mất các chỉnh sửa** bạn đã gõ trong bảng. Xem [Giản thể / Phồn thể](README.md#giản-thể--phồn-thể).

## Import file .apkg (cách dễ nhất)

- **Máy tính**: bấm đúp vào file `.apkg` (Anki tự mở và import), hoặc trong Anki chọn **File → Import** rồi chọn file.
- **AnkiDroid**: mở file bằng AnkiDroid (từ thư mục Tải xuống), hoặc trong AnkiDroid bấm **⋮ → Import**.

File đã có sẵn bộ thẻ, loại ghi chú **Hán Ngữ Studio 2** với 5 mẫu thẻ và các thẻ mới theo thứ tự danh sách của bạn. Không cần tạo trường hay dán mẫu thẻ.

### Ôn trên điện thoại: thẻ **Nghe** và giọng đọc

- Ô **Kèm giọng đọc người thật** (bật sẵn) gói file phát âm của từng từ vào file `.apkg` (giọng người thật của audio-cmn). Dữ liệu giọng đọc chỉ được tải khi bạn bấm tải bộ thẻ; dòng bên dưới nút cho biết tiến độ, số từ có giọng đọc và dung lượng file. Từ không có bản ghi riêng thì dùng âm tiết ghép lại; từ có thanh nhẹ mà không có bản ghi thì không có âm thanh.
- Thẻ **Nghe**: mở thẻ là Anki tự đọc từ, bạn nhớ lại chữ và nghĩa rồi chạm để xem đáp án. Không phải gõ, hợp để ôn trên điện thoại. Thẻ Nghe chỉ được tạo cho từ có giọng đọc.
- Các thẻ khác đọc từ khi lật mặt sau. Thẻ **Nhận diện** còn có dòng **Mẹo nhớ** cho các chữ có mẹo gợi ý (hiện là chữ HSK 1).
- Mặc định chọn sẵn **Nghe**, **Nhận diện** và **Nhớ chữ**: ba loại không cần gõ. **Gõ chữ** chỉ nên bật khi ôn trên máy tính.

### Ảnh minh họa (không bắt buộc)

Sau khi bấm **Tạo bộ thẻ**, khung **Ảnh minh họa (không bắt buộc)** cho phép chọn ảnh cho từng từ. Ảnh lấy từ **Openverse** (kho ảnh có giấy phép mở) và được gói luôn vào file `.apkg`, nên **dùng được cả trên điện thoại**.

1. Đánh dấu **Tôi đồng ý gửi từ khóa tìm ảnh tới Openverse**. Mỗi lần tìm chỉ gửi **một từ khóa ngắn**: nghĩa tiếng Anh của từ, sửa được trong ô bên cạnh từ. Không gửi câu hay văn bản nào khác. Lựa chọn này **không được lưu**: lần sau mở trang cần đánh dấu lại.
2. Kiểm tra ô từ khóa của từng từ. Ô trống nghĩa là chưa có từ khóa hợp lý: gõ một từ tiếng Anh (ví dụ `cat` cho 猫), hoặc để trống để bỏ qua từ đó.
3. Bấm **Tìm ảnh cho trang này**: công cụ tìm lần lượt 10 từ của trang, mỗi từ hiện tối đa 6 ảnh. Dùng **‹ ›** để sang trang khác, **Tìm** để tìm lại một từ.
4. Bấm vào ảnh để chọn (có viền màu); bấm lại hoặc **Bỏ ảnh** để bỏ chọn. Dòng chữ nhỏ dưới ảnh ghi tên ảnh, tác giả và giấy phép.
5. Bấm tải file `.apkg` như bình thường. Ảnh đã chọn được thu nhỏ (cạnh dài 400 px) và gói vào file; thẻ hiện ảnh ở mặt sau kèm dòng ghi nguồn.

Ảnh hợp nhất với danh từ cụ thể (táo, mèo, máy bay). Từ trừu tượng như 的, 了 nên bỏ qua.

**Đã import bộ thẻ cũ (loại ghi chú "Hán Ngữ Studio")?** File mới dùng loại ghi chú mới **Hán Ngữ Studio 2**, nên Anki thêm thẻ mới chứ không sửa thẻ cũ. Nếu không cần lịch ôn của bộ cũ nữa, bạn có thể xóa bộ cũ trong Anki rồi dùng bộ mới.

## Import file .tsv vào Anki trên máy tính

> **Mới dùng Anki?** Trang [Dùng bộ thẻ với Anki](https://han-ngu-studio.vercel.app/tools/anki/huong-dan) (nút **Hướng dẫn dùng với Anki và mẫu thẻ có sẵn →** ở trang Tạo thẻ Anki) hướng dẫn từng bước và có 4 mẫu thẻ dán sẵn: **Nhận diện**, **Nhớ chữ**, **Câu ví dụ**, **Gõ chữ**, kèm xem trước.

1. Mở Anki, bấm **File → Import** (Tệp → Nhập) và chọn `anki_deck.tsv`.
2. Trong cửa sổ import:
   - **Field separator** (Dấu phân cách): **Tab** (tự nhận nếu bật dòng cấu hình).
   - **Notetype** (Loại ghi chú): chọn loại ghi chú có đủ trường (xem mẹo bên dưới).
   - **Deck** (Bộ thẻ): chọn bộ thẻ muốn thêm vào.
   - **Field mapping**: kiểm tra mỗi cột (word, pinyin, meaning…) khớp với một trường.
3. Bấm **Import**.

**Mẹo: tạo loại ghi chú riêng một lần.** Tools → Manage Note Types → Add → "Add: Basic" → đặt tên (ví dụ "Tiếng Trung") → Fields → tạo 11 trường theo đúng thứ tự: `word, pinyin, meaning, sentence, sentence_pinyin, sentence_meaning, wubi, hanviet, hsk_level, meaning_vi, pos`. Sau đó vào Cards và dán mẫu thẻ có sẵn ở [trang hướng dẫn Anki](https://han-ngu-studio.vercel.app/tools/anki/huong-dan#mau-the). Vì tên trường giống hệt tên cột, Anki 2.1.55 trở lên tự ghép cột vào trường khi import. Các lần import sau chỉ cần chọn loại ghi chú này.

## Import vào AnkiDroid (Android)

1. Chép `anki_deck.tsv` vào điện thoại (hoặc tải trực tiếp trên điện thoại).
2. Mở AnkiDroid → menu **⋮** → **Import** → chọn file.
3. Chọn loại ghi chú và bộ thẻ như trên máy tính, rồi bấm **Import**.

Cách dễ nhất: import trên máy tính rồi **đồng bộ (Sync)** qua AnkiWeb sang điện thoại.

## Nguồn dữ liệu

- Nghĩa tiếng Anh: **CC-CEDICT** (giấy phép CC BY-SA 4.0).
- Mã Ngũ bút (bản 86): **pywubi** (giấy phép MIT).
- Cấp HSK: danh sách từ vựng HSK 3.0 của Bộ Giáo dục Trung Quốc (GF 0025-2021), dữ liệu [ivankra/hsk30](https://github.com/ivankra/hsk30) (MIT).
- Nghĩa tiếng Việt: từ điển [CVDICT](https://github.com/ph0ngp/CVDICT) của Phong Phan (CC BY-SA 4.0), dịch máy từ CC-CEDICT và được rà soát lại, nên đôi khi còn chưa tự nhiên.
- Câu ví dụ: Hán Ngữ Studio và **Tatoeba** (tatoeba.org, giấy phép CC BY 2.0 FR). Bản dịch của câu Tatoeba do **Google Dịch** tạo một lần khi xây dựng dữ liệu (nhãn **dịch máy**); trang web không gửi gì cho Google. Một số câu chỉ có bản dịch tiếng Anh; khi đó cột **Nghĩa của câu** hiện tiếng Anh. Bạn có thể sửa sang tiếng Việt ngay trong bảng trước khi tải.
- Pinyin và Hán Việt được tạo tự động; xem lưu ý độ chính xác trong [pinyin.md](pinyin.md#lưu-ý-về-độ-chính-xác) và [hanviet.md](hanviet.md#cách-đọc-kết-quả).

## Lỗi thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| "Openverse đang giới hạn số lần tìm…" | Khi không đăng nhập, Openverse chỉ cho khoảng 20 lần tìm mỗi phút và 200 lần mỗi ngày. Đợi một lúc rồi bấm **Tìm ảnh cho trang này** để tìm tiếp; các từ đã có ảnh không bị tìm lại. |
| "… ảnh không tải được nên bị bỏ qua." | Ảnh đó tạm thời không tải được. Chọn ảnh khác cho từ đó rồi tải lại bộ thẻ. |
| Thẻ không phát âm | Trên AnkiDroid, kiểm tra âm lượng phương tiện và mục **Cài đặt → Âm thanh** (tự phát âm thanh). Trên máy tính, bấm biểu tượng ▶ trên thẻ. Từ ghi “… từ chưa có giọng đọc” khi tải thì không có file âm thanh. |
| Có hai bộ thẻ trùng từ sau khi import | Bộ cũ dùng loại ghi chú **Hán Ngữ Studio**, bộ mới dùng **Hán Ngữ Studio 2**. Xóa bộ cũ nếu không cần lịch ôn của nó. |
| "… từ chưa thêm vì vượt 1000 từ" | Ô lớn chỉ nhận tối đa 1000 từ. Xóa bớt từ trong ô, hoặc tạo bộ thẻ cho từng phần một. |
| "Vui lòng nhập ít nhất một từ." | Ô nhập đang trống. |
| "Quá nhiều từ (tối đa 1000 từ)." | Chia danh sách thành nhiều lần. |
| "Hãy chọn ít nhất một cột." | Tích ít nhất một cột ở **Cột xuất ra**. |
| "Không tải được dữ liệu…" | Kiểm tra mạng rồi bấm **Tạo bộ thẻ** lần nữa. |
| "Hãy chọn ít nhất một loại thẻ." | Tích ít nhất một ô ở **Loại thẻ** trước khi bấm **Tải bộ thẻ Anki (.apkg)**. |
| "Không tạo được file .apkg…" | Bấm lại; nếu vẫn lỗi (trình duyệt quá cũ), dùng **Tải .tsv** và làm theo [trang hướng dẫn Anki](https://han-ngu-studio.vercel.app/tools/anki/huong-dan). |
| Import lại file .apkg nhưng không thấy thẻ mới | Anki bỏ qua các từ đã có và không đổi. Từ bạn sửa trên trang được cập nhật; loại thẻ mới chọn thêm được thêm vào. |
| Sửa một ghi chú trong Anki thì có thêm thẻ lạ | Anki tự tạo các loại thẻ bạn chưa chọn khi ghi chú được sửa. Vào **Browse**, chọn các thẻ đó, bấm **Suspend** (Tạm ngưng) hoặc xóa. |
| Có hai loại ghi chú tên Hán Ngữ Studio | Bạn đã tự tạo một loại theo cách .tsv trước đó; loại từ file .apkg là loại riêng (Anki có thể thêm số vào tên). Cả hai đều dùng được. |
| Loại ghi chú cũ chỉ có 8 trường (trước khi có cột HSK) | Hai cột mới nằm ở cuối nên 8 cột đầu vẫn khớp. Bỏ tích **Cấp HSK** và **Nghĩa tiếng Việt**, hoặc thêm hai trường `hsk_level`, `meaning_vi` vào cuối loại ghi chú. |
| Loại ghi chú cũ có 10 trường (trước khi có cột **Từ loại**) | Cột `pos` nằm cuối nên 10 cột đầu vẫn khớp. Bỏ tích **Từ loại**, hoặc thêm trường `pos` vào cuối loại ghi chú. File .apkg mới tự thêm trường này; nếu Anki tạo loại ghi chú thứ hai (có số trong tên), cả hai đều dùng được. |
| Anki báo lỗi số cột / thẻ bị lệch trường | Kiểm tra **Field mapping** khi import; loại ghi chú phải có đủ số trường bằng số cột đã chọn. |
| Các dòng `#separator…` thành thẻ | Anki của bạn cũ hơn 2.1.55: bỏ tích **Thêm dòng cấu hình cho Anki** rồi tải lại. |
| Ô câu ví dụ trong Anki hiện chữ `<br>` | File được tạo với 2–3 câu ví dụ nên dùng HTML. Giữ ô **Thêm dòng cấu hình cho Anki** (dòng `#html:true`), hoặc khi import tích **Allow HTML in fields**. |
| Bản dịch câu ví dụ chưa sát nghĩa | Câu có nhãn **dịch máy** được dịch tự động và có thể chưa chính xác. Sửa ngay trong bảng trước khi tải. |
| Chữ Hán bị lỗi khi mở bằng Excel | Mở bằng Dữ liệu → Từ văn bản/CSV, chọn mã hóa **UTF-8**, dấu phân cách **Tab**. |
| Chữ phồn thể hiện sai mặt chữ (ví dụ 發 ở chỗ cần 髮) | Một số chữ giản thể ứng với nhiều chữ phồn thể (发 → 發 / 髮); bộ chuyển đổi chọn theo ngữ cảnh và đôi khi chọn nhầm. Hãy sửa tay trước khi dùng. |
| Đứng mãi ở "Đang tải bộ chuyển đổi Phồn thể…" hoặc báo "Không tải được bộ chuyển đổi Phồn thể…" | Kiểm tra mạng rồi tải lại trang, hoặc bấm **简** để dùng giản thể. |
