import { Pressable, Text } from 'react-native'
import { PlaceholderScreen } from '@/components/common/PlaceholderScreen'
import { useTheme } from '@/hooks/useTheme'

export default function AccountScreen() {
  const { theme, toggleTheme } = useTheme()
  return (
    <PlaceholderScreen
      title="Tài khoản"
      description="Đăng nhập (email, Google, Apple), hồ sơ, đổi mật khẩu, xóa tài khoản (bước 1)."
    >
      <Pressable
        onPress={toggleTheme}
        accessibilityRole="button"
        className="mt-2 rounded-lg bg-primary px-4 py-2.5 active:opacity-80"
      >
        <Text className="font-sans-semibold text-primary-foreground">
          {theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
        </Text>
      </Pressable>
    </PlaceholderScreen>
  )
}
