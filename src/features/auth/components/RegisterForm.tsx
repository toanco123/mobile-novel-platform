import { zodResolver } from '@hookform/resolvers/zod'
import { MailCheck } from 'lucide-react-native'
import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Text } from '@/components/ui/text'
import { TextLink } from '@/components/ui/text-link'
import { useThemeColors } from '@/hooks/useThemeColors'
import { paths } from '@/lib/routes'
import { authErrorMessage, useSignUp } from '../hooks'
import { openWebPage } from '../navigation'
import { registerSchema, type RegisterValues } from '../schemas'
import { useCaptcha } from '../useCaptcha'
import { FormAlert } from './FormAlert'
import { PasswordField, TextField } from './FormFields'
import { PasswordStrength } from './PasswordStrength'
import { SocialButtons } from './SocialButtons'

/** onSuccess: đã có phiên (đăng ký xong đăng nhập luôn, hoặc đăng ký bằng Google) */
export function RegisterForm({
  onSuccess,
  onClose,
}: {
  onSuccess: () => void
  onClose: () => void
}) {
  const signUp = useSignUp()
  const captcha = useCaptcha()
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null)
  const {
    control,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  })
  const password = useWatch({ control, name: 'password' })

  const onSubmit = handleSubmit(async ({ displayName, email, password }) => {
    const captchaToken = await captcha.token()
    if (captchaToken === null) return
    signUp.mutate(
      { displayName, email, password, captchaToken },
      {
        onSuccess: (result) => {
          if (result.needsEmailConfirmation) setConfirmEmail(email)
          else onSuccess()
        },
        onSettled: captcha.reset,
      },
    )
  })

  if (confirmEmail) return <CheckEmail email={confirmEmail} onClose={onClose} />

  return (
    <View className="gap-6">
      <SocialButtons verb="Đăng ký" onSuccess={onSuccess} disabled={signUp.isPending} />
      <View className="gap-5">
        {signUp.isError && <FormAlert>{authErrorMessage(signUp.error)}</FormAlert>}
        <TextField
          control={control}
          name="displayName"
          label="Tên hiển thị"
          placeholder="Ví dụ: Linh Nguyễn"
          autoComplete="name"
          textContentType="nickname"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => setFocus('email')}
        />
        <TextField
          control={control}
          name="email"
          label="Email"
          placeholder="ten@gmail.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => setFocus('password')}
        />
        <PasswordField
          control={control}
          name="password"
          label="Mật khẩu"
          below={<PasswordStrength password={password} />}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => setFocus('confirmPassword')}
        />
        <PasswordField
          control={control}
          name="confirmPassword"
          label="Nhập lại mật khẩu"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
        />

        <View className="gap-2">
          <View className="flex-row items-start gap-3">
            <Controller
              control={control}
              name="acceptTerms"
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(v) => {
                    field.onChange(v)
                    field.onBlur()
                  }}
                  label="Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật"
                  invalid={!!errors.acceptTerms}
                  className="mt-0.5"
                />
              )}
            />
            <Text className="flex-1 text-sm leading-snug text-muted-foreground">
              Tôi đồng ý với{' '}
              <TextLink onPress={() => openWebPage(paths.terms)}>Điều khoản sử dụng</TextLink> và{' '}
              <TextLink onPress={() => openWebPage(paths.privacy)}>Chính sách bảo mật</TextLink>
            </Text>
          </View>
          {errors.acceptTerms && (
            <Text className="text-sm text-destructive">{errors.acceptTerms.message}</Text>
          )}
        </View>

        {captcha.element}
        <Button
          pending={signUp.isPending || isSubmitting}
          pendingLabel="Đang tạo tài khoản…"
          onPress={() => onSubmit()}
        >
          Tạo tài khoản
        </Button>
      </View>
    </View>
  )
}

function CheckEmail({ email, onClose }: { email: string; onClose: () => void }) {
  const colors = useThemeColors()
  return (
    <View className="items-center gap-4 rounded-xl border border-border bg-card p-6">
      <MailCheck size={40} color={colors.roseGold} />
      <Text role="heading" className="font-heading-bold text-2xl">
        Kiểm tra email của bạn
      </Text>
      <Text className="text-center text-sm text-muted-foreground">
        Chúng tôi đã gửi link xác nhận tới{' '}
        <Text className="font-sans-semibold text-sm">{email}</Text>. Mở email trên điện thoại này và
        bấm vào link để kích hoạt tài khoản.
      </Text>
      <Button variant="outline" onPress={onClose} className="self-stretch">
        Đóng
      </Button>
    </View>
  )
}
