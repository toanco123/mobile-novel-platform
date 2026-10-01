import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useKeepAwake } from 'expo-keep-awake'
import { StatusBar } from 'expo-status-bar'
import { useRef, useState } from 'react'
import {
  Animated,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ScopedTheme } from 'uniwind'
import { BottomPanel } from '@/components/common/BottomPanel'
import { PlaceholderScreen } from '@/components/common/PlaceholderScreen'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useChapter, useRecordChapterView } from '@/features/chapters/hooks'
import { NotSavedNotice } from '@/features/offline/components/NotSavedNotice'
import { usePrefetchChapters } from '@/features/offline/prefetch'
import { ChapterNotSavedError } from '@/features/offline/readChapter'
import { ChapterArticle } from '@/features/reader/components/ChapterArticle'
import { ChapterEnd } from '@/features/reader/components/ChapterEnd'
import { ChapterNav } from '@/features/reader/components/ChapterNav'
import { ReaderChapterIndex } from '@/features/reader/components/ReaderChapterIndex'
import { ReaderSettingsPanel } from '@/features/reader/components/ReaderSettingsPanel'
import { ReaderToolbar, TOOLBAR_HEIGHT } from '@/features/reader/components/ReaderToolbar'
import { ResumeNotice } from '@/features/reader/components/ResumeNotice'
import { type ArticleMetrics, offsetForProgress, progressOf } from '@/features/reader/progress'
import { darkTones, toneTheme } from '@/features/reader/readerOptions'
import { useAutoHideToolbar } from '@/features/reader/useAutoHideToolbar'
import { useReaderSettings } from '@/features/reader/useReaderSettings'
import { MIN_RESUME, useReadingTracker } from '@/features/reader/useReadingTracker'
import { useTheme } from '@/hooks/useTheme'
import { useThemeColors } from '@/hooks/useThemeColors'
import { links } from '@/lib/links'
import type { ChapterContent } from '@/types/chapter'

// Như web: đoạn URL là "chapter-N"
const parseChapterSegment = (segment: string | undefined) => {
  const match = /^chapter-(\d{1,6})$/.exec(segment ?? '')
  return match ? Number(match[1]) : null
}

type ReaderPanel = 'index' | 'settings'

/**
 * Trang đọc từng chương (ChapterReaderPage của web). Cuộn liên tục, tự cuộn, nghe truyện: bước 5;
 * bình luận, báo lỗi chương: bước 4. Chương đọc qua kho trên máy (features/offline): mất mạng vẫn đọc
 * được chương đã mở hoặc đã tải trước.
 */
export default function ChapterScreen() {
  const { slug, chapter, resume } = useLocalSearchParams<{
    slug: string
    chapter: string
    resume?: string
  }>()
  const number = parseChapterSegment(chapter)
  const tone = useReaderSettings((s) => s.tone)
  const appTheme = useTheme((s) => s.theme)

  if (number === null) {
    return (
      <PlaceholderScreen
        title="Không tìm thấy chương"
        description="Đường dẫn chương không hợp lệ."
      />
    )
  }
  const reader = (
    <Reader key={`${slug}#${number}`} slug={slug} number={number} resume={Number(resume)} />
  )
  // Màu nền đọc: theme phụ chỉ trong vùng đọc, mọi class token bên trong tự đổi màu. Luôn bọc (kể cả
  // "Theo app") để đổi màu nền không đổi cấu trúc cây, nếu không trang đọc dựng lại từ đầu
  return <ScopedTheme theme={toneTheme[tone] ?? appTheme}>{reader}</ScopedTheme>
}

function Reader({ slug, number, resume }: { slug: string; number: number; resume: number }) {
  const {
    data: chapter,
    isPending,
    isError,
    error,
    refetch,
    isRefetching,
  } = useChapter(slug, number)
  useRecordChapterView(slug, chapter ? number : undefined)
  // Mở chương xong thì tải trước vài chương sau vào kho trên máy (đọc tiếp được khi mất mạng)
  usePrefetchChapters(chapter)
  useKeepAwake()

  if (isPending) return <ReaderSkeleton />
  if (isError && error instanceof ChapterNotSavedError) {
    return (
      <>
        <PlainHeader />
        <NotSavedNotice number={number} onRetry={() => void refetch()} />
      </>
    )
  }
  if (isError) {
    return (
      <>
        <PlainHeader />
        <PlaceholderScreen
          title="Không tải được chương này"
          description="Kiểm tra kết nối mạng rồi thử lại."
        >
          <Button pending={isRefetching} onPress={() => refetch()} className="mt-2 px-6">
            Thử lại
          </Button>
        </PlaceholderScreen>
      </>
    )
  }
  if (!chapter) {
    return (
      <>
        <PlainHeader />
        <PlaceholderScreen
          title="Không tìm thấy chương"
          description={`Không tìm thấy chương ${number}. Có thể chương đã bị ẩn hoặc chưa được đăng.`}
        >
          <Button
            variant="outline"
            onPress={() => router.replace(links.story(slug))}
            className="mt-2 px-6"
          >
            Về trang truyện
          </Button>
        </PlaceholderScreen>
      </>
    )
  }
  return <ReaderView chapter={chapter} resume={resume} />
}

