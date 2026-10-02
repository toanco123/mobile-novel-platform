import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useKeepAwake } from 'expo-keep-awake'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  View,
} from 'react-native'
import { useReducedMotion } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ScopedTheme } from 'uniwind'
import { BottomPanel } from '@/components/common/BottomPanel'
import { PlaceholderScreen } from '@/components/common/PlaceholderScreen'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useChapter, useRecordChapterView } from '@/features/chapters/hooks'
import { NotSavedNotice } from '@/features/offline/components/NotSavedNotice'
import { usePrefetchChapters } from '@/features/offline/prefetch'
import { ReportChapterButton } from '@/features/feedback/components/ReportChapterButton'
import { ChapterNotSavedError } from '@/features/offline/readChapter'
import { blockTexts, parseContent } from '@/features/chapters/richText'
import {
  type AutoScrollFrame,
  continueAutoScrollAt,
  useAutoScroll,
} from '@/features/reader/autoscroll/useAutoScroll'
import { AutoScrollBar } from '@/features/reader/components/AutoScrollBar'
import { ChapterArticle } from '@/features/reader/components/ChapterArticle'
import { ChapterComments } from '@/features/reader/components/ChapterComments'
import { ChapterEnd } from '@/features/reader/components/ChapterEnd'
import { ChapterNav } from '@/features/reader/components/ChapterNav'
import { ReaderChapterIndex } from '@/features/reader/components/ReaderChapterIndex'
import { ReaderSettingsPanel } from '@/features/reader/components/ReaderSettingsPanel'
import { ReaderToolbar, TOOLBAR_HEIGHT } from '@/features/reader/components/ReaderToolbar'
import { ResumeNotice } from '@/features/reader/components/ResumeNotice'
import { SpeechBar } from '@/features/reader/components/SpeechBar'
import { goToChapter } from '@/features/reader/navigation'
import { type ArticleMetrics, offsetForProgress, progressOf } from '@/features/reader/progress'
import { darkTones, toneTheme } from '@/features/reader/readerOptions'
import { useAutoHideToolbar } from '@/features/reader/useAutoHideToolbar'
import { useReaderSettings } from '@/features/reader/useReaderSettings'
import {
  claimSpeech,
  releaseSpeech,
  setSpeechAdvance,
  speech,
  useSpeechPlayer,
} from '@/features/reader/speech/speechPlayer'
import { countWords } from '@/features/reader/text'
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
 * Trang đọc từng chương (ChapterReaderPage của web): nội dung, chuyển chương, báo lỗi chương, bình
 * luận chương, tự cuộn, nghe truyện. Cuộn liên tục: bước 5b. Chương đọc qua kho trên máy
 * (features/offline): mất mạng vẫn đọc được chương đã mở hoặc đã tải trước.
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
  // Mỗi chương là một Reader riêng (key), nên chuyển chương là bảng đang mở tự đóng
  const [panel, setPanel] = useState<ReaderPanel | null>(null)
  const scroll = useRef<ScrollView>(null)
  const slug = chapter.story.slug
  const number = chapter.number
  // Phần nội dung trong khối chương và vị trí từng đơn vị đọc (tự cuộn, nghe truyện)
  const body = useRef({ y: 0, height: 0 })
  const units = useRef(new Map<number, { y: number; height: number }>())
  // Số đo cho tự cuộn, cập nhật cùng lúc với metrics (onLayout, onScroll, kéo / thả, mở bảng)
  const frame = useRef<AutoScrollFrame>({
    scrollY: 0,
    viewport: 0,
    articleBottom: 0,
    bodyHeight: 0,
    touching: false,
    blocked: false,
  })
  useEffect(() => {
    frame.current.blocked = panel !== null
  }, [panel])
  const words = useMemo(
    () => countWords(blockTexts(parseContent(chapter.content)).join(' ')),
    [chapter.content],
  )
  const reducedMotion = useReducedMotion()

  const autoScroll = useAutoScroll({
    slug,
    chapter: number,
    words,
    frameRef: frame,
    scrollTo: (y) => scroll.current?.scrollTo({ y, animated: false }),
  })
  const [toolbarVisible, setToolbarVisible, autoHide] = useAutoHideToolbar(
    autoScroll.status === 'running',
  )

  // Nghe truyện: bộ phát dùng chung cả app (speechPlayer.ts)
  const player = useSpeechPlayer()
  const mine = player.slug === slug && player.chapter === number
  const listening = player.status !== 'idle'
  const activeParagraph = mine && listening ? player.paragraph : undefined
  useEffect(() => {
    claimSpeech()
    setSpeechAdvance((s, next) => goToChapter(s, next))
    // Người đọc tự chuyển sang chương khác (mục lục, nút chương) khi đang nghe thì dừng, như web;
    // giọng đọc tự chuyển chương thì bộ phát đã ở chương này
    const s = useSpeechPlayer.getState()
    if (s.status !== 'idle' && (s.slug !== slug || s.chapter !== number)) speech.stop()
    return releaseSpeech
  }, [slug, number])

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
    frame.current.articleBottom = e.nativeEvent.layout.y + e.nativeEvent.layout.height
    tryResume()
  }

  function onViewportLayout(e: LayoutChangeEvent) {
    metrics.current.viewport = e.nativeEvent.layout.height
    frame.current.viewport = e.nativeEvent.layout.height
    tryResume()
  }

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent
    const m = metrics.current
    m.scrollY = contentOffset.y
    frame.current.scrollY = contentOffset.y
    if (m.height > 0 && m.viewport > 0) progress.setValue(progressOf(m, m.scrollY))
    touch()
    autoHide(contentOffset.y, contentOffset.y + layoutMeasurement.height >= contentSize.height - 64)
    autoScroll.check()
  }

  const setTouching = (value: boolean) => () => {
    frame.current.touching = value
  }

  /** Vị trí của một đơn vị đọc tính từ đầu nội dung cuộn */
  const unitTop = (index: number) => {
    const unit = units.current.get(index)
    return unit ? metrics.current.top + body.current.y + unit.y : null
  }

  // Đoạn đang đọc luôn ở giữa màn hình (như web)
  useEffect(() => {
    if (!mine || player.status !== 'playing') return
    const top = unitTop(player.paragraph)
    const unit = units.current.get(player.paragraph)
    if (top === null || !unit) return
    const y = top + unit.height / 2 - metrics.current.viewport / 2
    scroll.current?.scrollTo({ y: Math.max(0, y), animated: !reducedMotion })
  }, [mine, player.status, player.paragraph, reducedMotion])

  /** Đoạn đầu tiên còn thấy được dưới thanh công cụ (bắt đầu nghe từ đó), như web */
  function firstVisibleParagraph() {
    const edge = metrics.current.scrollY + insets.top + TOOLBAR_HEIGHT
    const indexes = [...units.current.keys()].sort((a, b) => a - b)
    for (const i of indexes) {
      const top = unitTop(i)
      if (top !== null && top + units.current.get(i)!.height > edge) return i
    }
    return 0
  }

  // Nghe truyện và tự động cuộn không chạy cùng lúc: bật cái này thì tắt cái kia (như web)
  const listen = {
    active: mine && listening,
    onPress: () => {
      if (mine && player.status === 'playing') speech.pause()
      else if (mine && player.status === 'paused') speech.resume()
      else {
        autoScroll.stop()
        speech.start(slug, number, firstVisibleParagraph())
      }
    },
  }
  const autoScrollButton = {
    active: autoScroll.status !== 'off',
    onPress: () => {
      if (autoScroll.status === 'running') autoScroll.pause()
      else if (autoScroll.status === 'paused') autoScroll.resume()
      else {
        // Bắt đầu tự cuộn thì ẩn thanh công cụ để đọc; chạm vào chữ để hiện lại
        speech.stop()
        autoScroll.start()
        setToolbarVisible(false)
      }
    },
  }
  const barShown = autoScroll.status !== 'off' || listening

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
        onScrollBeginDrag={setTouching(true)}
        onScrollEndDrag={setTouching(false)}
        onMomentumScrollBegin={setTouching(true)}
        onMomentumScrollEnd={setTouching(false)}
        keyboardShouldPersistTaps="handled"
        // Bàn phím không che ô viết bình luận chương
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{
          paddingTop: toolbarTop + TOOLBAR_HEIGHT + 32,
          // Chừa chỗ cho thanh nổi (tự cuộn, nghe truyện) để cuối trang không bị che
          paddingBottom: insets.bottom + 64 + (barShown ? 80 : 0),
        }}
        contentContainerClassName="px-5"
      >
        <ChapterArticle
          chapter={chapter}
          onLayout={onArticleLayout}
          onBodyLayout={(e) => {
            body.current = { y: e.nativeEvent.layout.y, height: e.nativeEvent.layout.height }
            frame.current.bodyHeight = e.nativeEvent.layout.height
          }}
          onUnitLayout={(index, y, height) => units.current.set(index, { y, height })}
          activeParagraph={activeParagraph}
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
          <ReportChapterButton slug={chapter.story.slug} chapter={chapter.number} />
        </View>
        <View className="mt-16 border-t border-border pt-12">
          <ChapterComments
            key={chapter.number}
            slug={chapter.story.slug}
            chapter={chapter.number}
          />
        </View>
      </ScrollView>

      <ReaderToolbar
        chapter={chapter}
        visible={toolbarVisible}
        top={toolbarTop}
        onOpenIndex={openIndex}
        onOpenSettings={() => setPanel('settings')}
        autoScroll={autoScrollButton}
        listen={listen}
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
      {listening && <SpeechBar />}
      {autoScroll.status !== 'off' && (
        <AutoScrollBar
          autoScroll={autoScroll}
          chapter={number}
          next={chapter.next?.number ?? null}
          onNext={() => {
            if (!chapter.next) return
            continueAutoScrollAt(slug, chapter.next.number)
            goToChapter(slug, chapter.next.number)
          }}
        />
      )}
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
          title={chapter.story.title}
          downloadable={chapter.story.visibility === 'published'}
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
