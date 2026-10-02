# Plan: Khám phá và tương tác (bước 4 của app)

## Context
Bước 4 của `plan-app-di-dong.md`, chia nhỏ như các bước trước (01/10/2026):

| Phần | Nội dung | Trạng thái |
|---|---|---|
| **4a** | Tab Khám phá: thể loại, bảng xếp hạng, danh sách theo loại có bộ lọc; nối link thể loại, "Xem tất cả", khối Thể loại ở trang chủ | ✅ (01/10/2026) |
| **4b** | Tìm kiếm: nút ở header trang chủ, gợi ý nhanh, trang kết quả | ✅ (02/10/2026, chưa kiểm trên máy ảo) |
| **4c** | Bình luận (trả lời một cấp, báo cáo), chấm điểm, báo lỗi chương, form liên hệ, thanh mục lục dính ở trang truyện | ✅ (02/10/2026, chưa kiểm trên máy ảo) |
| **4d** | Chặn người dùng (App Store Guideline 1.2): cần bảng/RPC mới ở web, hỏi người dùng trước khi làm | ✅ (02/10/2026, chưa kiểm trên máy ảo) |

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

---

## 4b. Tìm kiếm
Web có ô tìm ở header (`SearchBox`: gõ từ 2 ký tự thì gợi ý truyện) và trang `/search?q=` (`SearchPage`). App gộp thành một màn `/search` (cùng đường dẫn, deep link khớp):

- Mở từ nút kính lúp ở header trang chủ (bàn phím bật sẵn), và từ tên tác giả ở đầu trang truyện (tìm theo tên tác giả như web).
- Đang gõ (từ 2 ký tự, chờ 200 ms như web): danh sách gợi ý truyện (`useSearchSuggestions`) và dòng "Xem tất cả kết quả cho …".
- Bấm Tìm trên bàn phím: kết quả của `q` (giữ trên params của route): số truyện, thể loại khớp, danh sách `StoryRow` (bìa, tên, tác giả, thể loại, mô tả, số liệu), phân trang. Không có kết quả thì gợi ý gõ khác + Thể loại + Top tuần như web.
- Ô trống: Thể loại và Top tuần như web.

**Kết quả 4b (02/10/2026):**
- Code: `src/app/search.tsx` (ô tìm, gợi ý, kết quả, ô trống), `features/stories/StoryRow.tsx`, `src/hooks/useDebouncedValue.ts` (chép từ web); nút kính lúp ở header trang chủ (`(tabs)/_layout.tsx`); tên tác giả ở `StoryHero` mở tìm kiếm; `links.search(q?)`.
- Typecheck, lint, test qua. Người dùng bảo không cần kiểm trên máy ảo phần này.

---

## 4c. Bình luận, chấm điểm, báo cáo, liên hệ
Api và schema đã chép từ web ở bước 0 (`features/comments`, `features/feedback`); hook chép từ web. Giao diện như web:

**4c1:**
- Trang truyện: mục Bình luận & đánh giá (`CommentsSection`): bảng điểm (`RatingSummary`: điểm trung bình, sao, phân bố 5→1), chấm điểm của mình (`StarRatingInput`, khách thì mời đăng nhập), ô viết bình luận (`CommentForm`, 1000 ký tự), danh sách bình luận gốc tải thêm từng trang, mỗi bình luận mở nhóm trả lời (một cấp), Trả lời (trả lời câu trả lời thì điền sẵn "@Tên"), Xóa bình luận của mình (hỏi lại bằng `Alert`).
- Thanh mục lục dính (`SectionNav` của web): Giới thiệu · Danh sách chương (số) · Bình luận (số), dính dưới header khi cuộn (`stickyHeaderIndices`), tô sáng mục đang xem, bấm thì cuộn tới.
- Trang đọc: Bình luận chương (`ChapterComments`) dưới cuối chương; mất mạng thì báo cần mạng.
- Bàn phím không che ô viết: ScrollView `automaticallyAdjustKeyboardInsets`.

**4c2:** báo cáo bình luận (`ReportCommentDialog`), báo lỗi chương (`ReportChapterDialog`), form liên hệ (`ContactForm`, mở từ tab Tài khoản thay cho link trang Liên hệ của web).

**Kết quả 4c (02/10/2026):**
- 4c1: `features/comments/hooks.ts` (chép từ web), `components/` (CommentsSection, CommentForm, CommentItem, RatingSummary, StarRatingInput); trang truyện thêm mục Bình luận & đánh giá và `SectionNav` dính (`features/stories/detail/SectionNav.tsx`, `stickyHeaderIndices`, mục đang xem theo vị trí cuộn); trang đọc thêm `ChapterComments`.
- 4c2: `features/feedback/hooks.ts` (chép từ web); `ReasonReportForm` (form chung của hai hộp báo cáo, lý do bằng `ChoiceList`), `ReportCommentButton`, `ReportChapterButton` (dưới thanh chuyển chương cuối), `ContactForm` + màn `/contact` (tab Tài khoản mở màn này thay cho trang web).
- Typecheck, lint, test, đóng gói iOS qua. Người dùng bảo không cần kiểm trên máy ảo phần này.

---

## 4d. Chặn người dùng
App Store Guideline 1.2 (nội dung do người dùng đăng) yêu cầu: lọc nội dung, báo cáo (4c), **chặn người dùng**, liên hệ (4c). Người dùng đồng ý sửa cả web và đẩy migration lên DB production (02/10/2026).

- **Web (nhánh `user-blocks`, commit `ee13151`, chưa gộp vào `main`):** migration `20261002021134_user_blocks.sql`: bảng `user_blocks` (`blocker_id` mặc định `auth.uid()`, `blocked_id` khóa ngoại tới `profiles`; RLS: chỉ người chặn đọc, thêm, xóa), `private.my_blocked_ids()` (definer), policy đọc `comments` bỏ bình luận của người mình đã chặn: `comment_threads`, trả lời và số trả lời đều tự ẩn trên cả web lẫn app. Ca kiểm tra trong `supabase/checks/rls_and_rules.sql` (chặn / thấy / khách / bỏ chặn / trùng / tự chặn / chặn thay người khác), `thiet-ke-database.md`. Đã push lên production, chạy lại ca kiểm tra trên schema thật: qua; advisors chỉ còn cảnh báo cũ "Leaked Password Protection" (cài đặt Auth, không do migration này).
- **App:** `features/blocks/` (api, hooks; riêng của app). Nút "Chặn" dưới bình luận và trả lời của người khác (hỏi lại, khách thì mở đăng nhập); màn `account/blocked` (Tài khoản → Người đã chặn) để bỏ chặn. Chặn / bỏ chặn tải lại mọi query `[comments]`.
- Chưa làm: chặn chưa ẩn truyện của người bị chặn (chỉ bình luận); web chưa có giao diện chặn (người chặn trên app vẫn không thấy bình luận đó trên web).
