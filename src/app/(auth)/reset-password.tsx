import { router, useLocalSearchParams } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import { toast } from 'sonner-native'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { AuthScreen } from '@/features/auth/components/AuthScreen'
import { FormAlert } from '@/features/auth/components/FormAlert'
import {
  PASSWORD_UPDATED_NOTICE,
  ResetPasswordForm,
} from '@/features/auth/components/ResetPasswordForm'
import { authErrorMessage, useCompleteAuthRedirect } from '@/features/auth/hooks'

/**
 * Đích của link đặt lại mật khẩu trong email (webtruyen://reset-password?code=...): đổi mã lấy phiên
 * tạm rồi mới hiện form. Lưu xong thì đăng xuất khỏi mọi thiết bị và về màn đăng nhập (như web).
 */
export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ code?: string; error?: string }>()
  const hasLink = !!(params.code || params.error)
  return (
    <AuthScreen title="Đặt mật khẩu mới" description="Chọn mật khẩu mới cho tài khoản của bạn.">
      {hasLink ? <RecoveryLink code={params.code} error={params.error} /> : <Form />}
    </AuthScreen>
  )
}

function RecoveryLink(params: { code?: string; error?: string }) {
  const { data: user, isPending, error } = useCompleteAuthRedirect(params)
  if (isPending) {
    return (
      <View role="status" className="flex-row items-center gap-2">
        <ActivityIndicator colorClassName="accent-muted-foreground" />
        <Text className="text-muted-foreground">Đang mở link, chờ một chút nhé…</Text>
      </View>
    )
  }
  if (!user) {
    return (
      <View className="gap-5">
        <FormAlert>
          {error
            ? authErrorMessage(error)
            : 'Link đặt lại mật khẩu đã hết hạn hoặc đã được dùng. Gửi lại link mới nhé.'}
        </FormAlert>
        <Button variant="outline" onPress={() => router.replace('/forgot-password')}>
          Gửi lại link
        </Button>
      </View>
    )
  }
  return <Form />
}

function Form() {
  return (
    <ResetPasswordForm
      onSuccess={() => {
        toast.success(PASSWORD_UPDATED_NOTICE)
        router.replace('/login')
      }}
    />
  )
}
