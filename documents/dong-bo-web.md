# Đồng bộ code dùng chung với web

App chép (không import) một phần code của `../web-novel-platform`. Cách đồng bộ: skill `sync-from-web` (`.claude/skills/sync-from-web/SKILL.md`). Lý do và bảng tổng quan: mục 3 của `plan-app-di-dong.md`.

**Mốc hiện tại:** web commit `2a6db0a` (07/10/2026, nhánh `ai-voices` của web). Lần đồng bộ sau so sánh từ mốc này: `git -C ../web-novel-platform diff 2a6db0a..HEAD -- ...`.

## Lịch sử

| Ngày       | Commit web | Nội dung                                                                                                                                 |
| ---------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 01/10/2026 | `7186a07`  | Chép lần đầu (bước 0 của plan): types, lib thuần, `config/site.ts`, `shared`/`schemas`/`api.remote` của 7 feature người đọc, kèm test |
| 02/10/2026 | `ee13151` | Migration `user_blocks` (chặn người dùng, bước 4d của app) làm ở web; chép lại `src/types/database.ts`. Code chặn của app (`features/blocks`) là riêng của app, web chưa có giao diện |
| 02/10/2026 | `7c58d26` | Migration `push_notifications` (thông báo chương mới, bước 5c của app) làm ở web; chép lại `src/types/database.ts`. Code thông báo của app (`features/notifications`) là riêng của app |
| 07/10/2026 | `c548b9b` | Nhận ra tài khoản Apple (`AuthProvider` thêm `'apple'`): chép `types/user.ts`, `auth/shared.ts`; áp diff `toUser` ở `auth/api.ts` và tên provider ở `ChangePasswordForm`. Đăng nhập Apple (`signInWithApple`) là code riêng của app |
| 07/10/2026 | `88cc3cd` | Web có giao diện chặn người dùng (`features/blocks`): `blocks/api.ts` của app chuyển thành bản chép từ `api.remote.ts` của web (thêm `export * from './shared'`), chép `blocks/shared.ts` (`cannotBlockSelf`) |
| 07/10/2026 | `418bb9e` | Theo dõi lỗi bằng Sentry: chép `lib/errorFilter.ts` (lọc lỗi dự kiến, ẩn token; thêm `PushUnavailableError` của app vào danh sách ở web). Test của app viết riêng (mock NetInfo). `monitoring.ts`, `ErrorBoundary` là code riêng của app |
| 07/10/2026 | `ca06bb3` | Điểm danh và phiếu đề cử: migration `checkin_and_votes` làm ở web, `npm run gen:types`; chép `rewards/shared.ts`, `rewards/hooks.ts`, `rewards/api.ts` (từ `api.remote.ts`), `lib/errorFilter.ts` (thêm `RewardError`), `lib/routes.ts` (`rewards`, `rankingVotes`), `stories/shared.ts` (`RankingCriterion` có `votes`). Giao diện điểm danh của app tự viết (`CheckInHeaderButton`, `CheckInCard`, màn `rewards`) |
| 07/10/2026 | `2a6db0a` | Giọng AI (nghe truyện, plan `plan-giong-ai.md` của web): migration `tts_ai_voices` làm ở web; chép nguyên `speech/session.ts`, `clipQueue.ts`, `voiceTips.ts` (kèm test), `lib/ttsVoices.ts`, `tts/shared.ts`, `tts/api.ts` (từ `api.remote.ts`), `lib/errorFilter.ts` (thêm `TtsError`); áp diff `useSpeechSettings.ts` (`aiVoice`). Riêng của app: `tts/endpoint.ts` (địa chỉ đầy đủ), `speech/deviceEngine.ts` (expo-speech), `speech/cloudEngine.ts` (expo-audio, phát nền + màn hình khóa), `speechPlayer.ts` chỉ còn bọc session, giao diện chọn giọng |
