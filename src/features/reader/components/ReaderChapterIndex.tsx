import { useState } from 'react'
import { FlatList, Pressable, ScrollView, View } from 'react-native'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import { CHAPTERS_PER_PAGE } from '@/features/chapters/api'
import { JumpToChapter } from '@/features/chapters/components/JumpToChapter'
import { useChapterList } from '@/features/chapters/hooks'
import { DownloadButton } from '@/features/offline/components/DownloadButton'
import { useSavedChapters } from '@/features/offline/hooks'
import { useOnline } from '@/hooks/useOnline'
import { cn } from '@/lib/utils'
import type { ChapterNeighbor } from '@/types/chapter'
import { goToChapter } from '../navigation'

type Props = {
  slug: string
  /** Tên truyện (thông báo tải về) */
  title: string
  /** Có nút tải về đọc offline (chỉ truyện công khai) */
  downloadable: boolean
  current: number
  /** Số chương lớn nhất (để kiểm tra ô "đi tới chương") */
  max: number
  onNavigate: () => void
}

/** Mỗi dòng cao cố định để mở sẵn danh sách tới chương đang đọc (getItemLayout) */
const ROW_HEIGHT = 44

/** Như ReaderChapterIndex của web: mở sẵn khoảng 50 chương chứa chương đang đọc, cuộn tới chương đó */
export function ReaderChapterIndex({ slug, title, downloadable, current, max, onNavigate }: Props) {
  const [page, setPage] = useState(() => Math.max(1, Math.ceil(current / CHAPTERS_PER_PAGE)))
  const { data, isPending, isError, isPlaceholderData } = useChapterList(slug, page, 'asc')
  const online = useOnline()
  const pageCount = data?.pageCount ?? Math.max(1, Math.ceil(max / CHAPTERS_PER_PAGE))
  const total = data?.total ?? max

  const open = (number: number) => {
    onNavigate()
    if (number !== current) goToChapter(slug, number)
  }

  return (
    <View className="flex-1">
      <View className="gap-3 border-b border-border px-4 pb-4">
        {pageCount > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2"
            aria-label="Chọn khoảng chương"
          >
            {Array.from({ length: pageCount }, (_, i) => {
              const from = i * CHAPTERS_PER_PAGE + 1
              const to = Math.min((i + 1) * CHAPTERS_PER_PAGE, total)
              const active = page === i + 1
              return (
                <Pressable
                  key={i}
                  role="radio"
                  aria-checked={active}
                  onPress={() => setPage(i + 1)}
                  className={cn(
                    'h-9 justify-center rounded-full border px-3.5',
                    active ? 'border-primary bg-primary/10' : 'border-border',
                  )}
                >
                  <Text
                    className={cn('text-sm', active ? 'text-foreground' : 'text-muted-foreground')}
                  >
                    {`${from}–${to}`}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>
        )}
        <JumpToChapter slug={slug} max={max} onJump={open} />
        {downloadable && (
          <DownloadButton slug={slug} title={title} from={current} className="h-10 self-start" />
        )}
      </View>

      {!online && !data ? (
        <SavedIndex slug={slug} current={current} onOpen={open} />
      ) : isError ? (
        <Text className="p-4 text-sm text-muted-foreground">
          Không tải được danh sách chương. Đóng mục lục rồi mở lại để thử lại.
        </Text>
      ) : isPending ? (
        <View className="gap-5 px-5 py-4">
          {Array.from({ length: 10 }, (_, i) => (
            <Skeleton key={i} className="h-4 w-4/5" />
          ))}
        </View>
      ) : (
        <ChapterRows
          // Đổi khoảng chương thì dựng lại danh sách để mở đúng vị trí
          key={page}
          chapters={data.items}
          current={current}
          onOpen={open}
          busy={isPlaceholderData}
        />
      )}
    </View>
  )
}

/** Danh sách chương, mở sẵn tới chương đang đọc (nằm khoảng giữa bảng thay vì sát mép trên) */
function ChapterRows({
  chapters,
  current,
  onOpen,
  busy = false,
}: {
  chapters: ChapterNeighbor[]
  current: number
  onOpen: (number: number) => void
  busy?: boolean
}) {
  const currentIndex = chapters.findIndex((c) => c.number === current)
  return (
    <FlatList
      data={chapters}
      keyExtractor={(c) => String(c.number)}
      getItemLayout={(_, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index })}
      initialScrollIndex={currentIndex > 3 ? currentIndex - 3 : undefined}
      aria-busy={busy}
      className={cn(busy && 'opacity-60')}
      contentContainerClassName="px-2 py-2"
      renderItem={({ item: c }) => {
        const active = c.number === current
        return (
          <Pressable
            role="link"
            aria-selected={active}
            onPress={() => onOpen(c.number)}
            style={{ height: ROW_HEIGHT }}
            className={cn(
              'flex-row items-center gap-3 rounded-lg px-3',
              active ? 'border border-primary/30 bg-primary/10' : 'active:bg-muted',
            )}
          >
            <Text className="w-10 text-right text-sm text-muted-foreground">
              {String(c.number)}
            </Text>
            <Text
              numberOfLines={1}
              className={cn(
                'flex-1 text-sm',
                active ? 'font-sans-medium text-foreground' : 'text-muted-foreground',
              )}
            >
              {c.title}
            </Text>
          </Pressable>
        )
      }}
    />
  )
}

/** Như web: mất mạng (chưa có mục lục) thì chỉ liệt kê chương đã lưu trên máy của truyện */
function SavedIndex({
  slug,
  current,
  onOpen,
}: {
  slug: string
  current: number
  onOpen: (number: number) => void
}) {
  const { data } = useSavedChapters(slug)
  if (!data) return null
  return (
    <View className="flex-1">
      <Text className="px-5 pt-3 text-sm text-muted-foreground">
        {data.length
          ? 'Đang offline, các chương đã lưu:'
          : 'Đang offline và truyện này chưa có chương nào được lưu.'}
      </Text>
      <ChapterRows chapters={data} current={current} onOpen={onOpen} />
    </View>
  )
}
