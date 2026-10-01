# Plan: Đăng nhập và tài khoản (bước 1 của app)

## Context
Bước 1 của `plan-app-di-dong.md`. Web đã có đăng nhập/đăng ký/quên mật khẩu/tài khoản trên Supabase (`web-novel-platform/documents/plan-dang-nhap-dang-ky.md`); app làm cùng luật, cùng thông báo lỗi, dùng lại `api.ts`, `schemas.ts`, `shared.ts` đã chép.

Đã chốt với người dùng (01/10/2026):
- **Không bắt đăng nhập khi mở app**: khách đọc được như web; chỉ hỏi đăng nhập khi cần (theo dõi, bình luận, chấm điểm... ở các bước sau) hoặc khi tự vào tab Tài khoản. Đúng cả App Store Guideline 5.1.1.
- **Cách đăng nhập**: email + mật khẩu, và các provider web đang bật (`EXPO_PUBLIC_AUTH_PROVIDERS`, hiện chỉ có Google). **Đăng nhập Apple để sau**: cần tài khoản Apple Developer và build app riêng (Expo Go không có).

Kiểm tra trước khi làm: Supabase Auth đang **bật captcha** (gọi đăng nhập không kèm mã trả `captcha_failed`), nên form email bắt buộc có Turnstile.

**Trạng thái:** ✅ Xong trừ đăng nhập Apple (01/10/2026). Kết quả kiểm tra ở mục 6.

---

## 1. Màn hình

| Route (`src/app/`) | Màn | Cách mở |
|---|---|---|
| `(auth)/login` | Đăng nhập | Cửa sổ trượt lên (modal) từ bất kỳ đâu; đăng nhập xong đóng lại, về đúng chỗ cũ (thay cho `?next=` của web) |
| `(auth)/register` | Tạo tài khoản | Đổi qua lại với Đăng nhập trong cùng modal (`replace`) |
| `(auth)/forgot-password` | Quên mật khẩu | Đi tiếp từ Đăng nhập |
| `(auth)/reset-password` | Đặt mật khẩu mới | Deep link trong email (`webtruyen://reset-password?code=...`): đổi mã lấy phiên tạm rồi hiện form |
| `(auth)/auth/callback` | Hoàn tất đăng nhập | Deep link xác nhận email (`?code=`): đổi mã lấy phiên rồi về Trang chủ |
| `(tabs)/account` | Tài khoản | Khách: lời mời đăng nhập/tạo tài khoản. Đã đăng nhập: thẻ hồ sơ + danh sách mục. Cả hai có giao diện sáng/tối và link trang web |
| `account/profile` | Hồ sơ | Tên hiển thị, ảnh đại diện (chọn ảnh, cắt vuông, 128×128 WebP), email (chỉ xem) |
| `account/password` | Đổi mật khẩu | Chỉ tài khoản email; tài khoản Google thấy lời giải thích |
| `account/delete` | Xóa tài khoản | Xác nhận bằng mật khẩu (tài khoản email) hoặc gõ lại email (Google), như web |

Root layout có `unstable_settings.anchor = '(tabs)'` để mở app thẳng từ deep link vẫn có thanh tab bên dưới.

## 2. Đăng nhập Google (và provider khác)
`signInWithProvider` mở trang Google trong trình duyệt của app (`WebBrowser.openAuthSessionAsync`), quay về `webtruyen://auth/callback` (Expo Go: `exp://.../--/auth/callback`) rồi đổi mã lấy phiên ngay trong hàm. Người dùng đóng trình duyệt thì không báo lỗi. Cần thêm hai địa chỉ này vào **Supabase → Authentication → Redirect URLs** (mục 6 của plan tổng).

