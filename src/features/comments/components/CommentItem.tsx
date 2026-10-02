import { router } from 'expo-router'
import { useState } from 'react'
import { Alert, Pressable, View } from 'react-native'
import { toast } from 'sonner-native'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import { UserAvatar } from '@/features/auth/components/UserAvatar'
import { authErrorMessage } from '@/features/auth/hooks'
import { useBlockUser } from '@/features/blocks/hooks'
import { formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Comment } from '@/types/comment'
import type { User } from '@/types/user'
import { useDeleteComment, useReplies } from '../hooks'
import { CommentForm } from './CommentForm'
import { ReportCommentButton } from './ReportCommentButton'

type Props = {
  /** Bình luận gốc */
  comment: Comment
  /** Người đang xem; null: khách */
  viewer: User | null
}

const toLogin = () => router.push('/login')

/** Như CommentItem của web: một bình luận gốc cùng nhóm trả lời của nó (một cấp) */
export function CommentItem({ comment, viewer }: Props) {
  const [open, setOpen] = useState(false)
  // Ô viết trả lời đang mở với nội dung điền sẵn này ('' hoặc "@Tên "); null: đang đóng
  const [draft, setDraft] = useState<string | null>(null)
  const replies = useReplies(comment.storySlug, comment.id, open)

  const startReply = (mention?: string) =>
    viewer ? setDraft(mention ? `@${mention} ` : '') : toLogin()

  return (
    <View className="flex-row gap-3 py-4">
      <UserAvatar user={comment.user} size={36} />
      <View className="flex-1">
        <CommentBody comment={comment} />
        <CommentActions comment={comment} viewer={viewer} onReply={() => startReply()} />

        {(comment.replyCount > 0 || open) && (
          <Pressable
            role="button"
            aria-expanded={open}
            onPress={() => setOpen(!open)}
            className="mt-1 self-start py-1"
          >
            <Text className="font-sans-medium text-xs text-rose-gold">
              {open ? 'Ẩn trả lời' : `Xem ${comment.replyCount} trả lời`}
            </Text>
          </Pressable>
        )}

        {open &&
          (replies.isError ? (
            <Text className="mt-2 text-sm text-muted-foreground">
              Không tải được trả lời. Thử lại sau.
            </Text>
          ) : replies.isPending ? (
            <Skeleton className="mt-3 h-12 rounded-lg" />
          ) : (
            replies.data.length > 0 && (
              <View
                aria-label={`Trả lời bình luận của ${comment.user.displayName}`}
                className="mt-3 gap-4 border-l border-border pl-4"
              >
                {replies.data.map((reply) => (
                  <View key={reply.id} className="flex-row gap-2.5">
                    <UserAvatar user={reply.user} size={28} />
                    <View className="flex-1">
                      <CommentBody comment={reply} />
                      <CommentActions
                        comment={reply}
                        viewer={viewer}
                        onReply={() => startReply(reply.user.displayName)}
                      />
                    </View>
                  </View>
                ))}
              </View>
            )
          ))}

        {draft !== null && viewer && (
          <View className={cn('mt-3', open && 'border-l border-border pl-4')}>
            {/* key: bấm "Trả lời" ở câu trả lời khác thì mở form mới với tên người đó */}
            <CommentForm
              key={draft}
              slug={comment.storySlug}
              user={viewer}
              chapter={comment.chapterNumber}
              parentId={comment.id}
              initialContent={draft}
              onCancel={() => setDraft(null)}
              onDone={() => {
                setDraft(null)
                setOpen(true)
              }}
            />
          </View>
        )}
      </View>
    </View>
  )
}

function CommentBody({ comment }: { comment: Comment }) {
  return (
    <>
      <View className="flex-row flex-wrap items-baseline gap-x-2">
        <Text className="font-sans-medium text-sm">{comment.user.displayName}</Text>
        <Text className="text-xs text-muted-foreground">
          {formatRelativeTime(comment.createdAt)}
        </Text>
      </View>
      <Text selectable className="mt-1 text-sm leading-relaxed text-foreground/90">
        {comment.content}
      </Text>
    </>
  )
}

/**
 * Hàng nút dưới một bình luận hoặc trả lời: Trả lời, rồi Xóa (của mình) hoặc Báo cáo, Chặn (của
 * người khác)
 */
function CommentActions({
  comment,
  viewer,
  onReply,
}: {
  comment: Comment
  viewer: User | null
  onReply: () => void
}) {
  const remove = useDeleteComment(comment.storySlug)
  const confirmDelete = () =>
    Alert.alert(
      'Xóa bình luận này?',
      `Bình luận sẽ bị xóa vĩnh viễn và không khôi phục được.${
        comment.replyCount > 0 ? ` ${comment.replyCount} trả lời bên dưới cũng sẽ bị xóa.` : ''
      }`,
      [
        { text: 'Giữ lại', style: 'cancel' },
        { text: 'Xóa bình luận', style: 'destructive', onPress: () => remove.mutate(comment.id) },
      ],
    )

  return (
    <View className="mt-1 flex-row flex-wrap items-center gap-x-4">
      <ActionButton label="Trả lời" onPress={onReply} />
      {comment.user.id === viewer?.id ? (
        <ActionButton label="Xóa" onPress={confirmDelete} disabled={remove.isPending} />
      ) : (
        <>
          <ReportCommentButton comment={comment} guest={!viewer} />
          <BlockButton comment={comment} guest={!viewer} />
        </>
      )}
    </View>
  )
}

/**
 * Chặn người viết (riêng của app, App Store Guideline 1.2): hỏi lại rồi chặn; bình luận của người đó
 * tự ẩn (RLS). Bỏ chặn ở Tài khoản → Người đã chặn.
 */
function BlockButton({ comment, guest }: { comment: Comment; guest: boolean }) {
  const block = useBlockUser()
  const name = comment.user.displayName
  const confirm = () =>
    Alert.alert(
      `Chặn ${name}?`,
      `Bạn sẽ không thấy bình luận và trả lời của ${name} nữa. Người này không được báo. Bỏ chặn trong Tài khoản → Người đã chặn.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Chặn',
          style: 'destructive',
          onPress: () =>
            block.mutate(comment.user.id, {
              onSuccess: () => toast.success(`Đã chặn ${name}`),
              onError: (error) => toast.error(authErrorMessage(error)),
            }),
        },
      ],
    )
  return (
    <ActionButton label="Chặn" onPress={guest ? toLogin : confirm} disabled={block.isPending} />
  )
}

function ActionButton({
  label,
  onPress,
  disabled,
}: {
  label: string
  onPress: () => void
  disabled?: boolean
}) {
  return (
    <Pressable role="button" hitSlop={6} disabled={disabled} onPress={onPress} className="py-1">
      <Text className="text-xs text-muted-foreground">{label}</Text>
    </Pressable>
  )
}
