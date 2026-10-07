import '@/global.css'
import { QueryClientProvider } from '@tanstack/react-query'
import { useFonts } from 'expo-font'
import { DarkTheme, DefaultTheme, type ErrorBoundaryProps, Stack, ThemeProvider } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Toaster } from 'sonner-native'
import { AppErrorFallback } from '@/components/common/AppErrorFallback'
import { OfflineBannerLayout } from '@/components/common/OfflineBanner'
import { AuthSync } from '@/features/auth/components/AuthSync'
import { OfflineSync } from '@/features/library/components/OfflineSync'
import { NotificationSync } from '@/features/notifications/NotificationSync'
import { useTheme } from '@/hooks/useTheme'
import { useThemeColors } from '@/hooks/useThemeColors'
import { fonts } from '@/lib/fonts'
import { initMonitoring } from '@/lib/monitoring'
import { queryClient } from '@/lib/queryClient'

// Khởi tạo Sentry sớm nhất có thể để bắt cả lỗi lúc mở app (chỉ bật ở bản không phải dev, có DSN)
initMonitoring()
SplashScreen.preventAutoHideAsync()

/** Màn nào gặp lỗi lúc hiển thị thì hiện màn "Có lỗi xảy ra" (có nút thử lại) và gửi lỗi lên Sentry */
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <AppErrorFallback {...props} />
}

// Mở app thẳng từ deep link (link trong email) thì vẫn có thanh tab bên dưới màn đăng nhập
export const unstable_settings = { anchor: '(tabs)' }

/**
 * Màn không có dải báo mất mạng: nhóm tab tự có dải trên thanh tab, các màn đăng nhập báo lỗi mạng
 * ngay trong form, trang đọc vẫn đọc được chương đã lưu (chưa lưu thì có NotSavedNotice)
 */
const NO_OFFLINE_BANNER = new Set(['(tabs)', '(auth)', 'story/[slug]/[chapter]'])

/** Màu nền, header... của thư viện điều hướng lấy theo token của theme hiện tại */
function useNavigationTheme() {
  const theme = useTheme((s) => s.theme)
  const colors = useThemeColors()
  const base = theme === 'dark' ? DarkTheme : DefaultTheme
  return {
    ...base,
    colors: {
      ...base.colors,
      background: colors.background,
      card: colors.background,
      text: colors.foreground,
      border: colors.border,
      primary: colors.primary,
      notification: colors.primary,
    },
  }
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fonts)
  const theme = useTheme((s) => s.theme)
  const colors = useThemeColors()
  const navigationTheme = useNavigationTheme()
  const ready = fontsLoaded || !!fontError

  useEffect(() => {
    if (ready) SplashScreen.hideAsync()
  }, [ready])

  if (!ready) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={navigationTheme}>
          <Stack
            screenLayout={({ route, children }) =>
              NO_OFFLINE_BANNER.has(route.name) ? (
                children
              ) : (
                <OfflineBannerLayout safeBottom>{children}</OfflineBannerLayout>
              )
            }
            screenOptions={{
              headerShown: false,
              headerStyle: { backgroundColor: colors.background },
              headerShadowVisible: false,
              headerTintColor: colors.foreground,
              headerTitleStyle: { fontFamily: 'BeVietnamPro_600SemiBold', fontSize: 17 },
              headerBackButtonDisplayMode: 'minimal',
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" options={{ presentation: 'modal' }} />
            <Stack.Screen name="story/[slug]/index" options={{ headerShown: true, title: '' }} />
            <Stack.Screen
              name="story/[slug]/[chapter]"
              options={{ headerShown: true, title: '' }}
            />
            <Stack.Screen name="account/profile" options={{ headerShown: true, title: 'Hồ sơ' }} />
            <Stack.Screen
              name="account/blocked"
              options={{ headerShown: true, title: 'Người đã chặn' }}
            />
            <Stack.Screen
              name="account/password"
              options={{ headerShown: true, title: 'Đổi mật khẩu' }}
            />
            <Stack.Screen
              name="account/delete"
              options={{ headerShown: true, title: 'Xóa tài khoản' }}
            />
            <Stack.Screen name="genres/index" options={{ headerShown: true, title: '' }} />
            <Stack.Screen name="genres/[slug]" options={{ headerShown: true, title: '' }} />
            <Stack.Screen name="list/[type]" options={{ headerShown: true, title: '' }} />
            <Stack.Screen name="ranking" options={{ headerShown: true, title: '' }} />
            <Stack.Screen name="rewards" options={{ headerShown: true, title: 'Phiếu đề cử' }} />
            <Stack.Screen name="search" />
            <Stack.Screen name="contact" options={{ headerShown: true, title: '' }} />
            <Stack.Screen name="+not-found" options={{ headerShown: true, title: '' }} />
          </Stack>
          <AuthSync />
          <OfflineSync />
          <NotificationSync />
          <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
          <Toaster position="bottom-center" />
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}
