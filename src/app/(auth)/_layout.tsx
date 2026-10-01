import { Stack } from 'expo-router'
import { X } from 'lucide-react-native'
import { Pressable } from 'react-native'
import { useCloseAuth } from '@/features/auth/navigation'
import { useThemeColors } from '@/hooks/useThemeColors'

/**
 * Nhóm màn đăng nhập/đăng ký/mật khẩu, mở dạng modal (khai báo ở layout gốc). Header không có tiêu
 * đề (tiêu đề lớn nằm trong màn), có nút đóng cả modal.
 */
export default function AuthLayout() {
  const colors = useThemeColors()
  return (
    <Stack
      screenOptions={{
        title: '',
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.foreground,
        headerBackButtonDisplayMode: 'minimal',
        headerRight: () => <CloseButton color={colors.foreground} />,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  )
}

function CloseButton({ color }: { color: string }) {
  const close = useCloseAuth()
  return (
    <Pressable role="button" aria-label="Đóng" hitSlop={10} onPress={close}>
      <X size={24} color={color} />
    </Pressable>
  )
}
