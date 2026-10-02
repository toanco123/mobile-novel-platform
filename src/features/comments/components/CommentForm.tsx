import { zodResolver } from '@hookform/resolvers/zod'
import { useController, useForm } from 'react-hook-form'
import { View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Text } from '@/components/ui/text'
import { FormAlert } from '@/features/auth/components/FormAlert'
import { UserAvatar } from '@/features/auth/components/UserAvatar'
import { authErrorMessage } from '@/features/auth/hooks'
import { cn } from '@/lib/utils'
import type { User } from '@/types/user'
import { useAddComment } from '../hooks'
import { COMMENT_MAX, commentSchema, type CommentValues } from '../schemas'

type Props = {
  slug: string
  user: User
  /** Có số: bình luận cho chương đó */
  chapter?: number | null
  /** Có giá trị: ô viết trả lời cho bình luận gốc này */
  parentId?: string | null
  /** Nội dung điền sẵn (trả lời một câu trả lời: "@Tên ") */
  initialContent?: string
  /** Gửi xong */
  onDone?: () => void
  /** Có thì hiện nút "Hủy" */
  onCancel?: () => void
}

/** Như CommentForm của web: ô viết bình luận / trả lời, đếm ký tự, báo lỗi từ máy chủ */
export function CommentForm({
  slug,
  user,
  chapter = null,
  parentId = null,
  initialContent = '',
  onDone,
  onCancel,
}: Props) {
  const add = useAddComment(slug, chapter, parentId)
  const isReply = parentId !== null
  const { control, handleSubmit, reset } = useForm<CommentValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: initialContent },
  })
  const {
    field: { ref, value, onChange, onBlur },
    fieldState: { error },
  } = useController({ control, name: 'content' })

  const onSubmit = handleSubmit(({ content }) =>
    add.mutate(content, {
      onSuccess: () => {
        reset({ content: '' })
        onDone?.()
      },
    }),
  )

  return (
    <View className="flex-row gap-3">
      <UserAvatar user={user} size={isReply ? 28 : 36} />
      <View className="flex-1 gap-2">
        {add.isError && <FormAlert>{authErrorMessage(add.error)}</FormAlert>}
        <Input
          ref={ref}
          aria-label={isReply ? 'Viết trả lời' : 'Viết bình luận'}
          multiline
          // Ô trả lời vừa mở: bật bàn phím để viết tiếp sau phần điền sẵn
          autoFocus={isReply}
          value={value}
          onChangeText={onChange}
          onBlur={onBlur}
          placeholder={
            isReply
              ? 'Viết trả lời…'
              : chapter === null
                ? 'Chia sẻ cảm nhận của bạn về truyện này…'
                : 'Bạn nghĩ gì về chương này?'
          }
          invalid={!!error}
          textAlignVertical="top"
          className={cn('px-3.5 py-3 text-[15px]', isReply ? 'h-auto min-h-16' : 'h-auto min-h-24')}
        />
        <View className="flex-row items-center justify-between gap-3">
          <Text
            className={cn(
              'text-xs',
              error || value.length > COMMENT_MAX ? 'text-destructive' : 'text-muted-foreground',
            )}
          >
            {error?.message ?? `${value.length}/${COMMENT_MAX}`}
          </Text>
          <View className="flex-row items-center gap-2">
            {onCancel && (
              <Button
                variant="ghost"
                onPress={onCancel}
                disabled={add.isPending}
                className="h-9 rounded-full px-4"
                textClassName="text-sm"
              >
                Hủy
              </Button>
            )}
            <Button
              onPress={() => onSubmit()}
              pending={add.isPending}
              pendingLabel="Đang gửi…"
              className="h-9 rounded-full px-5"
              textClassName="text-sm"
            >
              {isReply ? 'Gửi trả lời' : 'Gửi bình luận'}
            </Button>
          </View>
        </View>
      </View>
    </View>
  )
}
