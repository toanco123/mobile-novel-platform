import { View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import { useChapter } from '@/features/chapters/hooks'
import { ReportChapterButton } from '@/features/feedback/components/ReportChapterButton'
import { NotSavedNotice } from '@/features/offline/components/NotSavedNotice'
import { ChapterNotSavedError } from '@/features/offline/readChapter'
import { ChapterArticle } from './ChapterArticle'
import { ChapterComments } from './ChapterComments'
import { ChapterEnd } from './ChapterEnd'
import { ChapterNav } from './ChapterNav'

/** Báo số đo của chương lên trang đọc (vị trí tính từ đầu nội dung cuộn hoặc trong khối chương) */
export type ChapterLayoutEvents = {
  /** Đầu khối chương */
  onTop: (chapter: number, y: number) => void
  /** Chiều cao khối chương (đầu chương + nội dung) */
  onArticle: (chapter: number, height: number) => void
  /** Vị trí, chiều cao phần nội dung trong khối chương */
  onBody: (chapter: number, y: number, height: number) => void
  /** Vị trí (tính từ đầu phần nội dung), chiều cao của từng đơn vị đọc */
  onUnit: (chapter: number, index: number, y: number, height: number) => void
}

type Props = {
  slug: string
  number: number
  /** Chương đầu của chuỗi: có thanh chuyển chương ở đầu */
  first: boolean
  /** Cuộn liên tục: chương còn chương sau thì cuối chương chỉ có dải "Hết chương" */
  continuous: boolean
  activeParagraph: number | undefined
  onTap: () => void
  onOpenIndex: () => void
  layout: ChapterLayoutEvents
}

/**
 * Một chương của trang đọc, như StreamChapter của web; chế độ từng chương chỉ có một chương này.
 * Chương đầu đã được trang đọc tải trước; chương nối thêm (cuộn liên tục) tự tải ở đây.
 */
export function StreamChapter({
  slug,
  number,
  first,
  continuous,
  activeParagraph,
  onTap,
  onOpenIndex,
  layout,
}: Props) {
  const { data: chapter, isPending, isError, error, refetch } = useChapter(slug, number)

  if (isPending) {
    return (
      <View aria-busy aria-label={`Đang tải chương ${number}`} className="mt-24 gap-3">
        <Skeleton className="h-10 w-2/3 self-center" />
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-4" />
        ))}
      </View>
    )
  }
  if (isError && error instanceof ChapterNotSavedError) {
    return (
      <View className="mt-24 h-80">
        <NotSavedNotice number={number} onRetry={() => void refetch()} />
      </View>
    )
  }
  if (isError || !chapter) {
    return (
      <View className="mt-24 items-center gap-3">
        <Text>{`Không tải được chương ${number}.`}</Text>
        <Button variant="outline" onPress={() => refetch()} className="h-10 rounded-full px-5">
          Thử lại
        </Button>
      </View>
    )
  }

  return (
    <View
      className={first ? undefined : 'mt-24'}
      onLayout={(e) => layout.onTop(number, e.nativeEvent.layout.y)}
    >
      <ChapterArticle
        chapter={chapter}
        onLayout={(e) => layout.onArticle(number, e.nativeEvent.layout.height)}
        onBodyLayout={(e) =>
          layout.onBody(number, e.nativeEvent.layout.y, e.nativeEvent.layout.height)
        }
        onUnitLayout={(index, y, height) => layout.onUnit(number, index, y, height)}
        activeParagraph={activeParagraph}
        onTap={onTap}
        nav={
          first ? (
            <ChapterNav chapter={chapter} onOpenIndex={onOpenIndex} label="Chuyển chương (đầu)" />
          ) : undefined
        }
      />
      {continuous && chapter.next ? (
        <View className="mt-14 items-center gap-4">
          <View className="flex-row items-center gap-3">
            <View aria-hidden className="h-px w-10 bg-border" />
            <Text className="text-sm text-muted-foreground">{`Hết chương ${chapter.number}`}</Text>
            <View aria-hidden className="h-px w-10 bg-border" />
          </View>
          <ChapterComments slug={slug} chapter={chapter.number} collapsible />
          <ReportChapterButton slug={slug} chapter={chapter.number} />
        </View>
      ) : (
        <>
          <View className="mt-16 gap-10">
            <ChapterEnd chapter={chapter} />
            <ChapterNav
              chapter={chapter}
              onOpenIndex={onOpenIndex}
              label="Chuyển chương (cuối)"
              emphasizeNext={!chapter.next}
            />
            <ReportChapterButton slug={slug} chapter={chapter.number} />
          </View>
          <View className="mt-16 border-t border-border pt-12">
            <ChapterComments slug={slug} chapter={chapter.number} />
          </View>
        </>
      )}
    </View>
  )
}
