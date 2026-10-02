# Đồng bộ code dùng chung với web

App chép (không import) một phần code của `../web-novel-platform`. Cách đồng bộ: skill `sync-from-web` (`.claude/skills/sync-from-web/SKILL.md`). Lý do và bảng tổng quan: mục 3 của `plan-app-di-dong.md`.

**Mốc hiện tại:** web commit `ee13151` (02/10/2026, nhánh `user-blocks` của web). Lần đồng bộ sau so sánh từ mốc này: `git -C ../web-novel-platform diff ee13151..HEAD -- ...`.

## Lịch sử

| Ngày       | Commit web | Nội dung                                                                                                                                 |
| ---------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 01/10/2026 | `7186a07`  | Chép lần đầu (bước 0 của plan): types, lib thuần, `config/site.ts`, `shared`/`schemas`/`api.remote` của 7 feature người đọc, kèm test |
| 02/10/2026 | `ee13151` | Migration `user_blocks` (chặn người dùng, bước 4d của app) làm ở web; chép lại `src/types/database.ts`. Code chặn của app (`features/blocks`) là riêng của app, web chưa có giao diện |
