import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import type { User } from '@/types/user'
import { authErrorMessage, useChangePassword } from '../hooks'
import { changePasswordSchema, type ChangePasswordValues } from '../schemas'
import { useCaptcha } from '../useCaptcha'
import { FormAlert } from './FormAlert'
import { PasswordField } from './FormFields'
import { PasswordStrength } from './PasswordStrength'

const providerName = { google: 'Google', facebook: 'Facebook' } as const

export function ChangePasswordForm({ user }: { user: User }) {
  const change = useChangePassword()
  const captcha = useCaptcha()
  const {
    control,
    handleSubmit,
    reset,
    setFocus,
    formState: { isSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onTouched',
    defaultValues: { currentPassword: '', password: '', confirmPassword: '' },
  })
  const password = useWatch({ control, name: 'password' })

  if (user.provider !== 'email') {
    return (
      <Text className="text-muted-foreground">
        Bạn đăng nhập bằng {providerName[user.provider]}, nên tài khoản không có mật khẩu riêng.
      </Text>
    )
  }

  const onSubmit = handleSubmit(async ({ currentPassword, password }) => {
    const captchaToken = await captcha.token()
    if (captchaToken === null) return
    change.mutate(
      { currentPassword, newPassword: password, captchaToken },
      { onSuccess: () => reset(), onSettled: captcha.reset },
    )
  })

  return (
    <View className="gap-5">
      {change.isError && <FormAlert>{authErrorMessage(change.error)}</FormAlert>}
      {change.isSuccess && <FormAlert variant="success">Đã đổi mật khẩu.</FormAlert>}
      <PasswordField
        control={control}
        name="currentPassword"
        label="Mật khẩu hiện tại"
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => setFocus('password')}
      />
      <PasswordField
        control={control}
        name="password"
        label="Mật khẩu mới"
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
        label="Nhập lại mật khẩu mới"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={() => onSubmit()}
      />
      {captcha.element}
      <Button
        pending={change.isPending || isSubmitting}
        pendingLabel="Đang lưu…"
        onPress={() => onSubmit()}
      >
        Đổi mật khẩu
      </Button>
    </View>
  )
}
