import { useQueryClient } from '@tanstack/react-query'
import { Download as DownloadIcon } from 'lucide-react-native'
import { useState } from 'react'
import { View } from 'react-native'
import { BottomPanel } from '@/components/common/BottomPanel'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import { useChapterCountFrom } from '@/features/chapters/hooks'
import { useOnline } from '@/hooks/useOnline'
import { useThemeColors } from '@/hooks/useThemeColors'
import { formatBytes } from '@/lib/format'
import { cn } from '@/lib/utils'
import { cancelDownload, type Download, downloadChapters, useDownloads } from '../downloads'
import { offlineKeys, useSavedChapters } from '../hooks'

type Props = {
  slug: string
  title: string
  /** Tải từ chương này */
  from: number
  /** Nền tối cố định (đầu trang truyện) */
  onDark?: boolean
  className?: string
}

/** Như DownloadButton của web: nút "Tải về đọc offline" + bảng chọn số chương, xem tiến độ, hủy */
export function DownloadButton({ slug, title, from, onDark = false, className }: Props) {
  const online = useOnline()
  const [open, setOpen] = useState(false)
  const download = useDownloads((s) => s.bySlug[slug])
  const running = download?.status === 'running'
  const colors = useThemeColors()

  return (
    <>
      <Button
        variant="outline"
        disabled={!online && !running}
        onPress={() => setOpen(true)}
        icon={<DownloadIcon size={17} color={onDark ? '#f4e7ed' : colors.foreground} />}
        className={cn(
          'h-11 rounded-full px-5',
          onDark && 'border-[#f4e7ed]/30 bg-transparent',
          className,
        )}
        textClassName={cn('text-sm', onDark && 'text-[#f4e7ed]')}
      >
        {running ? `Đang tải ${download.done}/${download.total}` : 'Tải về đọc offline'}
      </Button>
      <BottomPanel
        open={open}
        onClose={() => setOpen(false)}
        title="Tải về đọc offline"
        description={`Tải từ chương ${from}. Chương tải về được giữ trên máy tới khi bạn xóa trong Tủ truyện, mục Đã lưu.`}
      >
        {open && <DownloadPanel slug={slug} title={title} from={from} />}
      </BottomPanel>
    </>
  )
}

function DownloadPanel({ slug, title, from }: Pick<Props, 'slug' | 'title' | 'from'>) {
  const queryClient = useQueryClient()
  const download = useDownloads((s) => s.bySlug[slug])
  const remaining = useChapterCountFrom(slug, from)
  const saved = useSavedChapters(slug)
  const have = saved.data?.filter((c) => c.number >= from).length ?? 0

  if (download?.status === 'running') {
    const percent = download.total ? Math.round((download.done / download.total) * 100) : 0
    return (
      <View className="gap-4 px-4 pt-2 pb-6">
        <View
          role="progressbar"
          aria-label="Tiến độ tải"
          aria-valuemin={0}
          aria-valuemax={download.total}
          aria-valuenow={download.done}
          className="h-2 overflow-hidden rounded-full bg-muted"
        >
          <View className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
        </View>
        <Text className="text-sm text-muted-foreground">
          {`Đang tải ${download.done}/${download.total} chương. Có thể đóng bảng này, việc tải vẫn tiếp tục.`}
        </Text>
        <Button
          variant="outline"
          onPress={() => cancelDownload(slug)}
          className="h-10 self-start rounded-full px-5"
          textClassName="text-sm"
        >
          Hủy tải
        </Button>
      </View>
    )
  }

  const start = (total: number) =>
    void downloadChapters({
      slug,
      title,
      from,
      total,
      onChange: () => void queryClient.invalidateQueries({ queryKey: offlineKeys.all }),
    })
  const total = remaining.data

  return (
    <View className="gap-4 px-4 pt-2 pb-6">
      {download && <DownloadResult download={download} />}
      {have > 0 && (
        <Text className="text-sm text-muted-foreground">
          {`Đã có ${have} chương từ chương ${from} trên máy.`}
        </Text>
      )}
      {remaining.isError ? (
        <Text className="text-sm text-destructive">Không lấy được số chương. Thử lại sau.</Text>
      ) : total === undefined ? (
        <Skeleton className="h-10 rounded-full" />
      ) : total === 0 ? (
        <Text className="text-sm text-muted-foreground">Không còn chương nào để tải.</Text>
      ) : (
        <View className="flex-row flex-wrap gap-2">
          {[20, 50]
            .filter((n) => n < total)
            .map((n) => (
              <Button
                key={n}
                variant="outline"
                onPress={() => start(n)}
                className="h-10 rounded-full px-5"
                textClassName="text-sm"
              >
                {`${n} chương`}
              </Button>
            ))}
          <Button
            onPress={() => start(total)}
            className="h-10 rounded-full px-5"
            textClassName="text-sm"
          >
            {`Toàn bộ ${total} chương`}
          </Button>
        </View>
      )}
    </View>
  )
}

function DownloadResult({ download }: { download: Download }) {
  const text =
    download.status === 'done'
      ? `Đã tải ${download.done} chương · ${formatBytes(download.bytes)}.`
      : download.status === 'cancelled'
        ? `Đã hủy, giữ ${download.done} chương đã tải.`
        : download.error
  return (
    <View role="status" className="rounded-lg bg-muted px-3 py-2">
      <Text className="text-sm">{text}</Text>
    </View>
  )
}
