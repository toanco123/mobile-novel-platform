# Plan: Trang chủ, chi tiết truyện, trang đọc (bước 2 của app)

## Context
Bước 2 của `plan-app-di-dong.md`, chia nhỏ theo yêu cầu của người dùng (01/10/2026): làm và kiểm tra xong từng phần rồi mới sang phần sau.

| Phần | Nội dung | Trạng thái |
|---|---|---|
| **2a** | Trang chủ | ✅ (01/10/2026) |
| **2b** | Chi tiết truyện: thông tin, mục lục, theo dõi, đọc tiếp | đã viết code, còn kiểm trên máy ảo |
| **2c** | Trang đọc từng chương: nội dung, cài đặt đọc, chương trước/sau, lịch sử và lượt đọc | đã viết code, còn kiểm trên máy ảo |

Ngoài bước 2: cuộn liên tục, tự cuộn, nghe truyện (bước 5); bình luận, chấm điểm (bước 4); đọc offline (bước 3).

DB thật đang chưa có truyện công khai nào (01/10/2026): mọi khối phải có trạng thái trống như web; kiểm giao diện có dữ liệu bằng dữ liệu mẫu nạp tạm vào cache khi chụp màn hình (không commit).

---

## 2a. Trang chủ
Như `HomePage` của web, dọc một cột:

| Khối | Web | App |
|---|---|---|
| Truyện nổi bật | `HeroShowcase` (carousel, tự chuyển 7 giây) | Vuốt ngang từng trang (`FlatList` `pagingEnabled`), chấm chỉ trang, tự chuyển 7 giây, dừng khi người dùng đang vuốt và khi bật Giảm chuyển động. Nền chuyển màu theo bảng màu bìa, nút "Đọc từ chương N" và Theo dõi |
| Đọc tiếp | `ContinueReading` (4 truyện gần nhất, cả khách) | Hàng cuộn ngang, thanh % đã đọc; bấm vào mở chương kèm vị trí đã đọc (`?resume=`) |
| Truyện đề cử | `EditorPicks` (hàng cuộn ngang) | Như web |
| Top tuần | `TrendingWeekly` | Danh sách có số hạng (1 neon, 2–3 vàng hồng) |
| Mới cập nhật | `LatestUpdates` | Danh sách: tên, thể loại đầu, chương mới nhất (bấm mở chương), thời gian |
| Truyện mới ra | `NewReleases` (lưới) | Lưới 3 cột |
| Thể loại | `GenreCloud` | Để sang bước 4 (cần màn Thể loại) |

- Kéo xuống để tải lại (`RefreshControl`): tải lại mọi query `['stories']` và tủ truyện.
- "Xem tất cả" chỉ thêm khi màn đích đã có (Xếp hạng, danh sách: bước 4; Lịch sử: bước 3).
- Trạng thái trống và lỗi giống web: khối không có dữ liệu thì ẩn (nổi bật, đề cử, mới ra) hoặc hiện câu báo (mới cập nhật, top tuần).
- Header: logo chữ ký (đã có). Nút tìm kiếm thêm ở bước 4.

**Dùng chung tạo ở 2a** (2b, 2c dùng lại):
- `features/stories/hooks.ts`, `features/library/hooks.ts` chép từ web (cùng query key); khác web: đồng bộ chỗ đọc khi có mạng lại nghe `onlineManager` thay cho sự kiện `online` của trình duyệt.
- `StoryCover` (ảnh bìa bằng expo-image, chưa có ảnh thì bìa chữ tự sinh: chuyển màu theo `coverPalette` của web, tên truyện font serif nghiêng), `StoryCard`, `SectionHeading`, `ProgressMeter`, `FollowButton` (khách bấm thì mở modal Đăng nhập).
- `src/lib/links.ts`: đường dẫn trong app cho `router.push`/`Link` (cùng dạng URL với `paths` của web nhưng đúng kiểu chặt của Expo Router).
- Route `story/[slug]` và `story/[slug]/[chapter]` tạo sẵn với màn tạm, làm thật ở 2b, 2c.

**Kết quả 2a (01/10/2026):**
- Simulator, dữ liệu thật (DB trống): đúng trạng thái trống như web (nổi bật, đề cử, mới ra ẩn; mới cập nhật, top tuần hiện câu báo).
- Simulator, dữ liệu mẫu nạp tạm vào cache (không commit), cả theme sáng và tối: banner (bìa chữ tự sinh, chấm chỉ trang, nút đọc và theo dõi), đọc tiếp (thanh %), đề cử, mới cập nhật, mới ra (ảnh bìa thật qua expo-image, nhãn Full), top tuần.
- **Phát hiện:** Hermes không có `Intl.RelativeTimeFormat` (app lỗi khi mở), bỏ qua `notation: 'compact'` và làm tròn số lẻ khác ICU. `src/lib/format.ts` của app tự tính bằng JS thuần; `format.parity.test.ts` so hàng trăm giá trị với Intl của Node (ICU như trình duyệt) để giữ giống web.
- Số kiểu Cormorant mặc định là số cổ (1 giống chữ I): số hạng đặt `fontVariant: ['lining-nums', 'tabular-nums']` như `lining-nums` của web.