function ReaderView({ chapter, resume }: { chapter: ChapterContent; resume: number }) {
  const insets = useSafeAreaInsets()
  const tone = useReaderSettings((s) => s.tone)
  const appTheme = useTheme((s) => s.theme)
  const darkBackground = toneTheme[tone] ? darkTones.has(tone) : appTheme === 'dark'
  const [toolbarVisible, setToolbarVisible, autoHide] = useAutoHideToolbar()
  // Mỗi chương là một Reader riêng (key), nên chuyển chương là bảng đang mở tự đóng
  const [panel, setPanel] = useState<ReaderPanel | null>(null)
  const scroll = useRef<ScrollView>(null)
  // Số đo để tính tỉ lệ đã đọc; cập nhật khi cuộn/dàn trang, không cần render lại
  const metrics = useRef<ArticleMetrics & { scrollY: number }>({
    top: 0,
    height: 0,
    viewport: 0,
    scrollY: 0,
  })
  const [progress] = useState(() => new Animated.Value(0))
  const resuming = Number.isFinite(resume) && resume >= MIN_RESUME
  const resumeDone = useRef(false)

  const touch = useReadingTracker(chapter, () => {
    const m = metrics.current
    return m.height > 0 && m.viewport > 0 ? progressOf(m, m.scrollY) : null
  })

  // Tới từ "Đọc tiếp": cuộn tới chỗ đã lưu một lần, khi đã biết cả khung nhìn và chiều cao chương
  function tryResume() {
    const m = metrics.current
    if (!resuming || resumeDone.current || m.height === 0 || m.viewport === 0) return
    resumeDone.current = true
    requestAnimationFrame(() =>
      scroll.current?.scrollTo({ y: offsetForProgress(m, resume), animated: false }),
    )
  }

  function onArticleLayout(e: LayoutChangeEvent) {
    metrics.current.top = e.nativeEvent.layout.y
    metrics.current.height = e.nativeEvent.layout.height
    tryResume()
  }

  function onViewportLayout(e: LayoutChangeEvent) {
    metrics.current.viewport = e.nativeEvent.layout.height
    tryResume()
  }

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent
    const m = metrics.current
    m.scrollY = contentOffset.y
    if (m.height > 0 && m.viewport > 0) progress.setValue(progressOf(m, m.scrollY))
    touch()
    autoHide(contentOffset.y, contentOffset.y + layoutMeasurement.height >= contentSize.height - 64)
  }

  const openIndex = () => setPanel('index')
  const toolbarTop = insets.top

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style={darkBackground ? 'light' : 'dark'} />

      <ScrollView
        ref={scroll}
        onLayout={onViewportLayout}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: toolbarTop + TOOLBAR_HEIGHT + 32,
          paddingBottom: insets.bottom + 64,
        }}
        contentContainerClassName="px-5"
      >
        <ChapterArticle
          chapter={chapter}
          onLayout={onArticleLayout}
          onTap={() => setToolbarVisible((v) => !v)}
          nav={<ChapterNav chapter={chapter} onOpenIndex={openIndex} label="Chuyển chương (đầu)" />}
        />
        <View className="mt-16 gap-10">
          <ChapterEnd chapter={chapter} />
          <ChapterNav
            chapter={chapter}
            onOpenIndex={openIndex}
            label="Chuyển chương (cuối)"
            emphasizeNext={!chapter.next}
          />
        </View>
      </ScrollView>

      <ReaderToolbar
        chapter={chapter}
        visible={toolbarVisible}
        top={toolbarTop}
        onOpenIndex={openIndex}
        onOpenSettings={() => setPanel('settings')}
      />
      {/* Dải nền dưới thanh trạng thái: thanh công cụ trượt ẩn sau nó, chữ không chạy dưới tai thỏ */}
      <View
        aria-hidden
        style={{ height: toolbarTop }}
        className="absolute inset-x-0 top-0 z-20 bg-background"
      />
      {/* Thanh tiến độ đọc trong chương, cập nhật thẳng giá trị Animated khi cuộn (không render lại) */}
      <View
        aria-hidden
        pointerEvents="none"
        style={{ top: toolbarTop }}
        className="absolute inset-x-0 z-30 h-0.5"
      >
        <Animated.View
          style={{ height: '100%', transformOrigin: 'left', transform: [{ scaleX: progress }] }}
        >
          <View className="h-full bg-primary" />
        </Animated.View>
      </View>
      {resuming && (
        <ResumeNotice
          top={toolbarTop + TOOLBAR_HEIGHT + 8}
          onBackToTop={() => scroll.current?.scrollTo({ y: 0, animated: true })}
        />
      )}

      <BottomPanel
        open={panel === 'index'}
        onClose={() => setPanel(null)}
        title="Mục lục"
        description={chapter.story.title}
        size="tall"
      >
        <ReaderChapterIndex
          slug={chapter.story.slug}
          current={chapter.number}
          max={chapter.story.chapterCount}
          onNavigate={() => setPanel(null)}
        />
      </BottomPanel>
      <BottomPanel
        open={panel === 'settings'}
        onClose={() => setPanel(null)}
        title="Cài đặt đọc"
        description="Áp dụng ngay và được nhớ cho lần đọc sau."
        clearBackdrop
      >
        <ReaderSettingsPanel />
      </BottomPanel>
    </View>
  )
}

function ReaderSkeleton() {
  return (
    <View aria-busy aria-label="Đang tải chương" className="flex-1 bg-background px-5 pt-8">
      <PlainHeader />
      <Skeleton className="h-4 w-40 self-center" />
      <Skeleton className="mt-6 h-10 w-3/4 self-center" />
      <View className="mt-14 gap-3">
        {Array.from({ length: 14 }, (_, i) => (
          <Skeleton key={i} className="h-4" style={{ width: i % 5 === 4 ? '60%' : '100%' }} />
        ))}
      </View>
    </View>
  )
}

/** Header điều hướng (nút quay lại) cho lúc chờ / lỗi, cùng màu nền đọc với thân màn */
function PlainHeader() {
  const colors = useThemeColors()
  return (
    <Stack.Screen
      options={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
      }}
    />
  )
}
