import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { View } from 'react-native'
import { Button } from '@/components/ui/button'
import { authErrorMessage, useUpdatePassword } from '../hooks'
import { resetPasswordSchema, type ResetPasswordValues } from '../schemas'
import { FormAlert } from './FormAlert'
import { PasswordField } from './FormFields'
import { PasswordStrength } from './PasswordStrength'

export const PASSWORD_UPDATED_NOTICE = 'Đã lưu mật khẩu mới. Đăng nhập lại bằng mật khẩu này.'

/** onSuccess: đã lưu và đăng xuất khỏi mọi thiết bị (như web) */
export function ResetPasswordForm({ onSuccess }: { onSuccess: () => void }) {
  const update = useUpdatePassword()
  const { control, handleSubmit, setFocus } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onTouched',
    defaultValues: { password: '', confirmPassword: '' },
  })
  const password = useWatch({ control, name: 'password' })

  const onSubmit = handleSubmit(({ password }) => update.mutate(password, { onSuccess }))

  return (
    <View className="gap-5">
      {update.isError && <FormAlert>{authErrorMessage(update.error)}</FormAlert>}
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
      <Button pending={update.isPending} pendingLabel="Đang lưu…" onPress={() => onSubmit()}>
        Lưu mật khẩu mới
      </Button>
    </View>
  )
}