## 2b. Chi tiết truyện
Như `StoryDetailPage` của web, một cột cuộn dọc (như web ở màn hẹp), route `story/[slug]`:

| Khối | Web | App |
|---|---|---|
| Đầu trang | `StoryHero` (nền chuyển màu theo bìa) + `Breadcrumb` | Nền tối cố định như web: bìa, thể loại, tên, tác giả, sao, lượt xem, số chương, cập nhật. Không có breadcrumb (header có nút quay lại, tiêu đề là tên truyện) |
| Nút đọc | `ReadButtons` | Như web: đọc dở thì "Đọc tiếp chương N" (kèm `resume`) + "Đọc từ đầu"; chưa đọc thì "Đọc từ chương N" + "Chương mới nhất (N)" |
| Theo dõi | `FollowButton` / "Quản lý truyện" (chủ truyện) | Như web; "Quản lý truyện" mở khu Sáng tác trên web (`openWebPage`) |
| Giới thiệu | `StoryDescription` (gọn 6 dòng, "Xem thêm"), thẻ thể loại | Như web. Đo số dòng bằng một bản chữ ẩn không giới hạn dòng (`onTextLayout`) |
| Danh sách chương | `ChapterList` + `JumpToChapter` + `Pagination` | Như web: Cũ nhất / Mới nhất, ô "Đi tới" chương, 50 chương mỗi trang, nhãn "Đang đọc" và "Mới". Trang và thứ tự giữ trên params của route (`page`, `sort=newest` như web) bằng `router.setParams`; đổi trang thì cuộn về đầu danh sách |
| Cùng tác giả, Cùng thể loại | `SideStoryList` (cột phụ) | Dưới danh sách chương; ẩn khi trống. `StoryListItem` chép từ web |
| Lỗi / không có truyện | `SectionError` / `NotFound` | Câu báo + nút Thử lại / Về trang chủ |

- Kéo xuống để tải lại: truyện, danh sách chương, chỗ đọc, truyện liên quan.
- Truyện chưa công khai (chủ truyện hoặc quản trị viên xem): dải báo màu vàng hồng như web.
- **Chưa làm ở 2b:** thanh mục lục dính (`SectionNav`) và Bình luận làm cùng nhau ở bước 4 (khi có 3 mục mới cần); bấm thể loại, tên tác giả cần màn Thể loại, Tìm kiếm (bước 4), tạm thời là chữ thường; nút tải về đọc offline (bước 3).

**Tiến độ 2b (01/10/2026):**
- Code xong: `src/app/story/[slug]/index.tsx`; `features/stories/detail/` (StoryHero, StoryDescription, SideStoryList), `StoryListItem`, `heroColors.ts` (màu nền tối dùng chung với banner trang chủ); `features/chapters/hooks.ts` (chép phần mục lục từ web), `features/chapters/components/` (ChapterList, JumpToChapter); `components/common/Pagination.tsx`. Typecheck, lint, test qua.
- Simulator, dữ liệu mẫu nạp tạm: đầu trang đúng (nền chuyển màu, bìa chữ, sao, lượt xem, số chương, "Đọc tiếp chương N" + "Đọc từ đầu", Theo dõi, "Xem thêm" ở phần giới thiệu).
- **Còn kiểm** (người dùng tạm hoãn kiểm trên máy ảo): danh sách chương (Cũ nhất/Mới nhất, phân trang, đi tới chương, nhãn Đang đọc/Mới), "Xem thêm"/"Thu gọn", Cùng tác giả/Cùng thể loại, truyện chưa đọc, truyện nháp, truyện chưa có chương, không tìm thấy truyện, theme sáng, màn nhỏ. Lúc này bấm/vuốt trên simulator không được vì VS Code mất quyền Accessibility; cuộn để chụp thì nạp tạm `contentOffset` cho ScrollView.

## 2c. Trang đọc
Như `ChapterReaderPage` của web ở chế độ **từng chương**, route `story/[slug]/[chapter]` (`chapter-N` như web):

