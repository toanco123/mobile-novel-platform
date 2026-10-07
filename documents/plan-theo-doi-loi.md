# Plan: Theo dõi lỗi bằng Sentry (app)

Trạng thái: ✅ code xong (07/10/2026), chờ DSN của project `mobile-novel-platform` và lần build EAS đầu tiên. Nhánh `error-monitoring`. Bản web: `../web-novel-platform/documents/plan-theo-doi-loi.md` (luật lọc lỗi, quyền riêng tư giống hệt).

## Context

Trước đây app không có `ErrorBoundary` và không có công cụ báo crash: màn hình lỗi lúc hiển thị thì app tắt hoặc trắng màn, và không ai biết. Người dùng đã tạo tài khoản Sentry (org `hanoi-university-of-business-a`, vùng US). Project `mobile-novel-platform` (React Native) do người dùng tạo, chỉ bật Error monitoring.

## Đã làm

- **Gói:** `@sentry/react-native` ~7.11 (`npx expo install`). Plugin Expo trong `app.json` (`organization`, `project: mobile-novel-platform`, `url`). `metro.config.js` dùng `getSentryExpoConfig` thay `getDefaultConfig` để gắn debug id cho source map (`withUniwindConfig` vẫn bọc ngoài cùng).
- **`src/lib/errorFilter.ts`:** chép nguyên từ web (lọc lỗi dự kiến, ẩn token trong URL, gói lỗi PostgREST). Dùng `isNetworkError` của `src/lib/network.ts` của app (NetInfo). Test riêng ở `errorFilter.test.ts`: mock NetInfo, lớp lỗi dựng theo tên vì file feature của app import React Native.
- **`src/lib/monitoring.ts`** (riêng của app, chỉ file này import Sentry):
  - `initMonitoring()` chỉ bật khi `!__DEV__` và có `EXPO_PUBLIC_SENTRY_DSN`. Tham số: `sendDefaultPii: false`, không chụp màn hình hay cây giao diện, `beforeSend` / `beforeBreadcrumb` đi qua `errorFilter`.
  - Khởi tạo ngay khi nạp `_layout.tsx` (không tải chậm như web: bundle đã nằm trên máy), nên bắt được cả lỗi lúc mở app và crash native.
  - `reportError`, `setMonitoringUser` như web.
- **Nối vào app:**
  - `QueryCache` / `MutationCache` trong `src/lib/queryClient.ts` gọi `reportError` kèm query / mutation key.
  - `AuthSync` gắn id người đăng nhập (không email, tên).
  - `ErrorBoundary` export ở `src/app/_layout.tsx` hiện `AppErrorFallback` (`components/common`): "Có lỗi xảy ra", nút "Thử lại", và gửi lỗi lên Sentry.
  - Lỗi JS chưa ai bắt và promise bị bỏ quên do Sentry tự bắt (qua `beforeSend`, nên vẫn được lọc).
- **Ẩn token:** deep link đăng nhập (`webtruyen://auth/callback?code=…`, `…/reset-password#access_token=…`) thay giá trị bằng `[đã ẩn]` trong event và breadcrumb.
- **Thêm vào danh sách lỗi dự kiến** (trong `errorFilter.ts`, dùng chung với web): `PushUnavailableError` (máy không nhận được thông báo đẩy).

## Còn phải làm (ngoài code)

1. **DSN:** người dùng gửi DSN của project `mobile-novel-platform`. Ghi vào `.env` (`EXPO_PUBLIC_SENTRY_DSN`) và EAS → Environment variables khi có EAS. Nếu project Sentry đặt tên khác `mobile-novel-platform` thì sửa `project` trong `app.json`.
2. **Build EAS (bước 5d):** thêm `SENTRY_AUTH_TOKEN` (Organization token, bí mật, dùng chung token với web) vào EAS → Environment variables. Khi đó source map JS và debug symbols native được tải lên Sentry lúc build.
   - Build ở máy không có token (`npx expo run:ios`): đặt `SENTRY_DISABLE_AUTO_UPLOAD=true` để bước tải lên không làm hỏng build.
3. **Khai báo quyền riêng tư khi lên store:**
   - App Store Connect → App Privacy: thêm "Crash Data" và "Other Diagnostic Data", gắn với id người dùng (User ID), mục đích "App Functionality", không dùng để theo dõi (tracking).
   - Google Play → Data safety: "Crash logs", "Diagnostics".

## Kiểm tra

- `npm run typecheck`, `npm run lint`, `npm test`, `npx expo export --platform ios` (đã qua 07/10/2026, cấu hình Metro mới đóng gói được).
- **Thử gửi lỗi trong Expo Go:** có DSN trong `.env` thì chạy `npx expo start --no-dev`. Chế độ không phải dev nên Sentry bật, gây một lỗi rồi xem trong Sentry. Expo Go chỉ bắt được lỗi JS; crash native và stack trace đã map về mã gốc cần bản build EAS.
