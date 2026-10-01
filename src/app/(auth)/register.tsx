import { router } from 'expo-router'
import { TextLink } from '@/components/ui/text-link'
import { AuthFooter, AuthScreen } from '@/features/auth/components/AuthScreen'
import { RegisterForm } from '@/features/auth/components/RegisterForm'
import { useCloseAuth } from '@/features/auth/navigation'

export default function RegisterScreen() {
  const close = useCloseAuth()
  return (
    <AuthScreen
      title="Tạo tài khoản"
      description="Lưu truyện vào tủ, nhớ chương đang đọc và bình luận cùng mọi người."
      footer={
        <AuthFooter>
          Đã có tài khoản? <TextLink onPress={() => router.replace('/login')}>Đăng nhập</TextLink>
        </AuthFooter>
      }
    >
      <RegisterForm onSuccess={close} onClose={close} />
    </AuthScreen>
  )
}