## 3. Captcha (Cloudflare Turnstile)
- `useCaptcha()` cùng API với web (`element`, `token()`, `reset()`), dùng ở đăng nhập, đăng ký, quên mật khẩu, đổi mật khẩu, xóa tài khoản (tài khoản email).
- Widget chạy trong **WebView** với `baseUrl` = địa chỉ web (`SITE_URL`), để tên miền khớp danh sách tên miền của site key (cùng site key với web). Kiểu `interaction-only`: thường không thấy gì; chỉ hiện ô bấm khi Cloudflare cần.
- Mã đến qua `postMessage`; gửi form thì lấy mã có sẵn hoặc chờ tối đa 30 giây; mỗi mã dùng một lần nên gửi xong gọi `reset()`. Không xác minh được thì hiện lời báo như web.

## 4. Trạng thái đăng nhập
- `features/auth/hooks.ts` chép từ web (cùng key `['auth', 'session']`, cùng các mutation và `authErrorMessage`); khác: `useCompleteAuthRedirect(params)` nhận tham số từ deep link.
- `AuthSync` trong layout gốc: phiên đổi ngoài app (hết hạn, đăng xuất ở chỗ khác) thì tải lại.
- Đăng xuất, đổi mật khẩu, xóa tài khoản xong: thông báo nổi (sonner-native).

## 5. Thành phần dùng chung (`src/components/ui/`)
`Text` (mặc định `font-sans text-foreground`), `Button` (primary / outline / ghost / destructive, trạng thái chờ), `Input`, `Checkbox`; `src/lib/utils.ts` có `cn()` (clsx + tailwind-merge). Trong `features/auth/components/`: `TextField`/`PasswordField` (nhãn, ô nhập, dòng lỗi, nối react-hook-form bằng `Controller`), `PasswordStrength`, `FormAlert`, `SocialButtons` (logo Google bằng react-native-svg), `AuthDivider`, `UserAvatar`, `AuthScreen` (khung cuộn + tránh bàn phím cho các màn đăng nhập).

## 6. Kiểm tra
- `npm run typecheck`, `lint`, `test`; test của web cho `schemas` và `safeNext` (nếu dùng) chép sang.
- Simulator (skill `simulator-check`): mở Đăng nhập từ tab Tài khoản, lỗi kiểm tra form, **đăng nhập sai mật khẩu phải ra "Email hoặc mật khẩu không đúng."** (chứng tỏ captcha + Supabase chạy), đổi sang Tạo tài khoản, Quên mật khẩu, cả hai theme.
- Đăng nhập thật, Google, link trong email: người dùng tự thử (cần tài khoản thật và Redirect URLs).

**Kết quả (01/10/2026):**
- `typecheck`, `lint` (0 cảnh báo), `test` (34 test, gồm `schemas.test.ts` của web) đều qua.
- Simulator (iPhone 17 Pro, theme sáng): tab Tài khoản khi là khách, Đăng nhập, Tạo tài khoản, Quên mật khẩu, Hồ sơ khi chưa đăng nhập đều hiển thị đúng.
- Captcha: Turnstile trong WebView cấp mã ở chế độ ẩn; gửi mã đó cùng email không tồn tại lên Supabase thì nhận `invalid_credentials` (app hiện "Email hoặc mật khẩu không đúng."), tức Supabase chấp nhận mã của app.
- **Phát hiện khi kiểm tra:** `VITE_TURNSTILE_SITE_KEY` trong `web-novel-platform/.env` là **secret key** (Cloudflare `siteverify` nhận nó là secret hợp lệ), không phải site key; bản build ở máy `web-novel-platform/dist/` có chứa giá trị này. Web production (biến trên Vercel) dùng đúng site key. App dùng site key công khai lấy từ web production. Việc cần làm ở web: xem phần báo cáo cho người dùng.
- Chưa bấm thử trọn luồng trên simulator được: macOS chặn quyền Accessibility của `osascript` giữa chừng. Theme tối của các màn mới chưa chụp (token dùng chung đã kiểm ở bước 0).

## Ngoài phạm vi (để sau)
- Đăng nhập Apple (cuối bước 1, khi có Apple Developer).
- Các nút "cần đăng nhập" ở màn khác (theo dõi, bình luận...): làm cùng các bước 2–4, dùng chung cách mở modal Đăng nhập.
