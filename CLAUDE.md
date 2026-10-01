# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tổng quan

App di động (iOS/Android) đọc **truyện chữ** cho **người đọc** của web `../web-novel-platform` (cùng backend **Supabase**). Expo SDK 57 + React Native 0.86 + React 19 + TypeScript, Expo Router, Uniwind (Tailwind v4). Sáng tác và Quản trị chỉ có ở web.

Plan tổng (công nghệ, code chép từ web, màn hình, lộ trình) ở [documents/plan-app-di-dong.md](documents/plan-app-di-dong.md): đọc trước khi làm tính năng mới, xong một bước thì đánh dấu tiến độ ở đó. Người dùng giao tiếp bằng tiếng Việt; tài liệu viết bằng tiếng Việt. Nghiệp vụ (luật duyệt truyện, giới hạn, schema) mô tả ở `../web-novel-platform/CLAUDE.md` và `../web-novel-platform/documents/thiet-ke-database.md`.

## Lệnh

```bash
npm run ios            # Metro + mở app trên iOS Simulator bằng Expo Go
npm start              # chỉ Metro (quét QR bằng Expo Go trên điện thoại)
npm run typecheck      # sinh kiểu Uniwind (src/uniwind-types.d.ts) rồi tsc --noEmit
npm run lint           # oxlint
npm run format         # prettier --write . (có plugin sắp xếp class Tailwind)
npm test               # vitest run: chỉ logic thuần (không import react-native)
npx vitest run src/lib/slugify.test.ts   # chạy 1 file test
npx expo export --platform ios --output-dir <thư mục tạm>   # đóng gói thật, bắt lỗi Metro/Uniwind
npm run gen:types      # sinh lại src/types/database.ts từ Supabase (cần `supabase login`)
npx expo install <gói> # cài thư viện: luôn dùng lệnh này để lấy bản hợp với SDK
```

## Kiến trúc

- **Route**: Expo Router, gốc là `src/app/`. Mọi file trong đó là một màn hình (hoặc `_layout`), nên Providers, hook, component đặt ngoài `src/app/`. Màn hình chỉ mỏng; logic nằm ở `src/features/<x>/`. Đường dẫn đặt giống web (`story/[slug]`, `genres/[slug]`, `search`...) để deep link khớp với link web; URL lấy từ `paths` (`src/lib/routes.ts`, chép từ web).
- **Layout gốc** `src/app/_layout.tsx`: nạp font (`src/lib/fonts.ts`), giữ splash tới khi xong, `QueryClientProvider`, theme điều hướng lấy màu từ token, `Toaster` (sonner-native). Tab chính ở `src/app/(tabs)/` (Trang chủ, Khám phá, Tủ truyện, Tài khoản).
- **Dữ liệu (quan trọng)**: component không gọi Supabase trực tiếp. Mọi lấy/ghi đi qua `features/<x>/api.ts`, bọc bằng hook TanStack Query trong `features/<x>/hooks.ts`. Query key giống web. App **không có bản dữ liệu giả**: `api.ts` của app = `api.remote.ts` của web chép sang (+ `export * from './shared'`), thiếu `.env` thì app báo lỗi ngay khi mở.
- **Code chép từ web**: `types/`, `lib/` (slugify, dbError, dbPage, uuid, format, pagination, routes), `config/site.ts`, `shared.ts`/`schemas.ts`/`api.ts` của 7 feature người đọc. Dòng đầu file ghi nguồn. Thay đổi DB chỉ làm ở web (skill `db-migration` bên web). Web sửa các file đã chép, có migration mới, hay cần lấy thêm code từ web: làm theo skill `sync-from-web` (mốc commit web đã đồng bộ ở `documents/dong-bo-web.md`).
- **Khác web cần nhớ**:
  - Lưu trên máy: `localStorage` của expo-sqlite (`import 'expo-sqlite/localStorage/install'`), bọc bởi `readLocal`/`writeLocal` (`src/lib/localStore.ts`, thay `mockStorage` của web). Zustand persist và phiên supabase-js dùng chung kho này.
  - Mạng: `isOnline()`/`isNetworkError()` ở `src/lib/network.ts` lấy từ NetInfo (không có `navigator.onLine`); `onlineManager` của TanStack Query nối NetInfo ở `src/lib/queryClient.ts`.
  - Đăng nhập: link xác nhận email, đặt lại mật khẩu và OAuth quay về **app** qua deep link (`webtruyen://...`, Expo Go là `exp://...`), vì mã PKCE chỉ đổi được trên máy đã gửi. Màn nhận deep link (`(auth)/auth/callback`, `(auth)/reset-password`) gọi `useCompleteAuthRedirect(params)`. Redirect URLs phải khai báo trên Supabase (mục 6 của plan). Các màn đăng nhập nằm trong nhóm `(auth)` mở dạng modal; đăng nhập xong gọi `useCloseAuth()` (`features/auth/navigation.ts`) để đóng cả modal, về đúng chỗ cũ (thay `?next=` của web). Màn cần đăng nhập mở modal bằng `router.push('/login')`. Plan: `documents/plan-dang-nhap-va-tai-khoan.md`.
  - Captcha: Supabase Auth bật captcha, nên mọi form gọi Auth bằng email + mật khẩu dùng `useCaptcha()` (`features/auth/useCaptcha.tsx`, cùng API với web): Turnstile chạy trong WebView với `baseUrl` = `SITE_URL` để tên miền khớp site key. `EXPO_PUBLIC_TURNSTILE_SITE_KEY` là **site key công khai** (24 ký tự), không phải secret key.
  - Intl của Hermes thiếu `RelativeTimeFormat`, `PluralRules`, `Locale` và bỏ qua `notation: 'compact'`: không gọi các API này trong code app (lỗi khi mở app hoặc ra số sai). Định dạng số, thời gian dùng `src/lib/format.ts` (tự tính, có test so khớp với Intl của Node). `Intl.DateTimeFormat` dùng được.
  - Nội dung chương: `features/chapters/richText.ts` đọc HTML bằng htmlparser2 (web dùng DOMParser). Test của web chạy nguyên văn để bảo đảm hai bản giống nhau. Không bao giờ render HTML thô (không dùng WebView cho nội dung chương).
