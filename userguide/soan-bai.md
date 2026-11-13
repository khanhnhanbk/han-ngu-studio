# Soạn bài

Dành cho giáo viên: nhập từ mới của một buổi học **một lần**, rồi lấy ra bảng từ, thẻ Anki, đề trắc nghiệm và phiếu tập viết mà không phải dán lại danh sách từ ở từng công cụ.

Trang: https://han-ngu-studio.vercel.app/lesson (trên thanh menu bấm **Soạn bài**).
Bản có ảnh từng bước: https://han-ngu-studio.vercel.app/guide (cuối trang web, mục **Hướng dẫn cho thầy cô**).

## Các bước

1. Bấm **+ Bài mới** (lần đầu đã có sẵn **Bài mẫu** để xem thử).
2. Gõ **Tên bài**, ví dụ "Hán ngữ 1 – Bài 5".
3. Dán đoạn hội thoại hoặc bài đọc vào ô **Bài khóa / đoạn văn (không bắt buộc)**, rồi bấm **Lấy từ trong đoạn văn →**. Các từ trong đoạn văn được thêm vào ô **Từ mới (mỗi dòng một từ)**. Xóa bớt những từ học viên đã biết.
   - Hoặc gõ thẳng danh sách từ vào ô **Từ mới (mỗi dòng một từ)**.
