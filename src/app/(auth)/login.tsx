import { router } from 'expo-router'
import { TextLink } from '@/components/ui/text-link'
import { AuthFooter, AuthScreen } from '@/features/auth/components/AuthScreen'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { useCloseAuth } from '@/features/auth/navigation'

export default function LoginScreen() {
  const close = useCloseAuth()
  return (
    <AuthScreen
      title="Đăng nhập"
      description="Đọc tiếp truyện bạn đang theo dõi, trên mọi thiết bị."
      footer={
        <AuthFooter>
          Chưa có tài khoản?{' '}
          <TextLink onPress={() => router.replace('/register')}>Tạo tài khoản</TextLink>
        </AuthFooter>
      }
    >
      <LoginForm onSuccess={close} />
    </AuthScreen>
  )
}