- **State client**: Zustand. Theme ở `src/hooks/useTheme.ts` (key `theme`, mặc định tối, gọi `Uniwind.setTheme`). Dữ liệu server luôn ở TanStack Query.

## Giao diện

- **Style**: Uniwind, viết `className` như web. Token màu, font, bo góc ở `src/global.css` (chép từ `index.css` của web): `bg-background`, `text-foreground`, `text-muted-foreground`, `bg-primary`, `text-rose-gold`, `text-neon`... Bộ màu sáng/tối khai báo bằng `@variant light` / `@variant dark`; mọi biến phải có ở cả hai.
- **Màu nền trang đọc** (Trắng, Giấy vàng, Xám, Đen; `reader-tone-*` của web) là theme phụ của Uniwind: khai báo `@variant reader-*` trong `global.css` (đủ mọi biến như light/dark), `extraThemes` trong `metro.config.js` và `--theme` trong lệnh `typecheck`. Vùng đọc bọc bằng `<ScopedTheme theme=...>` (`toneTheme` ở `features/reader/readerOptions.ts`), nên class token và `useThemeColors()` bên trong tự đổi màu.
- **Màu ở chỗ không nhận className** (thanh tab, header điều hướng, màu icon lucide): `useThemeColors()` (`src/hooks/useThemeColors.ts`). Prop màu của component React Native nhận class `accent-*` qua prop `...ClassName` của Uniwind (vd `placeholderTextColorClassName="accent-muted-foreground"`, `colorClassName="accent-primary"` cho ActivityIndicator).
- **Thành phần cơ bản** (`src/components/ui/`): `Text` (có sẵn `font-sans text-base text-foreground`, dùng thay `Text` của React Native), `Button` (`default` / `outline` / `ghost` / `destructive`, `pending` + `pendingLabel`), `Input`, `Checkbox`, `TextLink`. Gộp class bằng `cn()` (`src/lib/utils.ts`). Danh sách kiểu trang cài đặt: `MenuGroup`/`MenuRow` (`src/components/common/Menu.tsx`).
- **Form**: react-hook-form + zod như web (schema và câu lỗi chép từ web), `mode: 'onTouched'`. Ô nhập nối form bằng `TextField`/`PasswordField` (`features/auth/components/FormFields.tsx`, dùng `useController`); nút gửi gọi `onPress={() => onSubmit()}`; ô trước bấm "Tiếp" thì `setFocus` ô sau.
- **Font**: React Native không tự chọn file theo độ đậm. Dùng class họ chữ theo độ đậm: `font-sans`, `font-sans-medium`, `font-sans-semibold`, `font-sans-bold`, `font-heading`, `font-heading-bold`, `font-script` (logo), `font-reading` (+ `-italic`, `-bold`, `-bold-italic`), `font-sans-italic`, `font-sans-semibold-italic` (chữ nghiêng trong chương khi chọn phông không chân). Không dùng `font-semibold`/`font-bold` với font tự nạp. Mọi `<Text>` phải có class font (React Native không kế thừa font từ View cha). Font mới: import theo đường dẫn con (`@expo-google-fonts/<họ>/<độ đậm>`) trong `src/lib/fonts.ts` rồi thêm `--font-*` vào `global.css`.
- `src/uniwind-types.d.ts` là file sinh ra (Metro hoặc `npm run typecheck` tạo lại), được commit để `tsc` chạy được ngay.
- Kiểm tra UI trên iOS Simulator ở màn nhỏ (iPhone 17e), lớn (iPhone 17 Pro Max) và cả hai theme: làm theo skill `simulator-check` (bật Metro chạy nền, chụp màn hình, mở màn hình bằng deep link, bấm thử, lớp phủ của Expo Go).

## Quy ước

- Chữ trên giao diện, tài liệu, commit message bằng tiếng Việt; tên nhánh git tiếng Anh (kebab-case).
- **Mỗi lần commit là một lần tăng version** trong `package.json` như web: `npm version patch --no-git-tag-version` rồi đưa `package.json` + `package-lock.json` vào chính commit đó. `expo.version` trong `app.json` là version phát hành trên store, chỉ tăng khi phát hành.
- Import alias `@/` → `src/`. Tên app lấy từ `SITE_NAME` (`src/config/site.ts`).
- Prettier: không dấu chấm phẩy, nháy đơn, `printWidth` 100.
- Env: chỉ `EXPO_PUBLIC_*` (đóng gói vào app, nên chỉ giá trị công khai). `.env` không lên git, mẫu ở `.env.example`; khai báo kiểu ở `src/env.d.ts`.
- Test: Vitest chỉ cho logic thuần (file `*.test.ts` trong `src/`), không import module của React Native. Logic chép từ web thì chép kèm test của web.
