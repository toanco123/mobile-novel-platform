# Đồng bộ code dùng chung với web

App chép (không import) một phần code của `../web-novel-platform`. Cách đồng bộ: skill `sync-from-web` (`.claude/skills/sync-from-web/SKILL.md`). Lý do và bảng tổng quan: mục 3 của `plan-app-di-dong.md`.

**Mốc hiện tại:** web commit `7186a07` (01/10/2026). Lần đồng bộ sau so sánh từ mốc này: `git -C ../web-novel-platform diff 7186a07..HEAD -- ...`.

## Lịch sử

| Ngày       | Commit web | Nội dung                                                                                                                                 |
| ---------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 01/10/2026 | `7186a07`  | Chép lần đầu (bước 0 của plan): types, lib thuần, `config/site.ts`, `shared`/`schemas`/`api.remote` của 7 feature người đọc, kèm test |
