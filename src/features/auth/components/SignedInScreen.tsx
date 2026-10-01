import { router } from 'expo-router'
import type { ReactNode } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import type { User } from '@/types/user'
import { useSession } from '../hooks'

/**
 * Khung các màn chỉ dành cho người đã đăng nhập (Hồ sơ, Đổi mật khẩu, Xóa tài khoản), như
 * RequireAuth của web: khách thấy lời mời đăng nhập thay vì nội dung.
 */
export function SignedInScreen({ children }: { children: (user: User) => ReactNode }) {
  const { data: user, isPending } = useSession()

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator colorClassName="accent-primary" />
      </View>
    )
  }

  if (!user) {
    return (
      <View className="flex-1 justify-center gap-4 bg-background px-6">
        <Text className="text-center text-muted-foreground">Bạn cần đăng nhập để xem mục này.</Text>
        <Button onPress={() => router.push('/login')}>Đăng nhập</Button>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="px-5 pt-4 pb-10">
        {children(user)}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
