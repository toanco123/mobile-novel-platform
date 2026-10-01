# Plan: Tủ truyện và đọc offline (bước 3 của app)

## Context
Bước 3 của `plan-app-di-dong.md`, chia nhỏ như bước 2 (01/10/2026): làm và kiểm xong từng phần rồi mới sang phần sau.

| Phần | Nội dung | Trạng thái |
|---|---|---|
| **3a** | Tab Tủ truyện: Đang theo dõi (số chương mới), Lịch sử đọc (cả khách); gửi chỗ đọc ghi lúc mất mạng khi có mạng lại | ✅ (01/10/2026) |
| **3b** | Kho chương trên máy (expo-sqlite, như `features/offline` của web): lưu chương đã mở, tải trước 5 chương, trang đọc đọc từ kho khi mất mạng | chưa làm |
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
