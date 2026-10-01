---
name: simulator-check
description: Dùng khi cần chạy app trên iOS Simulator để xem hoặc kiểm tra giao diện (chụp màn hình, mở một màn hình theo đường dẫn, bấm thử, đổi theme, kiểm màn nhỏ/lớn), khi người dùng bảo chạy, mở hoặc chụp app, và trước khi báo xong một thay đổi giao diện.
---

# Chạy và kiểm tra giao diện trên iOS Simulator

Máy có Xcode và CocoaPods, chưa có Android SDK: kiểm trên iOS Simulator. Đang phát triển thì chạy trong **Expo Go** (không cần build); ảnh chụp và log để trong thư mục scratchpad, không để trong repo.

## Bật app

1. Simulator đang bật: `xcrun simctl list devices booted`. Chưa có thì `xcrun simctl boot "iPhone 17 Pro" && open -a Simulator`.
2. Bật Metro **chạy nền** (lệnh không tự kết thúc), ghi log ra file:
   ```bash
   npx expo start --ios --port 8081 > <scratchpad>/expo.log 2>&1
   ```
   Lần đầu trên một simulator, Expo tự tải và cài Expo Go (khoảng 1 phút).
3. Chờ log có `iOS Bundled` rồi đợi thêm vài giây cho app vẽ xong. Đọc log bỏ mã màu: `sed 's/\x1b\[[0-9;]*m//g' <scratchpad>/expo.log`. Lỗi JS hiện ở log (`ERROR`) và trên màn hình (khung đỏ).
4. Sửa file khi Metro đang chạy thì app tự cập nhật (Fast Refresh). Sửa một thay đổi qua nhiều lần ghi file có thể làm Fast Refresh bắt được bản dở dang (vd dùng biến trước khi kịp thêm import) và báo lỗi tạm: mở lại app (mục dưới) trước khi kết luận có lỗi.

## Chụp và mở màn hình

- Chụp: `xcrun simctl io booted screenshot <scratchpad>/<ten>.png`, rồi Read ảnh để xem.
- Mở thẳng một màn hình: `xcrun simctl openurl booted "exp://<IP>:8081/--/<route>"`. `<IP>` lấy ở dòng `Opening exp://...` trong log, hoặc dùng `127.0.0.1` (simulator chạy trên chính máy này; `ipconfig getifaddr en0` có thể rỗng); `<route>` theo `src/app/` (vd `account`, `story/<slug>`, `story/<slug>/chapter-3`).
- Mở lại app từ đầu: `xcrun simctl terminate booted host.exp.Exponent`, rồi `xcrun simctl openurl booted "exp://<IP>:8081"` và chờ ~10 giây.

## Lớp phủ của Expo Go

- Lần đầu mở app, Expo Go hiện màn hướng dẫn "developer menu" che nửa dưới (nút "Continue" ở giữa, sát đáy). Bấm "Continue" (mục dưới) rồi **mở lại app**: menu dev không tự hiện lại. Phím Escape không đóng được menu này.
- Nút bánh răng xanh ở góc trên là của Expo Go, không phải giao diện của app.

## Bấm thử bằng AppleScript

Simulator không nhận lệnh chạm từ dòng lệnh; bấm bằng AppleScript vào cửa sổ Simulator:

```bash
osascript -e 'tell application "System Events" to tell process "Simulator" to get {position, size} of window 1'
# → x0, y0, w, h
```

Đổi tọa độ trên ảnh chụp (`xi`, `yi` trên ảnh rộng `W`, cao `H`, tính theo cùng một kích thước ảnh):

- `x = x0 + w * xi / W`
- `y = y0 + 28 + (h - 28) * yi / H` (28 là thanh tiêu đề cửa sổ)

```bash
osascript -e 'tell application "Simulator" to activate' -e 'delay 0.3' \
  -e 'tell application "System Events" to click at {x, y}'
# Gõ chữ vào ô vừa bấm (simulator nối bàn phím máy Mac nên bàn phím ảo không hiện)
osascript -e 'tell application "System Events" to keystroke "ten@example.com"'
```

Không giấu lỗi của `osascript` (đừng `2>/dev/null`). Lỗi `osascript is not allowed assistive access (-25211)`: macOS chưa cho ứng dụng đang chạy Claude Code (Terminal / VS Code) quyền **Accessibility**; quyền này có thể mất giữa chừng. Người dùng tự bật ở System Settings → Privacy & Security → Accessibility. Chưa có quyền thì kiểm phần logic ở tầng API (vd gọi thẳng Supabase bằng `curl` với dữ liệu app tạo ra, lấy từ log) và báo rõ phần giao diện chưa bấm thử được.

Chụp lại để xác nhận. Cách đổi này chính xác với phần tử ở giữa màn hình (nút, tab); sát mép trái/phải dễ trượt vì viền máy. Bấm trượt hai lần thì thôi, mở màn hình bằng deep link hoặc báo người dùng tự bấm.

## Danh sách kiểm

- **Hai theme:** theme lưu trên máy (key `theme`, mặc định tối). Hiện đổi bằng nút tạm ở tab Tài khoản; kiểm xong trả về tối.
- **Màn nhỏ và lớn:** iPhone 17e và iPhone 17 Pro Max. Đổi máy: tắt Metro, `xcrun simctl shutdown booted`, `xcrun simctl boot "iPhone 17e" && open -a Simulator`, rồi bật lại Metro (Expo Go tự cài).
- Chữ tiếng Việt đủ dấu, không bị cắt; tai thỏ và thanh home không đè nội dung; màu lấy đúng token (không màu cứng); log không có `ERROR`/`WARN` mới.

## Dọn dẹp

- Tắt Metro: `lsof -ti tcp:8081 | xargs kill`.

## Khi Expo Go không đủ

Thêm thư viện native mà Expo Go không có sẵn (đăng nhập Apple, thông báo đẩy...) thì build app riêng: `npx expo run:ios` (lần đầu 5–10 phút, sinh `ios/` đã có trong `.gitignore`). App cài lên simulator với tên "Web Truyện" (bundle id `com.webtruyen.app`): mở màn hình bằng `xcrun simctl openurl booted "webtruyen://<route>"`, mở lại app bằng `xcrun simctl terminate booted com.webtruyen.app` rồi `xcrun simctl launch booted com.webtruyen.app`.
