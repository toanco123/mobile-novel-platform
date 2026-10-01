import { zodResolver } from '@hookform/resolvers/zod'
import { router } from 'expo-router'
import { useForm } from 'react-hook-form'
import { View } from 'react-native'
import { Button } from '@/components/ui/button'
import { TextLink } from '@/components/ui/text-link'
import { authErrorMessage, useSignIn } from '../hooks'
import { loginSchema, type LoginValues } from '../schemas'
import { useCaptcha } from '../useCaptcha'
import { FormAlert } from './FormAlert'
import { PasswordField, TextField } from './FormFields'
import { SocialButtons } from './SocialButtons'

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const signIn = useSignIn()
  const captcha = useCaptcha()
  const {
    control,
    handleSubmit,
    setFocus,
    formState: { isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    const captchaToken = await captcha.token()
    if (captchaToken === null) return
    signIn.mutate({ ...values, captchaToken }, { onSuccess, onSettled: captcha.reset })
  })

  return (
    <View className="gap-6">
      <SocialButtons verb="Đăng nhập" onSuccess={onSuccess} disabled={signIn.isPending} />
      <View className="gap-5">
        {signIn.isError && <FormAlert>{authErrorMessage(signIn.error)}</FormAlert>}
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
          labelAside={
            <TextLink onPress={() => router.push('/forgot-password')}>Quên mật khẩu?</TextLink>
          }
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={() => onSubmit()}
        />
        {captcha.element}
        <Button
          pending={signIn.isPending || isSubmitting}
          pendingLabel="Đang đăng nhập…"
          onPress={() => onSubmit()}
        >
          Đăng nhập
        </Button>
      </View>
    </View>
  )
}
