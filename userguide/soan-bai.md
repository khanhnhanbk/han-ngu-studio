# Soạn bài

Dành cho giáo viên: nhập từ mới của một buổi học **một lần**, rồi lấy ra bảng từ, thẻ Anki, đề trắc nghiệm và phiếu tập viết mà không phải dán lại danh sách từ ở từng công cụ.

Trang: https://han-ngu-studio.vercel.app/lesson (trên thanh menu bấm **Soạn bài**).

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
   - Dòng là một từ (tối đa 4 chữ Hán), có thể kèm pinyin và nghĩa như `1. 早 zǎo` hay `学习 xuéxí học tập`: vào ô **Từ mới (mỗi dòng một từ)**. Pinyin và nghĩa bạn ghi được giữ nguyên trong bảng từ.
   - Dòng khác có chữ Hán (câu, hội thoại): vào ô **Bài khóa / đoạn văn (không bắt buộc)**, đã bỏ số thứ tự.
   - Dòng không có chữ Hán (tiêu đề, ghi chú, dòng pinyin rời, số trang): bỏ qua. Bấm **Xem … dòng đã bỏ qua** để kiểm tra.
4. Bài mới (chưa có gì) sẽ lấy dòng đầu tiên làm **Tên bài**. Dán thêm lần nữa thì nội dung được nối vào, từ trùng không thêm lại.

## Lỗi thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| Hiện "Trình duyệt không cho lưu…" | Đang ở chế độ ẩn danh hoặc hết chỗ. Bấm **Sao lưu (.json)** để giữ bài ra file. |
| Hiện "Danh sách từ đã đổi…" ở thẻ Bảng từ | Bấm **Tạo lại bảng từ**. Những chỗ đã sửa trong bảng sẽ mất, nên sửa sau cùng. |
| Bấm Copy không được | Một số trình duyệt chặn copy. Dùng **Tải CSV** thay thế. |
| Dán vào Word ra chữ thường, không phải bảng | Dùng **Copy cho Word / Google Docs** (không phải nút Zalo), và dán bằng Ctrl+V (không chọn "chỉ dán chữ"). |
| Lấy từ trong đoạn văn ra cả từ đã biết | Xóa bớt dòng trong ô **Từ mới**. |
| "Không thấy chữ Hán nào trong phần vừa dán." | Phần vừa dán chỉ có chữ Latin (ví dụ chỉ có pinyin). Hãy copy cả phần có chữ Hán. |
| "Không đọc được file. Hãy chọn file Word đuôi .docx." | File .doc đời cũ hoặc PDF không đọc được: mở file, Ctrl+A, Ctrl+C rồi dán vào ô **Dán cả bài vào đây**. |
