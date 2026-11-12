# Câu "Miễn phí, không cần tài khoản" ở đầu và cuối trang chủ

12/11/2026. Việc 2 trong 6 việc học từ tinhtiemxan.com (người mới vào trang cần thấy ngay: miễn phí, không đăng ký, chữ không bị gửi đi).

## Làm

- `hero.badge`: "Miễn phí · Không cần tài khoản" (trước: "Không cần cài đặt"). EN: "Free · No account needed".
- `hero.trustNote` (dòng nhỏ dưới 2 nút): "Chữ bạn gõ chỉ xử lý trên máy bạn, không gửi đi đâu." EN: "What you type is processed on your device and never sent anywhere."
- `cta.subtitle` (khối cuối trang): giữ "Miễn phí, không cần tài khoản, không cần cài đặt." + câu không gửi chữ đi.

## Đúng sự thật

Đúng với HARD RULE 4 trong CLAUDE.md: chữ người dùng xử lý trong trình duyệt; những thứ được giữ lại (bài soạn, chữ đã học, ghi chú) chỉ nằm trong trình duyệt của chính người đó. Giọng đọc online và ảnh Anki chỉ chạy khi người dùng tự bật, và chỉ gửi một từ, nên câu "chữ bạn gõ" (văn bản) vẫn đúng.

Chỉ đổi chữ trong `lib/i18n/vi.ts` / `en.ts`, không đổi component.
