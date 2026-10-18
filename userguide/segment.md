# Ngắt từ tiếng Trung

Tiếng Trung viết liền, không có khoảng trắng giữa các từ. Công cụ này tách câu thành từng từ, ví dụ:

`我喜欢学习中文。` → `我 喜欢 学习 中文。`

**Mở công cụ:** trang chủ → **Công cụ ▾** → **Ngắt từ**
(hoặc vào thẳng https://han-ngu-studio.vercel.app/tools/segment)

## Các bước

1. **Dán văn bản** tiếng Trung vào ô lớn ("Dán văn bản tiếng Trung vào đây…").
   - Có thể dán nhiều dòng; kết quả giữ nguyên xuống dòng.
   - Tối đa **5000 ký tự**. Số ký tự hiện ở góc dưới bên trái ô nhập (`… / 5000`).
2. Bấm **Ngắt từ**.
   - Lần đầu tiên, nút hiện **Đang xử lý…** trong vài giây vì trang đang tải từ điển (khoảng 1 MB). Các lần sau gần như tức thì.
3. Kết quả hiện bên dưới. Chữ Latin (ví dụ `Python`) và số (ví dụ `2024`) được giữ nguyên thành một từ.
4. Dùng kết quả:
   - **Sao chép**: chép kết quả để dán sang nơi khác (nút đổi thành **Đã sao chép**).
   - **Tải .txt**: tải file `segmented.txt` về máy.

## Chữ phồn thể

Bấm **繁** trên thanh menu để nhận kết quả bằng chữ phồn thể, kể cả khi bạn gõ giản thể. Từ được ngắt giống như với chữ giản thể (我們去銀行 → 我們 去 銀行). Xem [Giản thể / Phồn thể](README.md#giản-thể--phồn-thể).

## Lỗi thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| "Vui lòng nhập văn bản tiếng Trung." | Ô nhập đang trống. |
| "Văn bản quá dài (tối đa 5000 ký tự)." | Chia văn bản thành nhiều phần và tách từng phần. |
| "Không tải được từ điển. Vui lòng kiểm tra kết nối mạng và thử lại." | Kiểm tra mạng rồi bấm **Ngắt từ** lần nữa. |
| Một từ bị tách chưa đúng | Công cụ chọn cách tách dựa trên tần suất từ; với tên riêng hoặc từ hiếm có thể chưa chính xác. Hãy sửa tay trong kết quả đã sao chép. |
| Chữ phồn thể hiện sai mặt chữ (ví dụ 發 ở chỗ cần 髮) | Một số chữ giản thể ứng với nhiều chữ phồn thể (发 → 發 / 髮); bộ chuyển đổi chọn theo ngữ cảnh và đôi khi chọn nhầm. Hãy gõ thẳng chữ phồn thể đúng. |
| Đứng mãi ở "Đang tải bộ chuyển đổi Phồn thể…" hoặc báo "Không tải được bộ chuyển đổi Phồn thể…" | Kiểm tra mạng rồi tải lại trang, hoặc bấm **简** để dùng giản thể. |
