import { zodResolver } from '@hookform/resolvers/zod'
import { useController, useForm } from 'react-hook-form'
import { View } from 'react-native'
import { ChoiceList } from '@/components/common/ChoiceList'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Text } from '@/components/ui/text'
import { AuthError } from '@/features/auth/api'
import { FormAlert } from '@/features/auth/components/FormAlert'
import { TextField } from '@/features/auth/components/FormFields'
import { useSession } from '@/features/auth/hooks'
import { cn } from '@/lib/utils'
import { useSendContactMessage } from '../hooks'
import { CONTACT_MESSAGE_MAX, contactSchema, contactTopics, type ContactValues } from '../schemas'

/** Như ContactForm của web: tên, email (điền sẵn khi đã đăng nhập), chủ đề, nội dung */
export function ContactForm() {
  const { data: user } = useSession()
  const send = useSendContactMessage()
  const { control, handleSubmit, reset } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    mode: 'onTouched',
    values: {
      name: user?.displayName ?? '',
      email: user?.email ?? '',
      topic: 'general',
      message: '',
    },
    resetOptions: { keepDirtyValues: true },
  })
  const topic = useController({ control, name: 'topic' })
  const {
    field: { ref, value: message, onChange, onBlur },
    fieldState: { error: messageError },
  } = useController({ control, name: 'message' })

  if (send.isSuccess) {
    return (
      <View className="gap-4">
        <FormAlert variant="success">
          Đã gửi. Cảm ơn bạn! Chúng tôi sẽ trả lời qua email trong vài ngày làm việc.
        </FormAlert>
        <Button
          variant="outline"
          onPress={() => {
            reset()
            send.reset()
          }}
          className="h-11 self-start rounded-full px-5"
          textClassName="text-sm"
        >
          Gửi tin nhắn khác
        </Button>
      </View>
    )
  }

  const onSubmit = handleSubmit((values) => send.mutate(values))

  return (
    <View className="gap-5">
      {send.isError && (
        <FormAlert>
          {/* Gửi quá nhiều tin trong 1 giờ thì báo đợi; lỗi khác thường là mất mạng */}
          {send.error instanceof AuthError
            ? send.error.message
            : 'Chưa gửi được. Kiểm tra mạng rồi thử lại nhé.'}
        </FormAlert>
      )}
      <TextField control={control} name="name" label="Tên của bạn" autoComplete="name" />
      <TextField
        control={control}
        name="email"
        label="Email"
        autoComplete="email"
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="ten@gmail.com"
      />
      <View className="gap-2">
        <Text className="font-sans-medium text-sm">Chủ đề</Text>
        <ChoiceList
          label="Chủ đề"
          options={contactTopics}
          value={topic.field.value}
          onChange={topic.field.onChange}
        />
      </View>
      <View className="gap-2">
        <Text className="font-sans-medium text-sm">Nội dung</Text>
        <Input
          ref={ref}
          aria-label="Nội dung"
          multiline
          value={message}
          onChangeText={onChange}
          onBlur={onBlur}
          invalid={!!messageError}
          textAlignVertical="top"
          placeholder="Bạn muốn góp ý hay báo lỗi gì? Kèm đường dẫn trang nếu có."
          className="h-auto min-h-36 px-3.5 py-3 text-[15px]"
        />
        {messageError ? (
          <Text className="text-sm text-destructive">{messageError.message}</Text>
        ) : (
          <Text
            className={cn(
              'text-right text-xs',
              message.length > CONTACT_MESSAGE_MAX ? 'text-destructive' : 'text-muted-foreground',
            )}
          >
            {`${message.length}/${CONTACT_MESSAGE_MAX}`}
          </Text>
        )}
      </View>
      <Button onPress={() => onSubmit()} pending={send.isPending} pendingLabel="Đang gửi…">
        Gửi tin nhắn
      </Button>
    </View>
  )
}
