import { Link } from 'expo-router'
import { Pressable, View } from 'react-native'
import { Pagination } from '@/components/common/Pagination'
import { SectionNote } from '@/components/common/SectionHeading'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import { formatDate } from '@/lib/format'
import { links } from '@/lib/links'
import { cn } from '@/lib/utils'
import type { ChapterOrder } from '@/types/chapter'
import type { Story } from '@/types/story'
import { useChapterList } from '../hooks'
import { JumpToChapter } from './JumpToChapter'

type Props = {
  story: Story
  page: number
  order: ChapterOrder
  /** Đổi trang hoặc thứ tự (màn hình giữ trên params của route như query string của web) */
  onChange: (page: number, order: ChapterOrder) => void
  /** Chương người xem đang đọc dở (gắn nhãn "Đang đọc") */
  readingChapter?: number
}

const ORDERS = [
  ['asc', 'Cũ nhất'],
  ['desc', 'Mới nhất'],
] as const

/** Như ChapterList của web: thứ tự, đi tới chương, 50 chương mỗi trang */
export function ChapterList({ story, page, order, onChange, readingChapter }: Props) {
  const { data, isPending, isError, isPlaceholderData } = useChapterList(story.slug, page, order)

  if (story.chapterCount === 0) {
    return <SectionNote>Truyện chưa có chương nào được xuất bản.</SectionNote>
  }

  return (
    <View className="px-4">
      <View className="mb-3 flex-row flex-wrap items-start justify-between gap-3">
        <View
          role="radiogroup"
          aria-label="Thứ tự chương"
          className="flex-row rounded-full border border-border p-0.5"
        >
          {ORDERS.map(([value, label]) => (
            <Pressable
              key={value}
              role="radio"
              aria-checked={order === value}
              onPress={() => order !== value && onChange(1, value)}
              className={cn(
                'h-8 justify-center rounded-full px-3.5',
                order === value && 'bg-secondary',
              )}
            >
              <Text
                className={cn(
                  'text-sm',
                  order === value
                    ? 'font-sans-medium text-secondary-foreground'
                    : 'text-muted-foreground',
                )}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
        <JumpToChapter slug={story.slug} max={story.latestChapter?.number ?? story.chapterCount} />
      </View>

      {isError ? (
        <Text className="py-4 text-sm text-muted-foreground">
          Không tải được danh sách chương. Kéo xuống để tải lại.
        </Text>
      ) : (
        <View
          aria-busy={isPending || isPlaceholderData}
          className={cn(isPlaceholderData && 'opacity-60')}
        >
          {isPending
            ? Array.from({ length: 12 }, (_, i) => (
                <View key={i} className="border-b border-border py-3.5">
                  <Skeleton className="h-4 w-4/5" />
                </View>
              ))
            : data.items.map((c) => (
                <Link key={c.number} href={links.chapter(story.slug, c.number)} asChild>
                  <Pressable className="flex-row items-center gap-3 border-b border-border py-3 active:opacity-60">
                    <Text numberOfLines={1} className="flex-1 text-sm">
                      <Text className="font-sans-medium text-sm">
                        Chương {c.number}
                        {c.title && ':'}
                      </Text>
                      {c.title && ` ${c.title}`}
                    </Text>
                    {c.number === readingChapter && <Badge tone="reading">Đang đọc</Badge>}
                    {c.number === story.latestChapter?.number && <Badge tone="new">Mới</Badge>}
                    <Text className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</Text>
                  </Pressable>
                </Link>
              ))}
        </View>
      )}

      {data && (
        <Pagination
          page={data.page}
          pageCount={data.pageCount}
          onChange={(p) => onChange(p, order)}
          label="Phân trang danh sách chương"
        />
      )}
    </View>
  )
}

const badgeTones = {
  reading: { box: 'bg-rose-gold/15', text: 'text-rose-gold' },
  new: { box: 'bg-neon/15', text: 'text-neon' },
}

/** Nhãn nhỏ cạnh tên chương */
function Badge({ tone, children }: { tone: keyof typeof badgeTones; children: string }) {
  return (
    <View className={cn('rounded-sm px-1.5 py-0.5', badgeTones[tone].box)}>
      <Text className={cn('font-sans-semibold text-[10px]', badgeTones[tone].text)}>
        {children}
      </Text>
    </View>
  )
}
