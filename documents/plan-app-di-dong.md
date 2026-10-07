# Plan: App di động cho người đọc (iOS/Android)

## Context
Web đọc truyện (`web-novel-platform`) đã chạy ổn trên Supabase. Mục tiêu: có app cài từ App Store / Google Play cho **người đọc**, đọc mượt hơn PWA (cuộn dài, cử chỉ, đọc offline, nghe truyện, thông báo chương mới).

Đã chốt với người dùng (01/10/2026):
- **Phạm vi:** chỉ phần người đọc. Sáng tác (`/studio`) và Quản trị (`/admin`) ở lại web; app chỉ có nút mở trang web.
- **Repo riêng:** `mobile-novel-platform` là project độc lập, git riêng, nằm cạnh `web-novel-platform` (không monorepo). Code dùng chung được **chép** từ web (mục 3).
- **Backend:** cùng project Supabase với web. Mọi thay đổi DB (migration, RLS, RPC) vẫn làm ở web; app chỉ đọc và sinh lại kiểu.
- **Công nghệ:** React Native + Expo (TypeScript), để dùng lại cách viết và phần logic của web (React, TanStack Query, Zustand, zod, react-hook-form).

**Trạng thái:** Bước 0 ✅ (01/10/2026). Bước 1 ✅ (01/10/2026; đăng nhập Apple có code 07/10/2026, chờ bật provider; plan riêng: `plan-dang-nhap-va-tai-khoan.md`). Bước 2 ✅ (01/10/2026, chia 2a trang chủ, 2b chi tiết truyện, 2c trang đọc từng chương: `plan-trang-chu-va-doc-truyen.md`). Bước 3 ✅ (01/10/2026, chia 3a tủ truyện, 3b kho chương trên máy, 3c tải về đọc offline: `plan-tu-truyen-va-offline.md`). Bước 4 ✅ (02/10/2026, chia 4a khám phá, 4b tìm kiếm, 4c bình luận và báo cáo, 4d chặn người dùng: `plan-kham-pha-va-tuong-tac.md`). Bước 5 đang làm (chia 5a–5e: `plan-doc-nang-cao-va-phat-hanh.md`; còn 5d, chờ tài khoản nhà phát triển).

---

## 1. Công nghệ và thư viện

