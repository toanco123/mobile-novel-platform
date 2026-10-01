import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import type { User } from '@/types/user'
import { authErrorMessage, useDeleteAccount } from '../hooks'
import { deleteAccountSchema, type DeleteAccountValues } from '../schemas'
import { useCaptcha } from '../useCaptcha'
import { FormAlert } from './FormAlert'
import { PasswordField, TextField } from './FormFields'

/**
 * Như web (DeleteAccountForm.tsx), trừ lời báo số truyện trong khu Sáng tác (app không có api Sáng
 * tác). onDeleted: đã xóa, phiên đã về khách.
 */
export function DeleteAccountForm({ user, onDeleted }: { user: User; onDeleted: () => void }) {
  const remove = useDeleteAccount()
  const hasPassword = user.provider === 'email'
  // Chỉ tài khoản email phải kiểm tra lại mật khẩu (đăng nhập lại) nên mới cần captcha
  const captcha = useCaptcha()
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<DeleteAccountValues>({
    resolver: zodResolver(deleteAccountSchema(user)),
    mode: 'onTouched',
    defaultValues: { password: '', confirm: '' },
  })

  const onSubmit = handleSubmit(async ({ password }) => {
    const captchaToken = hasPassword ? await captcha.token() : undefined
    if (captchaToken === null) return
    remove.mutate(
      { password: hasPassword ? password : null, captchaToken },
      { onSuccess: onDeleted, onSettled: captcha.reset },
    )
  })

  return (
    <View className="gap-5">
      <Text className="text-muted-foreground">
        Tài khoản bị xóa vĩnh viễn và{' '}
        <Text className="font-sans-semibold">không khôi phục được</Text>. Cùng bị xóa: hồ sơ, bình
        luận, điểm chấm, tủ truyện, lịch sử đọc và mọi truyện, chương bạn đã đăng.
      </Text>
      {remove.isError && <FormAlert>{authErrorMessage(remove.error)}</FormAlert>}
      {hasPassword ? (
        <PasswordField
          control={control}
          name="password"
          label="Nhập mật khẩu để xác nhận"
          autoComplete="current-password"
          textContentType="password"
        />
      ) : (
        <TextField
          control={control}
          name="confirm"
          label={`Gõ email ${user.email} để xác nhận`}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
        />
      )}
      {hasPassword && captcha.element}
      <Button
        variant="destructive"
        pending={remove.isPending || isSubmitting}
        pendingLabel="Đang xóa…"
        onPress={() => onSubmit()}
      >
        Xóa tài khoản vĩnh viễn
      </Button>
    </View>
  )
}
