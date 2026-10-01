# Web Truyện: app di động

App iOS/Android cho người đọc của [web-novel-platform](../web-novel-platform), cùng backend Supabase. Expo SDK 57, Expo Router, Uniwind.

## Cài đặt lần đầu

```bash
git clone https://github.com/toanco123/mobile-novel-platform.git
cd mobile-novel-platform
npm install
cp .env.example .env
```

Điền `.env` bằng giá trị trong `.env` của web, đổi tiền tố `VITE_` thành `EXPO_PUBLIC_` (vd `VITE_SUPABASE_URL` → `EXPO_PUBLIC_SUPABASE_URL`). Thiếu `.env` thì app báo lỗi ngay khi mở.

Công cụ cần có: Node.js, Xcode (chạy iOS), CocoaPods (`brew install cocoapods`, khi build app native), Android Studio (chạy Android Emulator).

## Chạy khi đang phát triển

### iOS Simulator (nhanh nhất)

```bash
npm run ios
```

Bật Metro (máy chủ đóng gói code JS), mở Simulator, tự cài Expo Go và mở app trong đó.

### Điện thoại thật

1. Cài **Expo Go** (App Store / Google Play), bản mới nhất.
2. Điện thoại và máy tính dùng chung một Wi-Fi.
3. Chạy `npm start`, quét mã QR trong terminal: iPhone quét bằng Camera, Android quét bằng Expo Go.

- Khác mạng (hoặc Wi-Fi chặn kết nối giữa các máy): `npx expo start --tunnel`.
- **iPhone thật:** Expo Go chỉ mở project khi Expo Go và Expo CLI đăng nhập **cùng một tài khoản Expo** (`npx expo login`). Người khác không mở được app của bạn trên iPhone bằng Expo Go.

### Android Emulator

Cài Android Studio, tạo máy ảo trong Device Manager, rồi `npm run android`.

### Khi Metro đang chạy

| Phím trong terminal | Tác dụng                                                      |
| ------------------- | ------------------------------------------------------------- |
| `r`                 | Tải lại app                                                   |
| `i` / `a`           | Mở trên iOS Simulator / Android                               |
| `m`                 | Menu dev trên app (Simulator: `Cmd + D`, điện thoại: lắc máy) |
| `j`                 | Trình gỡ lỗi (DevTools)                                       |

Lưu file là app tự cập nhật (Fast Refresh).

### Lỗi hay gặp

- **Báo thiếu `EXPO_PUBLIC_SUPABASE_URL`**: chưa có `.env`, hoặc sửa `.env` mà chưa chạy lại Metro (`Ctrl + C` rồi chạy lại).
- **Lỗi lạ sau khi cài thư viện hoặc sửa `src/global.css`**: chạy lại với cache sạch, `npx expo start -c`.
- **Cổng 8081 đang bận**: còn một Metro khác đang chạy; tắt đi hoặc đồng ý dùng cổng khác.

## Expo Go, bản dev và bản release

| Lệnh                                       | Chạy ra cái gì                                                                              | Cần Metro (máy mình bật)                                  |
| ------------------------------------------ | ------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `npm run ios`                              | App nằm **bên trong Expo Go**                                                               | Có                                                        |
| `npx expo run:ios`                         | **App riêng** (icon, tên "Web Truyện") do Xcode build, cài lên simulator. Bản để phát triển | Có: JS vẫn lấy từ Metro để sửa code thấy ngay             |
| `npx expo run:ios --configuration Release` | App native hoàn chỉnh, JS đóng gói bên trong                                                | **Không**: tắt terminal app vẫn chạy như app tải từ store |

Android tương tự: `npx expo run:android` (thêm `--variant release` cho bản release).

- **Expo Go** chỉ để xem thử khi đang code: không dùng để phát hành, mỗi lần chỉ hỗ trợ một phiên bản SDK, và không làm được các tính năng cần build riêng (đăng nhập Apple, thông báo đẩy…).
- Cần **chuyển sang `npx expo run:ios`** khi thêm thư viện native mà Expo Go không có sẵn (từ bước đăng nhập Apple trong plan). Lần build đầu mất khoảng 5–10 phút.

