# Plan: Tính năng đọc nâng cao và phát hành (bước 5 của app)

## Context
Bước 5 của `plan-app-di-dong.md`, chia nhỏ (02/10/2026):

| Phần | Nội dung | Trạng thái |
|---|---|---|
| **5a** | Tự cuộn và nghe truyện ở trang đọc | ✅ (02/10/2026, chưa kiểm trên máy ảo) |
| **5b** | Cuộn liên tục (hết chương thì nối chương sau) | ✅ (02/10/2026) |
| **5c** | Thông báo chương mới (expo-notifications, bảng `push_tokens` + gửi qua Expo Push, migration ở web): hỏi người dùng trước | ✅ code (02/10/2026); chờ tài khoản Expo / Apple / Firebase để gửi thật |
| **5d** | Icon, splash, Universal Links / App Links, EAS Build, TestFlight, Google Play: cần tài khoản nhà phát triển, chốt bundle id | chưa làm |
| **5e** | Bù chỗ còn chênh với web, không cần tài khoản: dải báo mất mạng, màn 404, chia sẻ truyện / chương | ✅ (07/10/2026, chưa kiểm trên máy ảo) |

Bước 4 ghi nhận thêm: nhánh `user-blocks` của web đã gộp vào `main` (`0d80654`, 02/10/2026).

---

## 5a. Tự cuộn và nghe truyện
Như `features/reader/autoscroll` và `features/reader/speech` của web.

| Phần | Web | App |
|---|---|---|
| Tự cuộn | `useAutoScroll`: requestAnimationFrame cuộn `window`, 1× = 220 chữ/phút đo theo bố cục thật (`pace.ts`), đứng yên khi chạm tay / mở hộp thoại, tự cuộn tiếp từ chỗ người đọc kéo tới, hết chương thì dừng | Như web trên ScrollView: số px mỗi chữ = chiều cao khối nội dung chương / số chữ (`pace.ts` dạng hàm thuần, có test); đứng yên khi đang kéo (`onScrollBeginDrag`) hoặc mở bảng mục lục / cài đặt. Nút "Chương sau" trên thanh nổi: sang chương rồi cuộn tiếp |
| Nghe truyện | Web Speech API, đọc từng đoạn (tách câu ngắn `splitForSpeech`), tạm dừng = dừng hẳn và nhớ đoạn, hết chương tự sang chương sau | expo-speech. **Bộ phát dùng chung cả app** (`speechPlayer.ts`, Zustand), không gắn vào màn đọc: mỗi chương là một màn riêng, chuyển chương thì màn cũ bị bỏ, giọng đọc vẫn đọc tiếp. Rời hẳn trang đọc thì dừng. Đoạn đang đọc được tô nền và cuộn vào giữa màn hình |
| Cài đặt | Tốc độ tự cuộn (`reader-autoscroll`), tốc độ đọc / giọng / tự chuyển chương (`reader-speech`) | Cùng key, cùng giá trị mặc định; chọn giọng (giọng tiếng Việt xếp trước) và "Hết chương tự đọc tiếp" ở bảng Cài đặt đọc |
| Thanh nổi | `AutoScrollBar`, `SpeechBar`, `FloatingBar` | Như web, nổi trên thanh home |

- Tự cuộn và nghe truyện không chạy cùng lúc (bật cái này thì tắt cái kia), như web.
- Chưa làm: nghe tiếp khi tắt màn hình / app vào nền (cần cấu hình phiên âm thanh nền, làm cùng bản build riêng ở 5d).

**Kết quả 5a (02/10/2026):**
- Code: `features/reader/autoscroll/` (useAutoScrollSettings chép từ web, `pace.ts` + test, `useAutoScroll.ts`), `features/reader/speech/` (splitForSpeech + test và useSpeechSettings chép từ web, `voices.ts`, `speechPlayer.ts`), `components/` (FloatingBar, BarButton, AutoScrollBar, SpeechBar); `ChapterArticle` báo vị trí từng đơn vị đọc và tô đoạn đang đọc; thanh công cụ thêm nút Tự cuộn, Nghe; bảng Cài đặt đọc thêm phần Nghe truyện (giọng tiếng Việt, tự đọc tiếp chương sau).
- Typecheck, lint, 73 test, đóng gói iOS qua. Chưa kiểm trên máy ảo.

---

## 5b. Cuộn liên tục
Như `ChapterStream` của web: bật ở Cài đặt đọc → Cách đọc (`continuous` của `useReaderSettings`, cùng key với web).