| Mục đích | Web | App |
|---|---|---|
| Nền tảng | Vite | **Expo SDK 57** (React Native 0.86, React 19.2, New Architecture, React Compiler) |
| Điều hướng | react-router v8 | **Expo Router** (route theo file trong `src/app/`, typed routes, deep link) |
| Style | Tailwind v4 + shadcn | **Uniwind** (Tailwind v4 cho React Native). Thành phần UI: tự viết hoặc chép từ react-native-reusables khi cần |
| Icon | lucide-react | **lucide-react-native** (+ react-native-svg) |
| Font | @fontsource | **@expo-google-fonts/*** nạp bằng `expo-font` |
| Dữ liệu server | TanStack Query | **TanStack Query** + NetInfo cho `onlineManager` |
| State client | Zustand + localStorage | **Zustand** + `localStorage` của **expo-sqlite** |
| Backend | supabase-js | **supabase-js**, phiên lưu ở `localStorage` của expo-sqlite |
| Đọc offline | IndexedDB (`idb`) | **expo-sqlite** |
| Form | react-hook-form + zod | Giữ nguyên, dùng lại schema |
| Danh sách dài | — | **@shopify/flash-list** |
| Ảnh | `<img>` | **expo-image**; avatar: expo-image-picker + expo-image-manipulator + expo-file-system |
| Sheet | Radix Sheet | **@gorhom/bottom-sheet** |
| Thông báo nổi | sonner | **sonner-native** |
| Hoạt ảnh, cử chỉ | CSS | react-native-reanimated + react-native-gesture-handler |
| Nghe truyện | Web Speech API | **expo-speech** |
| Khi đọc | — | expo-keep-awake, expo-brightness, expo-haptics |
| Đăng nhập MXH | OAuth chuyển trang | expo-web-browser (`openAuthSessionAsync`) + expo-linking; **expo-apple-authentication** |
| Captcha | @marsidev/react-turnstile | Turnstile trong **react-native-webview** |
| Đọc HTML chương | DOMParser | **htmlparser2** (+ domhandler) |
| Test | Vitest + Testing Library | **Vitest** cho logic thuần; giao diện: chạy trên simulator (sau này Maestro cho E2E) |
| Lint, format | oxlint, prettier | Giữ nguyên |
| Build, phát hành | Vercel | **EAS Build / Submit / Update** (bước 5) |

Lựa chọn khác với đề xuất ban đầu, có lý do:
- **Uniwind thay NativeWind:** lúc dựng khung, NativeWind bản dùng Tailwind v4 (v5) mới ở bản rc; Uniwind 1.12 đã ổn định và dùng Tailwind v4 như web.
- **expo-sqlite thay MMKV:** MMKV bắt buộc tự build app (không chạy trên Expo Go). `localStorage` của expo-sqlite đọc ghi đồng bộ như trình duyệt, dùng chung cho Zustand, phiên Supabase và kho chương offline, bớt một thư viện native.
- **Chưa cài** (cài khi tới bước cần): expo-notifications (bước 5), @sentry/react-native (tùy chọn).

## 2. Cấu trúc thư mục
```
mobile-novel-platform/
├─ app.json            ← tên app, scheme "webtruyen", bundle id, plugin
├─ metro.config.js     ← Uniwind
├─ .env / .env.example ← EXPO_PUBLIC_* (cùng giá trị với VITE_* của web)
├─ documents/          ← plan của app
├─ assets/             ← icon, splash
└─ src/
   ├─ app/             ← Expo Router: CHỈ màn hình và layout (mọi file ở đây là route)
   │  ├─ _layout.tsx   ← font, splash, QueryClient, theme điều hướng, Toaster
   │  └─ (tabs)/       ← Trang chủ, Khám phá, Tủ truyện, Tài khoản
   ├─ global.css       ← token màu, font, bo góc (chép từ web/src/index.css)
   ├─ components/      ← common/ (tự viết), ui/ (thành phần cơ bản)
   ├─ features/<x>/    ← api.ts, shared.ts, schemas.ts, hooks.ts, components/
   ├─ hooks/           ← useTheme, useThemeColors
   ├─ lib/             ← supabase, localStore, network, queryClient, fonts + lib chép từ web
   ├─ config/site.ts   ← SITE_NAME, DEFAULT_SITE_URL (chép từ web)
   └─ types/           ← kiểu dữ liệu (chép từ web) + database.ts (sinh tự động)
```

## 3. Code chép từ web và cách giữ đồng bộ

| Chép từ web | Ở app | Sửa gì |
|---|---|---|
| `types/*.ts` | `types/` | Không (`database.ts` sinh lại bằng `npm run gen:types`) |
| `lib/slugify, dbError, dbPage, uuid, format, pagination, routes` | `lib/` | Không |
| `features/<x>/shared.ts`, `schemas.ts` | như web | Không |
| `features/<x>/api.remote.ts` | `features/<x>/api.ts` | Thêm `export * from './shared'` (app không có bản giả nên không cần 4 file như web) |
| `features/stories/cards.remote.ts`, `browseParams.ts` | như web | Không |
| `features/library/guestHistory.ts`, `pendingProgress.ts`, `resume.ts` | như web | `mockStorage` → `localStore` |
| `features/auth/api.remote.ts` + `api.ts` | `features/auth/api.ts` | Link email và OAuth quay về app qua deep link; `completeAuthRedirect(url)` tự đổi `?code=`; `signInWithProvider` mở `WebBrowser.openAuthSessionAsync`, trả `null` nếu người dùng đóng; ảnh đại diện mới là file `file://` |
| `features/chapters/richText.ts` (+ test) | như web | `DOMParser` → `htmlparser2`; test của web chạy nguyên văn và qua |
| `lib/imageUpload.ts` | như web | Upload file trên máy (`expo-file-system`), `randomUUID` của expo-crypto |
| `lib/network.ts` | như web | Trạng thái mạng lấy từ NetInfo (React Native không có `navigator.onLine`) |
| `lib/mockStorage.ts` | `lib/localStore.ts` | `readLocal`/`writeLocal` trên `localStorage` của expo-sqlite |
| `lib/supabase.ts` | như web | Viết lại: `EXPO_PUBLIC_*`, lưu phiên ở localStorage của expo-sqlite, tự làm mới token theo `AppState`, `db()` không bao giờ null |

**Không chép:** `studio`, `admin`, `mocks/`, `api.mock.ts`, component và hook của web (viết cho DOM), `lib/image.ts` phần canvas.

**Quy tắc đồng bộ:**
1. Thay đổi DB chỉ làm ở web (`supabase/migrations`). Có migration mới thì chạy `npm run gen:types` ở app; `tsc` báo lỗi đúng chỗ `api.ts` bị ảnh hưởng.
2. Sửa `api.remote.ts`, `shared.ts`, `schemas.ts` của 7 feature người đọc (auth, stories, chapters, library, comments, genres, feedback) ở web thì sửa theo ở app. Mỗi file chép có dòng đầu ghi nguồn.
3. Query key giữ giống web (vd `['genres']`) để dễ đối chiếu.
4. Cách làm từng lần đồng bộ (so sánh từ mốc, file nào chép nguyên, file nào áp diff bằng tay): skill `sync-from-web`. Mốc commit web đã đồng bộ: `documents/dong-bo-web.md`.

## 4. Màn hình

| Trên app | Trang web tương ứng | Bước |
|---|---|---|
| Tab **Trang chủ** (nút tìm kiếm ở header) | `/`, `/search` | 2, 4 |
| Tab **Khám phá** | `/genres`, `/genres/:slug`, `/ranking`, `/list/:type` | 4 |
| Tab **Tủ truyện** (Theo dõi / Lịch sử / Đã tải) | `/library?tab=` | 3 |
| Tab **Tài khoản** | `/account` | 1 |
| Chi tiết truyện `story/[slug]` | `/story/:slug` | 2 |
| Đọc chương `story/[slug]/[chapter]` (tự tách số từ `chapter-12` như web) | `/story/:slug/chapter-:n` | 2 |
| Đăng nhập, đăng ký, quên mật khẩu, đặt lại mật khẩu, `auth/callback` | cùng đường dẫn | 1 |
| Giới thiệu, Điều khoản, Quyền riêng tư | mở trang web bằng expo-web-browser | 1 |
| Liên hệ | `/contact` (form trong app) | 4 |

Đường dẫn trong `src/app/` đặt giống web để link chia sẻ `/story/...` mở thẳng vào app (bước 5).

## 5. Lộ trình

### Bước 0: Khung app ✅ (01/10/2026)
- Tạo project Expo SDK 57 (template default), git riêng. Bỏ file mẫu, bỏ hỗ trợ web (`platforms: ios, android`).
- Cài thư viện ở mục 1. Chép và sửa code ở mục 3. Test của web (`richText`, `slugify`, `pagination`, `format`: 28 test) chạy qua trên app.
- Uniwind với token màu sáng/tối của web, font nạp theo độ đậm, theme lưu ở Zustand (`theme`, mặc định tối).
- 4 tab với màn hình tạm; Trang chủ gọi thử `getGenres` để kiểm tra kết nối Supabase; tab Tài khoản có nút đổi theme.
- `npm run typecheck`, `lint`, `test`, `npx expo export --platform ios` đều qua.

### Bước 1: Nền giao diện + đăng nhập ✅ (01/10/2026; Apple 07/10/2026, chi tiết: `plan-dang-nhap-va-tai-khoan.md`)
- Thành phần cơ bản trong `components/ui/`: Text, Button, Input, FormField (nhãn, lỗi, `aria` như web), Skeleton, EmptyState.
- `AuthSync` (như web), hook `useSession` cùng key `['auth', 'session']`.
- Màn hình đăng nhập, đăng ký, quên mật khẩu, đặt lại mật khẩu, `auth/callback` (deep link gọi `completeAuthRedirect(url)`).
- Đăng nhập Google/Facebook (`signInWithProvider`) và **Apple** (bắt buộc trên iOS khi có đăng nhập mạng xã hội, Guideline 4.8): thêm `'apple'` vào `AuthProvider`, `expo-apple-authentication` + `signInWithIdToken`, plugin và `ios.usesAppleSignIn` trong `app.json`.
- Captcha Turnstile trong WebView nếu Supabase Auth đang bật captcha.
- Tab Tài khoản: hồ sơ, đổi ảnh đại diện (`prepareAvatar` bằng expo-image-manipulator), đổi mật khẩu, đăng xuất, xóa tài khoản; link mở Sáng tác/Điều khoản/Quyền riêng tư trên web.

### Bước 2: Trang chủ, chi tiết truyện, trang đọc
- Trang chủ: banner nổi bật, đề cử, top tuần, mới cập nhật, truyện mới.
- Chi tiết truyện: thông tin, mục lục (FlashList, phân trang như web), theo dõi, đọc tiếp.
- Trang đọc từng chương: dựng từ `parseContent` (đoạn, tiêu đề, danh sách, đậm/nghiêng/gạch), font Literata, cài đặt đọc (cỡ chữ, giãn dòng, font, màu nền `reader-tone-*` bằng theme riêng của Uniwind), chương trước/sau, ghi lịch sử đọc và lượt đọc, giữ màn hình sáng khi đọc.

### Bước 3: Tủ truyện + đọc offline
- Theo dõi (số chương mới), lịch sử đọc (cả khách, gộp khi đăng nhập), đọc tiếp đúng chỗ.
- Kho chương expo-sqlite như `features/offline` của web: lưu chương đã mở, tải trước 5 chương, tải về chủ động (ghim), tối đa 300 chương không ghim, tab "Đã tải".
- Hàng chờ chỗ đọc khi mất mạng (`pendingProgress`) và `OfflineSync` gửi khi có mạng lại.

### Bước 4: Khám phá và tương tác
- Tìm kiếm (gợi ý nhanh), thể loại, bảng xếp hạng, danh sách theo loại, bộ lọc như `browseParams`.
- Bình luận (trả lời một cấp, báo cáo), chấm điểm, báo lỗi chương, form liên hệ.
- **Chặn người dùng** (App Store Guideline 1.2 cho nội dung do người dùng đăng): cần thêm bảng/RPC ở web.

### Bước 5: Tính năng đọc nâng cao + phát hành
- Cuộn liên tục, tự cuộn (1× = 220 chữ/phút như web), nghe truyện (expo-speech, tự chuyển chương).
- Thông báo đẩy khi truyện theo dõi có chương mới: expo-notifications, bảng `push_tokens` + trigger/Edge Function gửi qua Expo Push (migration làm ở web theo skill `db-migration`).
- Universal Links / App Links: `public/.well-known/apple-app-site-association` và `assetlinks.json` ở web.
- Icon và splash thật (từ `favicon.svg` của web), EAS Build, TestFlight và Google Play Internal Testing.

## 6. Việc cần làm ngoài code app
- **Supabase → Authentication → URL Configuration → Redirect URLs:** thêm `webtruyen://**` (app thật) và `exp://**` (Expo Go khi phát triển). Thiếu thì link xác nhận email, đặt lại mật khẩu, đăng nhập Google không quay về app được.
- **Bundle id** đang tạm là `com.webtruyen.app` (iOS và Android). Chốt trước lần build EAS đầu tiên: đã đưa lên store thì không đổi được.
- Tài khoản nhà phát triển: Apple Developer 99 USD/năm, Google Play 25 USD trả một lần.
- Máy hiện chưa có Android SDK: chạy thử Android cần cài Android Studio (hoặc dùng điện thoại Android thật với Expo Go).

## 7. Kiểm tra
- `npm run typecheck` (sinh kiểu Uniwind rồi `tsc`), `npm run lint`, `npm test`, `npx expo export --platform ios` (đóng gói thật bằng Metro).
- Chạy trên simulator: `npm run ios` (Expo Go). Kiểm tra cả hai theme, màn nhỏ (iPhone 17e) và lớn (iPhone 17 Pro Max).
- Logic thuần chép từ web giữ test của web. Màn hình kiểm bằng simulator; luồng chính (đăng nhập, đọc, offline) thêm Maestro ở bước 5.

## Ngoài phạm vi
- Sáng tác, Quản trị, nhập truyện hàng loạt (ở web).
- Chạy app trên web (`platforms` chỉ ios, android).
- Mua trong app, quảng cáo.