## Thư mục `ios/` và `android/`

Project vẫn có hai "vỏ" native như Flutter, nhưng **không nằm trong repo**: Expo sinh ra từ `app.json` mỗi lần build (Continuous Native Generation), và `.gitignore` đã bỏ qua `/ios`, `/android`.

```
├─ src/        ← code TypeScript dùng chung cho iOS và Android
├─ app.json    ← cấu hình riêng từng nền tảng: ios.bundleIdentifier, android.package, icon, quyền…
├─ ios/        ← sinh ra khi build (npx expo prebuild / run:ios / EAS Build), không commit
└─ android/    ← như trên
```

- Đổi cấu hình native (tên app, icon, quyền, thư viện native): sửa `app.json` hoặc thêm config plugin, **không** sửa tay trong `ios/`, `android/` (lần sinh sau sẽ ghi đè).
- Sau khi đã sinh `ios/`, có thể mở `ios/*.xcworkspace` bằng Xcode và bấm ▶ Run như app iOS thuần; Android thì mở thư mục `android/` bằng Android Studio.
- Code riêng một nền tảng: `Platform.OS === 'ios'` trong code, hoặc tách file `Ten.ios.tsx` / `Ten.android.tsx` (Metro tự chọn).

**Expo không phải nơi app "chạy trên".** Expo là bộ công cụ và thư viện dựng trên React Native (như Next.js với React). App build ra là app native bình thường: các module Expo được biên dịch vào app như thư viện khác, app gọi thẳng Supabase, không cần Expo Go hay máy chủ Expo. Chỉ khi bật EAS Update thì app mới hỏi máy chủ Expo xem có bản mới không. Muốn bỏ Expo: `npx expo prebuild`, commit `ios/` và `android/`, rồi quản lý như project React Native thuần.

## Cho người khác dùng app

Người dùng không chạy lệnh nào: họ cài app rồi bấm icon. Muốn vậy phải **build** app (bằng **EAS Build** trên máy chủ Expo, hoặc Xcode / Android Studio trên máy mình) rồi phát hành:

| Cách                        | Ai dùng được                                     | Cần gì                                                                |
| --------------------------- | ------------------------------------------------ | --------------------------------------------------------------------- |
| **APK Android**             | Ai có link tải                                   | Tài khoản Expo miễn phí (EAS Build), không cần Google Play            |
| **TestFlight (iOS)**        | Tối đa 10.000 người thử, mời qua email hoặc link | Apple Developer 99 USD/năm; nhóm thử bên ngoài qua một lượt duyệt nhẹ |
| **Ad hoc (iOS)**            | Tối đa 100 máy, đăng ký UDID từng máy            | Apple Developer 99 USD/năm                                            |
| **App Store / Google Play** | Mọi người                                        | Apple 99 USD/năm, Google 25 USD một lần, qua duyệt của store          |

- iPhone **không cài được app ngoài App Store/TestFlight** nếu không có tài khoản Apple Developer. Android chỉ cần gửi file APK.
- Sau khi người dùng đã cài: sửa code JS (giao diện, logic) thì đẩy bản mới qua **EAS Update**, không cần build lại. Thêm thư viện native hoặc đổi `app.json` thì phải build lại.
- Trước lần build lên store đầu tiên phải chốt `ios.bundleIdentifier` và `android.package` trong `app.json` (đang tạm là `com.webtruyen.app`): đã lên store thì không đổi được.

## Kiểm tra code

```bash
npm run typecheck   # sinh kiểu Uniwind rồi tsc
npm run lint        # oxlint
npm test            # vitest (logic thuần)
npm run format      # prettier
```

## Tài liệu

- [documents/plan-app-di-dong.md](documents/plan-app-di-dong.md): công nghệ, code chép từ web, màn hình, lộ trình.
- [CLAUDE.md](CLAUDE.md): kiến trúc, lệnh, quy ước.
