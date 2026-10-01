import { router, useLocalSearchParams } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { toast } from 'sonner-native'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { AuthScreen } from '@/features/auth/components/AuthScreen'
import { FormAlert } from '@/features/auth/components/FormAlert'
import { authErrorMessage, useCompleteAuthRedirect } from '@/features/auth/hooks'
import { useCloseAuth } from '@/features/auth/navigation'

/** Đích của link xác nhận email (webtruyen://auth/callback?code=...): đổi mã lấy phiên rồi đóng */
export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{ code?: string; error?: string }>()
  const { data: user, isPending, error } = useCompleteAuthRedirect(params)
  const close = useCloseAuth()

  useEffect(() => {
    if (!user) return
    toast.success(`Chào mừng ${user.displayName}!`)
    close()
  }, [user, close])

  return (
    <AuthScreen title="Đang đăng nhập">
      {isPending || user ? (
        <View role="status" className="flex-row items-center gap-2">
          <ActivityIndicator colorClassName="accent-muted-foreground" />
          <Text className="text-muted-foreground">Đang hoàn tất, chờ một chút nhé…</Text>
        </View>
      ) : (
        <View className="gap-5">
          <FormAlert>
            {error
              ? authErrorMessage(error)
              : 'Link đăng nhập đã hết hạn hoặc đã được dùng. Thử đăng nhập lại nhé.'}
          </FormAlert>
          <Button variant="outline" onPress={() => router.replace('/login')}>
            Về màn đăng nhập
          </Button>
        </View>
      )}
    </AuthScreen>
  )
}