4. Ở mục **Lấy ra**, chọn một thẻ:
   - **Bảng từ**: Pinyin, Hán Việt, nghĩa, cấp HSK. Bấm vào ô để sửa. Rồi bấm:
     - **Copy cho Word / Google Docs**: dán vào Word hoặc Google Docs thành bảng có viền.
     - **Copy cho Google Sheets / Excel**: dán vào ô A1, mỗi cột một ô.
     - **Copy để dán Zalo**: danh sách đánh số "1. 学习 (xué xí) – học; tìm hiểu".
     - **Copy cho Quizlet / Wordwall**: trong Quizlet chọn Tạo học phần → Nhập → dán, giữ mặc định "Tab" và "Dòng mới".
     - **Tải CSV**: mở bằng Excel hoặc Google Sheets.
     - **In / lưu PDF**: trong hộp thoại in, chọn "Lưu dưới dạng PDF" để có file PDF.
   - **Slide**: xem mục [Làm slide](#làm-slide) bên dưới.
   - **Thẻ Anki**: bấm **Tạo bộ thẻ**, rồi tải file .apkg (xem [anki.md](anki.md)).
   - **Trắc nghiệm**: chọn dạng câu hỏi, làm thử hoặc in đề kèm đáp án (xem [quiz.md](quiz.md)).
   - **Phiếu tập viết**: chỉnh ô, cỡ chữ rồi in (xem [practice-sheet.md](practice-sheet.md)).

## Bài được lưu ở đâu

- Bài chỉ lưu trong **trình duyệt trên máy này**, không gửi đi đâu.
- Đổi máy, đổi trình duyệt, dùng chế độ ẩn danh hoặc xóa dữ liệu trình duyệt thì mất bài. Thỉnh thoảng bấm **Sao lưu (.json)** để giữ file.
- Sang máy khác: bấm **Nhập file sao lưu** và chọn file .json đã lưu. Bài trùng thì bản trong file thay bản trên máy.

## Dán cả bài (không cần dọn trước)

1. Mở file của bạn (Word, PDF, trang web), bấm **Ctrl+A** rồi **Ctrl+C**.
2. Bấm vào ô **Dán cả bài vào đây** và bấm **Ctrl+V**. Hoặc bấm **Chọn file Word (.docx)** để đưa thẳng file vào; file được đọc ngay trong trình duyệt, không gửi đi đâu.
3. Web tự xếp từng dòng:
   - Dòng là một từ (tối đa 4 chữ Hán), có thể kèm pinyin và nghĩa như `1. 早 zǎo` hay `学习 xuéxí học tập`: vào ô **Từ mới (mỗi dòng một từ)**. Pinyin và nghĩa bạn ghi được giữ nguyên trong bảng từ. Không cần dấu gạch giữa pinyin và nghĩa: `家 jiā nhà, gia đình` vẫn tách đúng pinyin `jiā` và nghĩa `nhà, gia đình`.
   - Dòng khác có chữ Hán (câu, hội thoại): vào ô **Bài khóa / đoạn văn (không bắt buộc)**, đã bỏ số thứ tự.
   - Dòng không có chữ Hán (tiêu đề, ghi chú, dòng pinyin rời, số trang): bỏ qua. Bấm **Xem … dòng đã bỏ qua** để kiểm tra.
4. Bài mới (chưa có gì) sẽ lấy dòng đầu tiên làm **Tên bài**. Dán thêm lần nữa thì nội dung được nối vào, từ trùng không thêm lại.

## Làm slide

1. Mở thẻ **Slide**.
2. Ở **Chọn mẫu**, chọn một trong bốn:
   - **Thẻ từ**: mỗi từ một slide có chữ to, Pinyin, Hán Việt, nghĩa và một câu ví dụ.
   - **Hỏi – đáp**: slide đầu chỉ có chữ để hỏi cả lớp, slide sau mới hiện đáp án.
   - **Ba trang mỗi từ**: mỗi từ ba slide: thẻ từ có cụm từ hay gặp, rồi hai slide, mỗi slide một câu ví dụ khác nhau.
   - **Mẫu của tôi**: bấm **Chọn file PowerPoint (.pptx)** và chọn mẫu của bạn. Chưa có mẫu thì bấm **Tải mẫu về sửa** để lấy mẫu Thẻ từ làm điểm bắt đầu.
3. Bấm **Tải slide (.pptx)**. File tải về máy, mở bằng PowerPoint, Google Slides (Tệp → Nhập trang trình bày) hoặc Canva.

### Tự làm mẫu riêng

1. Bấm **Tải mẫu về sửa** để lấy một mẫu có sẵn, hoặc mở file PowerPoint của bạn.
2. Gõ các ô dưới đây vào chỗ muốn hiện, giữ cả hai dấu ngoặc nhọn. Đổi phông, màu, ảnh nền tùy ý.

   | Ô | Hiện ra |
   |---|---|
   | `{{chu}}` | Từ / chữ Hán |
   | `{{pinyin}}` | Pinyin |
   | `{{hanviet}}` | Âm Hán Việt |
   | `{{nghia}}` | Nghĩa |
   | `{{vidu}}` | Câu ví dụ |
   | `{{vidu_pinyin}}` | Pinyin của câu ví dụ |
   | `{{vidu_nghia}}` | Nghĩa của câu ví dụ |
   | `{{vidu2}}` | Câu ví dụ thứ hai (khác câu đầu) |
   | `{{vidu2_pinyin}}` | Pinyin của câu ví dụ thứ hai |
   | `{{vidu2_nghia}}` | Nghĩa của câu ví dụ thứ hai |
   | `{{vidu3}}`, `{{vidu3_pinyin}}`, `{{vidu3_nghia}}` | Câu ví dụ thứ ba, Pinyin và nghĩa của nó |
   | `{{cumtu}}` | Cụm từ hay gặp, kèm Pinyin, ví dụ 打扫干净 (dǎsǎo gānjìng) |
   | `{{cumtu2}}` | Cụm từ hay gặp thứ hai |
   | `{{hsk}}` | Cấp HSK |
   | `{{so}}` | Số thứ tự của từ (1, 2, 3…) |
   | `{{bai}}` | Tên bài |

3. Slide nào có ô của từ sẽ được lặp lại cho từng từ, theo đúng thứ tự (có thể là một nhóm nhiều slide, như mẫu Hỏi – đáp hay Ba trang mỗi từ). Slide khác (bìa, kết) giữ một lần. Mẫu một thẻ từ + hai slide ví dụ thì dùng `{{vidu}}` ở slide ví dụ đầu, `{{vidu2}}` ở slide sau, để hai slide không trùng câu.
4. Lưu thành .pptx, chọn **Mẫu của tôi** rồi chọn file đó.
5. Vẽ ô `{{chu}}` đủ rộng cho từ dài nhất (3–4 chữ). Nếu chữ dài hơn ô (hoặc chạm vào hình bên cạnh), web tự thu nhỏ cỡ chữ ở slide đó cho vừa, không để từ bị xuống hàng, và **chưa tải về ngay**: web hiện danh sách "Slide đã làm xong nhưng chưa tải về. Có chữ dài hơn ô trong mẫu, web sẽ tự thu nhỏ cho vừa ô:", ví dụ "大学生: ô {{chu}} còn 68% cỡ chữ". Đọc xong thì bấm **Vẫn tải về (.pptx)**, hoặc **Sửa mẫu trước** để sửa ô trong PowerPoint rồi chọn lại file. Không có chữ nào phải thu nhỏ thì file tải về luôn. Nghĩa và câu ví dụ dài vẫn được xuống hàng nếu ô trong mẫu cao đủ hai dòng.

File của bạn chỉ được đọc trên máy, không gửi đi đâu.

## Lỗi thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| Hiện "Trình duyệt không cho lưu…" | Đang ở chế độ ẩn danh hoặc hết chỗ. Bấm **Sao lưu (.json)** để giữ bài ra file. |
| Hình minh họa giống nhau ở mọi từ | Hình nằm trên slide của từ nên bị lặp theo. Xóa hình khỏi mẫu, tải slide xong mới chèn hình cho từng từ. |
| Ô cụm từ bị trống | Cụm từ được lấy từ các câu ví dụ có sẵn, chỉ khi một cụm xuất hiện ít nhất 2 lần. Nhiều từ không có, thầy cô gõ thêm vào slide. Cụm từ không kèm nghĩa tiếng Việt. |
| Slide ví dụ thứ hai bị trống | Từ đó chỉ có một câu ví dụ trong dữ liệu. Gõ thêm câu vào slide sau khi tải. |
| Hiện "Danh sách từ đã đổi…" ở thẻ Bảng từ | Bấm **Tạo lại bảng từ**. Những chỗ đã sửa trong bảng sẽ mất, nên sửa sau cùng. |
| Bấm Copy không được | Một số trình duyệt chặn copy. Dùng **Tải CSV** thay thế. |
| Dán vào Word ra chữ thường, không phải bảng | Dùng **Copy cho Word / Google Docs** (không phải nút Zalo), và dán bằng Ctrl+V (không chọn "chỉ dán chữ"). |
| Lấy từ trong đoạn văn ra cả từ đã biết | Xóa bớt dòng trong ô **Từ mới**. |
| "Không thấy chữ Hán nào trong phần vừa dán." | Phần vừa dán chỉ có chữ Latin (ví dụ chỉ có pinyin). Hãy copy cả phần có chữ Hán. |
| "Không đọc được file. Hãy chọn file Word đuôi .docx." | File .doc đời cũ hoặc PDF không đọc được: mở file, Ctrl+A, Ctrl+C rồi dán vào ô **Dán cả bài vào đây**. |
| "File này không phải PowerPoint (.pptx)…" | Mẫu đang là .ppt đời cũ, .key hay Google Slides. Mở bằng PowerPoint hoặc Google Slides rồi tải về / lưu thành .pptx. |
| Nghĩa tiếng Việt bị đưa vào cột Pinyin | Thường do nghĩa viết không dấu và giống pinyin (ví dụ `ba me`). Thêm dấu gạch: `爸妈 bàmā – ba mẹ`, hoặc sửa lại trong bảng từ. |
| "Mẫu chưa có slide nào ghi {{chu}}…" | Thêm `{{chu}}` (hoặc ô khác của từ) vào slide muốn lặp cho từng từ. |
| Chữ trên vài slide nhỏ hơn mẫu | Từ hay nghĩa đó dài hơn ô nên web thu nhỏ cho vừa (xem danh sách hiện ra trước khi tải). Muốn giữ chữ to thì kéo rộng ô trong mẫu hoặc dời hình bên cạnh ra xa. |
| "…vẫn chật dù đã thu nhỏ còn 40%…" | Chữ quá dài so với ô, web đã thu tới mức nhỏ nhất. Mở slide đó sửa tay, hoặc làm ô rộng hơn trong mẫu. Web chỉ ước lượng bề rộng chữ (không có phông thật của PowerPoint), nên vẫn nên xem lại slide trong danh sách. |
| "Mẫu có ô web không hiểu…" | Ô bị gõ sai chính tả, ví dụ `{{hanvet}}`. Sửa theo bảng ô ở trên. |
