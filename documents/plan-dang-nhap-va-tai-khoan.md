# Plan: Đăng nhập và tài khoản (bước 1 của app)

## Context
Bước 1 của `plan-app-di-dong.md`. Web đã có đăng nhập/đăng ký/quên mật khẩu/tài khoản trên Supabase (`web-novel-platform/documents/plan-dang-nhap-dang-ky.md`); app làm cùng luật, cùng thông báo lỗi, dùng lại `api.ts`, `schemas.ts`, `shared.ts` đã chép.

Đã chốt với người dùng (01/10/2026):
- **Không bắt đăng nhập khi mở app**: khách đọc được như web; chỉ hỏi đăng nhập khi cần (theo dõi, bình luận, chấm điểm... ở các bước sau) hoặc khi tự vào tab Tài khoản. Đúng cả App Store Guideline 5.1.1.
- **Cách đăng nhập**: email + mật khẩu, và các provider web đang bật (`EXPO_PUBLIC_AUTH_PROVIDERS`, hiện chỉ có Google). **Đăng nhập Apple để sau**: cần tài khoản Apple Developer và build app riêng (Expo Go không có).

Kiểm tra trước khi làm: Supabase Auth đang **bật captcha** (gọi đăng nhập không kèm mã trả `captcha_failed`), nên form email bắt buộc có Turnstile.

**Trạng thái:** ✅ (01/10/2026). Đăng nhập Apple: ✅ code (07/10/2026, mục 2b), chưa bật provider trên Supabase nên chưa chạy thật. Kết quả kiểm tra ở mục 6.

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

## 2b. Đăng nhập Apple (07/10/2026)
App Store bắt buộc có khi app có đăng nhập Google/Facebook (Guideline 4.8). Chỉ iOS.

- **Web (commit `761334f`, gộp `c548b9b`):** `AuthProvider` thêm `'apple'`, `toUser` nhận ra tài khoản Apple (trước đó bị coi là tài khoản email nên đổi mật khẩu / xóa tài khoản sẽ đòi mật khẩu). Web chưa có nút Apple: `SOCIAL_PROVIDERS` giữ Google, Facebook.
- **App:** `signInWithApple` (`features/auth/api.ts`, riêng của app): bảng của hệ thống (`expo-apple-authentication`, nonce băm SHA-256 bằng expo-crypto) trả id token, đổi phiên bằng `signInWithIdToken`, không qua trình duyệt / deep link. Đóng bảng thì không báo lỗi. Apple không đưa họ tên vào id token và chỉ gửi tên ở lần đầu: tài khoản chỉ có Apple thì ghi tên đó vào hồ sơ (qua `profileSchema`), thay tên trigger lấy từ email ẩn `@privaterelay.appleid.com`.
- Nút: `AppleAuthenticationButton` gốc của Apple (đúng hướng dẫn giao diện khi duyệt app), đứng đầu `SocialButtons`, "Sign in"/"Sign up" theo màn, trắng trên theme tối, đen trên theme sáng. Chỉ hiện trên iOS khi `EXPO_PUBLIC_AUTH_PROVIDERS` có `apple` (`appleSignInEnabled`).
- `app.json`: plugin `expo-apple-authentication`, `ios.usesAppleSignIn`.
- **Để chạy thật:** Supabase → Authentication → Providers → Apple: bật, **Client IDs** = bundle id (`com.webtruyen.app`) và `host.exp.Exponent` (thử bằng Expo Go). Đăng nhập bằng id token gốc chỉ cần Client IDs, không cần Secret Key (chỉ dùng cho đăng nhập Apple trên web). Rồi thêm `apple` vào `EXPO_PUBLIC_AUTH_PROVIDERS`. Bản build riêng cần App ID bật "Sign in with Apple" (Apple Developer, bước 5d).
- **Còn lại khi phát hành:** xóa tài khoản đăng nhập bằng Apple phải thu hồi token với Apple (Guideline 5.1.1(v)): cần khóa `.p8` của Apple Developer và một Edge Function gọi `appleid.apple.com/auth/revoke`. Chữ trên nút gốc theo ngôn ngữ của app (bản build mặc định tiếng Anh): kiểm ở 5d, cần thì đặt `CFBundleDevelopmentRegion` = `vi`.

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
