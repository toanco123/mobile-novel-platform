# Plan: Khám phá và tương tác (bước 4 của app)

## Context
Bước 4 của `plan-app-di-dong.md`, chia nhỏ như các bước trước (01/10/2026):

| Phần | Nội dung | Trạng thái |
|---|---|---|
| **4a** | Tab Khám phá: thể loại, bảng xếp hạng, danh sách theo loại có bộ lọc; nối link thể loại, "Xem tất cả", khối Thể loại ở trang chủ | ✅ (01/10/2026) |
| **4b** | Tìm kiếm: nút ở header trang chủ, gợi ý nhanh, trang kết quả | chưa làm |
| **4c** | Bình luận (trả lời một cấp, báo cáo), chấm điểm, báo lỗi chương, form liên hệ, thanh mục lục dính ở trang truyện | chưa làm |
| **4d** | Chặn người dùng (App Store Guideline 1.2): cần bảng/RPC mới ở web, hỏi người dùng trước khi làm | chưa làm |

App chỉ cho người đọc: bỏ nút "Đăng truyện", "Tạo thể loại" của web (khu Sáng tác ở web).

---

## 4a. Khám phá
Đường dẫn giống web để deep link khớp: `/genres`, `/genres/[slug]`, `/ranking`, `/list/[type]` (latest, ongoing, completed).

| Màn | Web | App |
|---|---|---|
| Tab Khám phá | (menu đầu trang) | Lối vào Bảng xếp hạng, Mới cập nhật, Đang ra, Truyện full; bên dưới là lưới thể loại có ô lọc như `GenresPage` |
| `/genres` | `GenresPage` | Cùng lưới thể loại (deep link) |
| `/genres/[slug]` | `GenreStoriesPage` + `StoryBrowser` | Tên, mô tả, người tạo thể loại; lưới truyện có bộ lọc (thể loại cố định) |
| `/list/[type]` | `BrowsePage` + `StoryBrowser` | Thanh chọn 3 danh sách; lưới truyện có bộ lọc (trạng thái cố định theo danh sách) |
| `/ranking` | `RankingPage` | Tiêu chí (Đọc nhiều / Điểm cao / Theo dõi nhiều), kỳ (Tuần / Tháng / Mọi lúc, chỉ với Đọc nhiều), danh sách có số hạng |

- `StoryBrowser` của app: hàng nút lọc cuộn ngang (Thể loại, Trạng thái, Độ dài, Sắp xếp), bấm mở `BottomPanel` chọn giá trị; "Xóa bộ lọc"; số truyện; lưới 3 cột; phân trang. Bộ lọc giữ trên params của route như query string của web (`browseParams.ts` chép từ web; `URLSearchParams` của React Native 0.86 đủ dùng). Kéo xuống để tải lại.
- Nối link: thể loại ở đầu trang truyện, banner trang chủ và phần giới thiệu mở `/genres/[slug]`; "Xem tất cả" ở Top tuần (→ Bảng xếp hạng, như web) và Mới cập nhật (→ `/list/latest`, app không có menu đầu trang như web); khối Thể loại (`GenreCloud`) ở cuối trang chủ như web.

**Kết quả 4a (01/10/2026):**
- Code: `(tabs)/explore.tsx`, `genres/index.tsx`, `genres/[slug].tsx`, `list/[type].tsx`, `ranking.tsx`; `features/genres/` (GenreGrid, GenreLinks), `features/stories/StoryBrowser.tsx`, `sections/GenreCloud.tsx`; `SeeAll` trong `SectionHeading.tsx`; `usePullToRefresh` (`src/hooks/`); `links` thêm genres, genre, ranking, list.
- Máy ảo: tab Khám phá và trang thể loại với dữ liệu thật (DB có 1 thể loại, 0 truyện: câu báo trống); danh sách (Mới cập nhật) và bảng xếp hạng với dữ liệu mẫu nạp tạm (đã gỡ). Sửa: ô thể loại lẻ cuối giãn ra cả hàng (đặt chiều rộng cố định nửa hàng).
- Chưa bấm thử được (cửa sổ Simulator không truy cập được qua Accessibility, chỉ mở màn bằng deep link): bảng chọn bộ lọc, đổi tiêu chí/kỳ xếp hạng, phân trang lưới truyện, link thể loại ở trang truyện, "Xem tất cả" ở trang chủ.
