import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable } from 'react-native'
import { BottomPanel } from '@/components/common/BottomPanel'
import { Text } from '@/components/ui/text'
import {
  ReasonReportForm,
  type ReportFormValues,
} from '@/features/feedback/components/ReasonReportForm'
import type { Comment } from '@/types/comment'
import { useReportComment } from '../hooks'
import {
  COMMENT_REPORT_NOTE_MAX,
  commentReportReasons,
  commentReportSchema,
  type CommentReportValues,
} from '../schemas'

/** Như ReportCommentDialog của web: nút "Báo cáo" + bảng chọn lý do; khách thì mở đăng nhập */
export function ReportCommentButton({ comment, guest }: { comment: Comment; guest: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Pressable
        role="button"
        hitSlop={6}
        onPress={() => (guest ? router.push('/login') : setOpen(true))}
        className="py-1"
      >
        <Text className="text-xs text-muted-foreground">Báo cáo</Text>
      </Pressable>
      <BottomPanel
        open={open}
        onClose={() => setOpen(false)}
        title="Báo cáo bình luận"
        description={`Bình luận của ${comment.user.displayName}. Chỉ ban quản trị thấy báo cáo này.`}
      >
        {/* Chỉ dựng form khi mở: mở lại là form mới */}
        {open && <ReportForm comment={comment} onClose={() => setOpen(false)} />}
      </BottomPanel>
    </>
  )
}

function ReportForm({ comment, onClose }: { comment: Comment; onClose: () => void }) {
  const report = useReportComment()
  return (
    <ReasonReportForm
      schema={commentReportSchema}
      reasons={commentReportReasons}
      defaultReason="spam"
      noteMax={COMMENT_REPORT_NOTE_MAX}
      quote={comment.content}
      mutation={{
        ...report,
        mutate: (values: ReportFormValues) =>
          report.mutate({ commentId: comment.id, ...(values as CommentReportValues) }),
      }}
      successText="Đã gửi báo cáo. Cảm ơn bạn! Ban quản trị sẽ xem bình luận này và gỡ nếu vi phạm."
      onClose={onClose}
    />
  )
}
