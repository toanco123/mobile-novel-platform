import { router } from 'expo-router'
import { Flag } from 'lucide-react-native'
import { useState } from 'react'
import { BottomPanel } from '@/components/common/BottomPanel'
import { Button } from '@/components/ui/button'
import { useSession } from '@/features/auth/hooks'
import { useOnline } from '@/hooks/useOnline'
import { useThemeColors } from '@/hooks/useThemeColors'
import { useReportChapter } from '../hooks'
import { REPORT_NOTE_MAX, reportReasons, reportSchema, type ReportValues } from '../schemas'
import { ReasonReportForm, type ReportFormValues } from './ReasonReportForm'

/** Như ReportChapterDialog của web: nút "Báo lỗi chương" + bảng chọn lý do; khách thì mở đăng nhập */
export function ReportChapterButton({ slug, chapter }: { slug: string; chapter: number }) {
  const { data: user } = useSession()
  const [open, setOpen] = useState(false)
  const online = useOnline()
  const colors = useThemeColors()

  return (
    <>
      <Button
        variant="ghost"
        disabled={!online}
        aria-label={online ? 'Báo lỗi chương' : 'Cần có mạng để báo lỗi chương'}
        onPress={() => (user ? setOpen(true) : router.push('/login'))}
        icon={<Flag size={15} color={colors.mutedForeground} />}
        className="h-9 self-center rounded-full px-4"
        textClassName="text-sm text-muted-foreground"
      >
        Báo lỗi chương
      </Button>
      <BottomPanel
        open={open}
        onClose={() => setOpen(false)}
        title="Báo lỗi chương"
        description={`Chương ${chapter}. Tác giả sẽ thấy báo lỗi này trong khu Sáng tác.`}
      >
        {/* key: mở lại là form mới */}
        {open && (
          <ReportForm key={chapter} slug={slug} chapter={chapter} onClose={() => setOpen(false)} />
        )}
      </BottomPanel>
    </>
  )
}

function ReportForm({
  slug,
  chapter,
  onClose,
}: {
  slug: string
  chapter: number
  onClose: () => void
}) {
  const report = useReportChapter()
  return (
    <ReasonReportForm
      schema={reportSchema}
      reasons={reportReasons}
      defaultReason="typo"
      noteMax={REPORT_NOTE_MAX}
      mutation={{
        ...report,
        mutate: (values: ReportFormValues) =>
          report.mutate({ slug, chapter, ...(values as ReportValues) }),
      }}
      successText="Đã gửi báo lỗi. Cảm ơn bạn! Tác giả sẽ thấy báo lỗi này trong khu Sáng tác và sửa sớm nhất có thể."
      onClose={onClose}
    />
  )
}