- Trang đọc viết lại thành một chuỗi chương (`StreamChapter`): từng chương thì chuỗi chỉ có chương mở ra (như trước); cuộn liên tục thì còn khoảng 1,5 màn hình tới cuối là nối chương sau, có thêm nút "Tải chương N".
- Chương đang đọc = chương có đỉnh vượt qua mốc 40% màn hình (như web), giữ trong state của màn thay vì đổi URL (đổi route sẽ dựng lại màn). Thanh công cụ, thanh tiến độ, lịch sử đọc, lượt đọc, tải trước, mục lục, tự cuộn, nghe truyện đều theo chương này.
- Giữa hai chương: dải "Hết chương N", bình luận chương thu gọn (`ChapterComments collapsible`), báo lỗi chương. Chương cuối của chuỗi có phần kết đầy đủ.
- Tự cuộn chạy xuyên các chương (còn chương sau thì chưa dừng, chờ chương sau nối vào); nghe truyện tự sang chương sau thì chương đó được nối vào.
- Tắt cuộn liên tục khi đang ở chương nối thêm: mở lại đúng chương đang đọc ở chế độ từng chương.
- Kiểm: typecheck, lint, 73 test. Chạy thử nhanh trên máy ảo trước khi người dùng bảo dừng: trang đọc mở bình thường, chương 2, 3 tự nối vào khi vuốt, thanh công cụ đổi theo chương, chương cuối có phần kết. Sửa: tên chương và tiêu đề "Bình luận chương N" hiện số kiểu cổ của Cormorant (ép `lining-nums`).

---

## 5c. Thông báo chương mới
Người dùng chọn viết code trước, gửi / nhận thật để sau khi có tài khoản (02/10/2026); đồng ý đẩy migration lên DB production.

- **Web (nhánh `push-notifications`, commit `7c58d26`):** migration `20261002025309_push_notifications.sql`: bật `pg_net`; bảng `push_tokens` (RPC `register_push_token`: máy đổi tài khoản thì mã chuyển chủ, tối đa 10 máy / tài khoản; chủ xóa được mã); trigger mỗi câu lệnh thêm / sửa chương: chương xuất bản lần đầu ở truyện công khai thì gửi một tin mỗi truyện tới người theo dõi (trừ tác giả) qua `net.http_post` → Expo Push, `data.url` = `/story/<slug>/chapter-<n>`; cùng truyện 30 phút một lần (`private.story_push_log`). Ca kiểm tra (đọc hàng đợi của pg_net trong transaction rollback): đăng ký / chuyển chủ / khách, người nhận, mở đúng chương, chống dội, chương nháp, sửa chương. Đã push, chạy lại ca kiểm tra trên DB thật: qua.
- **App:** `features/notifications/` (api, `push.ts`: xin quyền, lấy mã Expo, đăng ký / gỡ; `NotificationSync`: bấm thông báo thì mở đúng chương, cả khi app đang tắt; mở app khi đang bật thì đăng ký lại mã). Tab Tài khoản: công tắc "Thông báo chương mới" (đã đăng nhập); đăng xuất thì gỡ mã của máy trước. Plugin `expo-notifications` trong `app.json`.
- **Chưa gửi / nhận thật được:** Expo Go không nhận thông báo đẩy (SDK 53+), máy ảo cũng không; cần `eas init` (tài khoản Expo, ghi `extra.eas.projectId`), bản build riêng, khóa APNs (Apple Developer) cho iOS và Firebase (FCM) cho Android. Thiếu thì công tắc báo lời giải thích.
- Chưa làm: xử lý biên nhận của Expo (xóa mã hết hạn `DeviceNotRegistered`); web chưa có giao diện thông báo.

---

## 5e. Bù chỗ còn chênh với web
Rà lại app so với web (07/10/2026): mọi trang người đọc đã có màn tương ứng; web chưa có thay đổi mới từ mốc đồng bộ. Còn đăng nhập Apple và 5d (cần tài khoản trả phí, để sau). Làm trước ba việc nhỏ:

- **Dải báo mất mạng** (`components/common/OfflineBanner.tsx`, như `OfflineBanner` của web): "Bạn đang offline. Xem truyện đã lưu". Web đặt dưới header; app đặt dưới cùng thân màn bằng `screenLayout` của navigator để không đụng header: `Tabs` (ngay trên thanh tab) và `Stack` gốc (sát mép dưới, chừa thanh home). Không hiện ở nhóm tab trong `Stack` gốc (tab tự có), `(auth)` và trang đọc (`NO_OFFLINE_BANNER` ở `src/app/_layout.tsx`). `links.savedChapters` dùng chung với `NotSavedNotice`.
- **Màn 404** (`src/app/+not-found.tsx`, như `NotFound` của web): link mở vào app mà app không có màn (Sáng tác, Quản trị, link cũ) thì có "Về trang chủ" và "Mở trên web" (mở đúng đường dẫn đó). Cần khi bật Universal Links ở 5d.
- **Chia sẻ** (riêng của app, web không có): `shareLink` (`lib/share.ts`) mở bảng chia sẻ của máy với link web (`SITE_URL` + `paths`). Nút ở header chi tiết truyện (`ShareButton`) và "Chia sẻ chương" ở cuối chương (`ChapterEnd`; thanh công cụ đọc không còn chỗ).
- Kiểm: typecheck, lint, 73 test, đóng gói iOS. Chưa kiểm trên máy ảo (bật / tắt mạng của máy ảo để xem dải, mở `webtruyen://studio` để xem màn 404).
