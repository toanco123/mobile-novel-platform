import { router } from 'expo-router'
import { TextLink } from '@/components/ui/text-link'
import { AuthFooter, AuthScreen } from '@/features/auth/components/AuthScreen'
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm'

export default function ForgotPasswordScreen() {
  return (
    <AuthScreen
      title="Quên mật khẩu"
      description="Nhập email bạn dùng để đăng ký, chúng tôi sẽ gửi link đặt lại mật khẩu."
      footer={
        <AuthFooter>
          Nhớ ra rồi?{' '}
          <TextLink onPress={() => (router.canGoBack() ? router.back() : router.replace('/login'))}>
            Quay lại đăng nhập
          </TextLink>
        </AuthFooter>
      }
    >
      <ForgotPasswordForm />
    </AuthScreen>
  )
}
