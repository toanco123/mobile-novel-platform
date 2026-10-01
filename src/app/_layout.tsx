import '@/global.css'
import { QueryClientProvider } from '@tanstack/react-query'
import { useFonts } from 'expo-font'
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Toaster } from 'sonner-native'
import { AuthSync } from '@/features/auth/components/AuthSync'
import { useTheme } from '@/hooks/useTheme'
import { useThemeColors } from '@/hooks/useThemeColors'
import { fonts } from '@/lib/fonts'
import { queryClient } from '@/lib/queryClient'

SplashScreen.preventAutoHideAsync()

// Mở app thẳng từ deep link (link trong email) thì vẫn có thanh tab bên dưới màn đăng nhập
export const unstable_settings = { anchor: '(tabs)' }

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
              name="account/password"
              options={{ headerShown: true, title: 'Đổi mật khẩu' }}
            />
            <Stack.Screen
              name="account/delete"
              options={{ headerShown: true, title: 'Xóa tài khoản' }}
            />
          </Stack>
          <AuthSync />
          <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
          <Toaster position="bottom-center" />
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}