| Phần | Web | App |
|---|---|---|
| Nội dung | `ChapterArticle`: `parseContent` → đoạn, tiêu đề, danh sách; chữ đậm/nghiêng/gạch | Như web, render bằng `Text` lồng nhau (không bao giờ render HTML). Đầu chương: tên truyện, "Chương N", tên chương, ngày đăng, số chữ, số phút đọc, hoa văn. Dấu đầu dòng danh sách tự tính (`listMarker`, có test). Bỏ chữ hoa đầu chương (React Native không có float) |
| Thanh công cụ | `ReaderToolbar`: tự ẩn khi cuộn xuống, hiện khi cuộn lên / chạm chữ | Như web: nút quay lại, tên truyện + chương, Mục lục, Cài đặt. Header điều hướng ẩn; dải nền giữ chỗ tai thỏ để chữ không chạy dưới thanh trạng thái |
| Thanh tiến độ | `ReadingProgress` | Vạch mỏng dưới thanh trạng thái, `Animated` (không render lại khi cuộn) |
| Cài đặt đọc | `ReaderSettingsPanel` (bảng dưới, lớp phủ trong suốt) | Màu nền (Theo app, Trắng, Giấy vàng, Xám, Đen), phông có chân / không chân, cỡ chữ 15–28, giãn dòng 1,5–2,3 (nút − / + thay thanh trượt), Đặt lại. Store `useReaderSettings` chép nguyên từ web (key `reader-settings`) |
| Màu nền đọc | class `reader-tone-*` ghi đè token | 4 theme phụ của Uniwind (`reader-white`...) khai báo trong `global.css` + `extraThemes`, bọc vùng đọc bằng `ScopedTheme`: mọi class token và `useThemeColors()` bên trong tự đổi màu |
| Mục lục | `ReaderChapterIndex` (bảng bên phải) | Bảng dưới: chọn khoảng 50 chương, ô "Đi tới", danh sách mở sẵn tới chương đang đọc |
| Chuyển chương | `ChapterNav` đầu + cuối, `ChapterEnd` | Như web. Chuyển chương bằng `router.replace` để nút quay lại về thẳng trang trước khi đọc (không đi lùi qua từng chương) |
| Lịch sử, lượt đọc | `useReadingTracker`, `useRecordChapterView` | Như web: ghi chương khi mở, lưu vị trí cuộn tối đa mỗi giây và khi rời chương / app vào nền (`AppState`); `?resume=` thì cuộn tới chỗ đọc dở + `ResumeNotice` ("Về đầu chương"). Tính tỉ lệ đọc bằng hàm thuần (`progress.ts`, có test) |
| Màn hình | | Giữ màn hình sáng khi đang đọc (`expo-keep-awake`); thanh trạng thái sáng/tối theo màu nền đọc |

- **Chưa làm ở 2c:** cuộn liên tục, tự cuộn, nghe truyện (bước 5); bình luận chương, báo lỗi chương (bước 4); đọc chương đã lưu khi offline (bước 3); độ rộng khung chữ (điện thoại luôn hết chiều ngang); phím ← → (không có trên điện thoại).
- Người dùng bảo không chạy máy ảo ở phần này (01/10/2026): kiểm bằng typecheck, lint, test; kiểm giao diện trên máy ảo để sau.

**Tiến độ 2c (01/10/2026):**
- Code xong: `src/app/story/[slug]/[chapter].tsx`; `features/reader/` (useReaderSettings, readerOptions, text, progress, listMarker, useReadingTracker, useAutoHideToolbar, navigation, components/: ChapterArticle, ChapterNav, ChapterEnd, ReaderToolbar, ReaderChapterIndex, ReaderSettingsPanel, ResumeNotice); `components/common/BottomPanel.tsx`; `useChapter`, `useRecordChapterView` trong `chapters/hooks.ts`; 4 theme phụ trong `global.css` + `extraThemes` (metro.config.js) + `--theme` (lệnh typecheck); font Be Vietnam Pro nghiêng cho phông không chân.
- Đã kiểm: typecheck, lint (0 cảnh báo), 48 test (thêm test cho `progress.ts`, `listMarker.ts`, số chữ khớp `toLocaleString('vi-VN')`), đóng gói iOS bằng `expo export` (có đủ 4 theme và font mới).
- **Còn kiểm trên máy ảo** (cả 2b): nội dung chương với mọi kiểu khối (đoạn, tiêu đề, danh sách, đậm/nghiêng/gạch), đổi màu nền / phông / cỡ chữ / giãn dòng, thanh công cụ tự ẩn và chạm chữ để hiện, thanh tiến độ, mở lại chỗ đọc dở (`?resume=`) + "Về đầu chương", mục lục (mở sẵn chương đang đọc, chọn khoảng, đi tới), chuyển chương bằng `router.replace`, lịch sử đọc lưu khi cuộn / rời chương / app vào nền, màn tai thỏ và màn nhỏ.
