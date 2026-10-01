import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { View } from 'react-native'
import { Button } from '@/components/ui/button'
import { authErrorMessage, useSendPasswordReset } from '../hooks'
import { forgotPasswordSchema, type ForgotPasswordValues } from '../schemas'
import { useCaptcha } from '../useCaptcha'
import { FormAlert } from './FormAlert'
import { TextField } from './FormFields'

export function ForgotPasswordForm() {
  const send = useSendPasswordReset()
  const captcha = useCaptcha()
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onTouched',
    defaultValues: { email: '' },
  })

  if (send.isSuccess) {
    return (
      <FormAlert variant="success">
        Nếu email này đã đăng ký, bạn sẽ nhận được link đặt lại mật khẩu trong vài phút. Mở link
        trên điện thoại này, và nhớ kiểm tra cả thư mục Spam.
      </FormAlert>
    )
  }

  const onSubmit = handleSubmit(async ({ email }) => {
    const captchaToken = await captcha.token()
    if (captchaToken === null) return
    send.mutate({ email, captchaToken }, { onSettled: captcha.reset })
  })

  return (
    <View className="gap-5">
      {send.isError && <FormAlert>{authErrorMessage(send.error)}</FormAlert>}
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
        returnKeyType="send"
        onSubmitEditing={() => onSubmit()}
      />
      {captcha.element}
      <Button
        pending={send.isPending || isSubmitting}
        pendingLabel="Đang gửi…"
        onPress={() => onSubmit()}
      >
        Gửi link đặt lại
      </Button>
    </View>
  )
}
