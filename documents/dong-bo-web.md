# Đồng bộ code dùng chung với web

App chép (không import) một phần code của `../web-novel-platform`. Cách đồng bộ: skill `sync-from-web` (`.claude/skills/sync-from-web/SKILL.md`). Lý do và bảng tổng quan: mục 3 của `plan-app-di-dong.md`.

**Mốc hiện tại:** web commit `418bb9e` (07/10/2026, nhánh `error-monitoring` của web, gộp vào `main` cùng lúc với nhánh này của app). Lần đồng bộ sau so sánh từ mốc này: `git -C ../web-novel-platform diff 418bb9e..HEAD -- ...`.

## Lịch sử

| Ngày       | Commit web | Nội dung                                                                                                                                 |
| ---------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 01/10/2026 | `7186a07`  | Chép lần đầu (bước 0 của plan): types, lib thuần, `config/site.ts`, `shared`/`schemas`/`api.remote` của 7 feature người đọc, kèm test |
| 02/10/2026 | `ee13151` | Migration `user_blocks` (chặn người dùng, bước 4d của app) làm ở web; chép lại `src/types/database.ts`. Code chặn của app (`features/blocks`) là riêng của app, web chưa có giao diện |
| 02/10/2026 | `7c58d26` | Migration `push_notifications` (thông báo chương mới, bước 5c của app) làm ở web; chép lại `src/types/database.ts`. Code thông báo của app (`features/notifications`) là riêng của app |
| 07/10/2026 | `c548b9b` | Nhận ra tài khoản Apple (`AuthProvider` thêm `'apple'`): chép `types/user.ts`, `auth/shared.ts`; áp diff `toUser` ở `auth/api.ts` và tên provider ở `ChangePasswordForm`. Đăng nhập Apple (`signInWithApple`) là code riêng của app |
| 07/10/2026 | `88cc3cd` | Web có giao diện chặn người dùng (`features/blocks`): `blocks/api.ts` của app chuyển thành bản chép từ `api.remote.ts` của web (thêm `export * from './shared'`), chép `blocks/shared.ts` (`cannotBlockSelf`) |
| 07/10/2026 | `418bb9e` | Theo dõi lỗi bằng Sentry: chép `lib/errorFilter.ts` (lọc lỗi dự kiến, ẩn token; thêm `PushUnavailableError` của app vào danh sách ở web). Test của app viết riêng (mock NetInfo). `monitoring.ts`, `ErrorBoundary` là code riêng của app |
