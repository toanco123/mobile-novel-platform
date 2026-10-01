# Plan: Tủ truyện và đọc offline (bước 3 của app)

## Context
Bước 3 của `plan-app-di-dong.md`, chia nhỏ như bước 2 (01/10/2026): làm và kiểm xong từng phần rồi mới sang phần sau.

| Phần | Nội dung | Trạng thái |
|---|---|---|
| **3a** | Tab Tủ truyện: Đang theo dõi (số chương mới), Lịch sử đọc (cả khách); gửi chỗ đọc ghi lúc mất mạng khi có mạng lại | ✅ (01/10/2026) |
| **3b** | Kho chương trên máy (expo-sqlite, như `features/offline` của web): lưu chương đã mở, tải trước 5 chương, trang đọc đọc từ kho khi mất mạng | ✅ (01/10/2026) |
| **3c** | Tải truyện về đọc offline (ghim), tab Đã lưu, giới hạn 300 chương không ghim | chưa làm |

Hook và api của tủ truyện đã chép từ web ở 2a (`features/library/`), gồm cả gộp lịch sử khách lên tài khoản khi đăng nhập (`mergeGuestHistory` trong `api.ts`).

---

## 3a. Tab Tủ truyện
Như `LibraryPage` của web, ở tab "Tủ truyện" của thanh tab:

| Phần | Web | App |
|---|---|---|
| Chọn mục | `SegmentedLinks` (`?tab=`) | Thanh chọn mục trên đầu (`SegmentedTabs`, dùng lại ở 3c khi thêm "Đã lưu"). Khách mặc định Lịch sử đọc, đã đăng nhập mặc định Đang theo dõi, như web |
| Đang theo dõi | `FollowingList` | Như web: bìa, tên, nhãn "N chương mới", chương mới nhất (bấm mở chương), thời gian, chỗ đang đọc + thanh %, nút "Đọc tiếp"/"Đọc", nút bỏ theo dõi. Khách: lời mời đăng nhập (mở modal Đăng nhập) |
| Lịch sử đọc | `HistoryList` | Như web: chương đang đọc, thời gian, thanh %, "Đọc tiếp" (kèm `resume`), xóa từng truyện; "Xóa toàn bộ" hỏi lại bằng hộp thoại hệ thống (`Alert`). Khách có dòng báo lịch sử đang lưu trên máy + link Đăng nhập |
| Số truyện có chương mới | nhãn neon trên mục | Nhãn trên mục "Đang theo dõi" và số trên biểu tượng tab Tủ truyện (`tabBarBadge`) |
| Gửi chỗ đọc chờ | `OfflineSync` trong Providers | Gắn `OfflineSync` ở layout gốc (cạnh `AuthSync`) |

- Kéo xuống để tải lại; danh sách trống có lời nhắn như web. Nút "Xem truyện được đọc nhiều" / "Xem truyện mới cập nhật" của web cần màn Xếp hạng, Danh sách (bước 4): tạm thời đưa về Trang chủ.

**Kết quả 3a (01/10/2026):**
- Code: `src/app/(tabs)/library.tsx`, `features/library/components/` (FollowingList, HistoryList, LibraryRow + RowFrame, LibraryStates, OfflineSync), `components/common/SegmentedTabs.tsx`; số trên tab ở `(tabs)/_layout.tsx`; `OfflineSync` gắn ở `_layout.tsx`.
- Simulator (iPhone 17 Pro, theme tối, dữ liệu mẫu nạp tạm vào cache, có phiên đăng nhập giả chỉ trong cache): Đang theo dõi (nhãn chương mới, chương mới nhất, chỗ đang đọc, Đọc tiếp / Đọc, truyện chưa có chương chỉ có nút bỏ theo dõi, số trên tab), Lịch sử đọc, hộp thoại "Xóa toàn bộ"; khách: mặc định Lịch sử đọc + dòng báo lưu trên máy, tab Theo dõi là lời mời đăng nhập.
- Chưa thử thật trên máy chủ (DB chưa có truyện công khai): bỏ theo dõi, xóa lịch sử, gộp lịch sử khách khi đăng nhập, gửi chỗ đọc chờ khi có mạng lại. Các hàm này chép nguyên từ web (đã có test bên web).

---

## 3b. Kho chương trên máy
Như `features/offline` của web (store, readChapter, prefetch, hooks), giữ nguyên tên hàm và hành vi:

| Phần | Web | App |
|---|---|---|
| Kho | IndexedDB (`idb`), store `chapters` + `contents` | SQLite (expo-sqlite, file `offline-reading.db`): một bảng `chapters`, nội dung là cột cuối và không được chọn khi liệt kê / dọn kho. Mở file ở `sqlite.ts` (tách riêng để test thay bằng `node:sqlite`) |
| Đọc chương | `readChapter`: có bản lưu thì trả ngay và làm mới ở nền; chưa có thì tải rồi lưu; mất mạng mà chưa lưu thì `ChapterNotSavedError` | Chép từ web, `navigator.onLine` → `isOnline()` (NetInfo) |
| Query trang đọc | `chapterQuery` (networkMode `always`, không thử lại khi chương chưa lưu) | Chép từ web vào `chapters/hooks.ts` |
| Tải trước | `usePrefetchChapters`: 5 chương sau, lúc rảnh | Chép từ web; app luôn tải (không có cờ tiết kiệm dữ liệu như trình duyệt, 5 chương chữ chỉ vài chục KB) |
| Ghi đã đọc | `markRead` trong `useReadingTracker` | Như web |
| Mất mạng | `NotSavedNotice`; mục lục chỉ hiện chương đã lưu | Như web; `useOnline()` (`src/hooks/useOnline.ts`) đọc `onlineManager` |

- Giới hạn 300 chương không ghim, bộ nhớ đầy (`SQLITE_FULL`) thì dọn 20% rồi thử lại; không mở được kho thì kho coi như trống (như web).

**Kết quả 3b (01/10/2026):**
- `store.test.ts`: test của web chạy trên SQLite thật của Node (`node:sqlite`, Node 24) qua cùng câu SQL; 11 test qua (thêm test truyện nháp không được lưu; 2 test "IndexedDB bị chặn / treo" đổi thành "mở file SQLite lỗi / treo").
- Máy ảo: thử tạm lúc mở app (đã gỡ): kho mở được, lưu, đọc lại đủ nội dung, `walkSaved`, `markRead` + "Đọc tiếp" của `listSavedStories` đều đúng trên expo-sqlite thật.
- Chưa thử được trọn luồng mất mạng trên máy ảo (DB chưa có truyện công khai; simulator không tắt mạng riêng được bằng dòng lệnh): đọc chương đã lưu khi offline, tải trước, `NotSavedNotice`, mục lục offline. Kiểm khi có truyện thật (bật Network Link Conditioner hoặc chế độ máy bay trên điện thoại).
