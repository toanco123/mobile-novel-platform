import { zodResolver } from '@hookform/resolvers/zod'
import { useController, useForm } from 'react-hook-form'
import { ScrollView, View } from 'react-native'
import type { z } from 'zod'
import { ChoiceList } from '@/components/common/ChoiceList'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Text } from '@/components/ui/text'
import { FormAlert } from '@/features/auth/components/FormAlert'
import { authErrorMessage } from '@/features/auth/hooks'
import { cn } from '@/lib/utils'

/** Lý do là chuỗi: mỗi loại báo cáo có tập lý do riêng (schema của nó kiểm đúng giá trị) */
export type ReportFormValues = { reason: string; note: string }

type Props = {
  schema: z.ZodType<ReportFormValues, ReportFormValues>
  reasons: readonly { value: string; label: string }[]
  defaultReason: string
  noteMax: number
  /** Nội dung đang báo cáo (trích bình luận) */
  quote?: string
  mutation: {
    mutate: (values: ReportFormValues) => void
    isPending: boolean
    isError: boolean
    error: unknown
    isSuccess: boolean
  }
  /** Lời cảm ơn sau khi gửi */
  successText: string
  onClose: () => void
}

/**
 * Phần form chung của ReportCommentDialog và ReportChapterDialog của web: chọn lý do, ghi chú (lý do
 * "khác" thì bắt buộc), gửi; gửi xong thì cảm ơn. Đặt trong BottomPanel (tiêu đề ở bảng).
 */
export function ReasonReportForm({
  schema,
  reasons,
  defaultReason,
  noteMax,
  quote,
  mutation,
  successText,
  onClose,
}: Props) {
  const { control, handleSubmit } = useForm<ReportFormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { reason: defaultReason, note: '' },
  })
  const reason = useController({ control, name: 'reason' })
  const {
    field: { ref, value: note, onChange, onBlur },
    fieldState: { error },
  } = useController({ control, name: 'note' })

  if (mutation.isSuccess) {
    return (
      <View className="gap-5 px-4 pb-6">
        <FormAlert variant="success">{successText}</FormAlert>
        <Button onPress={onClose} className="h-11 rounded-full">
          Đóng
        </Button>
      </View>
    )
  }

  const onSubmit = handleSubmit((values) => mutation.mutate(values))

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      contentContainerClassName="gap-5 px-4 pb-6"
    >
      {mutation.isError && <FormAlert>{authErrorMessage(mutation.error)}</FormAlert>}
      {quote ? (
        <Text
          numberOfLines={3}
          className="border-l-2 border-border pl-3 text-sm text-muted-foreground"
        >
          {quote}
        </Text>
      ) : null}
      <View className="gap-2">
        <Text className="font-sans-medium text-sm">Lý do</Text>
        <ChoiceList
          label="Lý do"
          options={reasons}
          value={reason.field.value}
          onChange={reason.field.onChange}
        />
      </View>
      <View className="gap-2">
        <Text className="font-sans-medium text-sm">
          Ghi chú <Text className="text-sm text-muted-foreground">(không bắt buộc)</Text>
        </Text>
        <Input
          ref={ref}
          aria-label="Ghi chú"
          multiline
          value={note}
          onChangeText={onChange}
          onBlur={onBlur}
          invalid={!!error}
          textAlignVertical="top"
          className="h-auto min-h-20 px-3.5 py-3 text-[15px]"
        />
        <Text
          className={cn(
            'text-xs',
            error || note.length > noteMax ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {error?.message ?? `${note.length}/${noteMax}`}
        </Text>
      </View>
      <View className="flex-row justify-end gap-2">
        <Button
          variant="outline"
          onPress={onClose}
          className="h-11 rounded-full px-5"
          textClassName="text-sm"
        >
          Hủy
        </Button>
        <Button
          onPress={() => onSubmit()}
          pending={mutation.isPending}
          pendingLabel="Đang gửi…"
          className="h-11 rounded-full px-5"
          textClassName="text-sm"
        >
          Gửi báo cáo
        </Button>
      </View>
    </ScrollView>
  )
}
