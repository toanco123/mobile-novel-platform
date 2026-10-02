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
import { ChapterNotSavedError } from '@/features/offline/readChapter'
import { blockTexts, parseContent } from '@/features/chapters/richText'
import {
  type AutoScrollFrame,
  continueAutoScrollAt,
  useAutoScroll,
} from '@/features/reader/autoscroll/useAutoScroll'
import { AutoScrollBar } from '@/features/reader/components/AutoScrollBar'
import { ReaderChapterIndex } from '@/features/reader/components/ReaderChapterIndex'
import { ReaderSettingsPanel } from '@/features/reader/components/ReaderSettingsPanel'
import { ReaderToolbar, TOOLBAR_HEIGHT } from '@/features/reader/components/ReaderToolbar'
import { ResumeNotice } from '@/features/reader/components/ResumeNotice'
import { SpeechBar } from '@/features/reader/components/SpeechBar'
import { type ChapterLayoutEvents, StreamChapter } from '@/features/reader/components/StreamChapter'
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
 * Trang đọc (ChapterReaderPage của web): từng chương hoặc cuộn liên tục, chuyển chương, báo lỗi
 * chương, bình luận chương, tự cuộn, nghe truyện. Chương đọc qua kho trên máy
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

/** Số đo của một chương trong ScrollView (onLayout), vị trí tính từ đầu nội dung cuộn */
type ChapterLayout = {
  top: number
  height: number
  bodyY: number
  bodyHeight: number
  units: Map<number, { y: number; height: number }>
}

const emptyLayout = (): ChapterLayout => ({
  top: 0,
  height: 0,
  bodyY: 0,
  bodyHeight: 0,
  units: new Map(),
})

/** Cuộn liên tục: đỉnh chương vượt qua mốc này (tính từ mép trên màn hình) là đang đọc chương đó */
const CURRENT_LINE = 0.4
/** Cuộn liên tục: còn chừng này màn hình tới cuối thì nối chương sau (như rootMargin 150% của web) */
const APPEND_SCREENS = 1.5

/**
 * Màn đọc: một chuỗi chương (`StreamChapter`). Từng chương thì chuỗi chỉ có chương mở ra; cuộn liên
 * tục thì đọc gần hết là nối chương sau vào bên dưới (ChapterStream của web). Chương đang đọc (chương
 * ở mốc 40% màn hình) giữ trong state thay vì đổi URL như web: đổi route sẽ dựng lại màn. Thanh công
 * cụ, thanh tiến độ, lịch sử đọc, lượt đọc, tải trước, tự cuộn, nghe truyện đều theo chương này.
 */
function ReaderView({ chapter: start, resume }: { chapter: ChapterContent; resume: number }) {
  const insets = useSafeAreaInsets()
  const tone = useReaderSettings((s) => s.tone)
  const continuous = useReaderSettings((s) => s.continuous)
  const appTheme = useTheme((s) => s.theme)
  const darkBackground = toneTheme[tone] ? darkTones.has(tone) : appTheme === 'dark'
  // Mỗi chương mở ra là một Reader riêng (key), nên chuyển chương là bảng đang mở tự đóng
  const [panel, setPanel] = useState<ReaderPanel | null>(null)
  const scroll = useRef<ScrollView>(null)
  const slug = start.story.slug
  const reducedMotion = useReducedMotion()

  // Chuỗi chương đang hiện và chương đang đọc
  const [numbers, setNumbers] = useState([start.number])
  const [current, setCurrent] = useState(start.number)
  const shown = continuous ? numbers : [start.number]
  const { data: currentData } = useChapter(slug, current)
  const chapter = currentData ?? start
  const { data: last } = useChapter(slug, shown[shown.length - 1])
  const append = (n: number) => setNumbers((list) => (list.includes(n) ? list : [...list, n]))

  // Số đo từng chương, khung nhìn, vị trí cuộn; cập nhật khi dàn trang / cuộn, không render lại
  const layouts = useRef(new Map<number, ChapterLayout>())
  const view = useRef({ viewport: 0, scrollY: 0, contentHeight: 0 })
  const layoutOf = (n: number) => {
    let l = layouts.current.get(n)
    if (!l) layouts.current.set(n, (l = emptyLayout()))
    return l
  }
  // Số đo cho tự cuộn (useAutoScroll đọc mỗi khung hình)
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

  const autoScroll = useAutoScroll({
    slug,
    chapter: current,
    words,
    frameRef: frame,
    scrollTo: (y) => scroll.current?.scrollTo({ y, animated: false }),
  })
  const [toolbarVisible, setToolbarVisible, autoHide] = useAutoHideToolbar(
    autoScroll.status === 'running',
  )

  // Lượt đọc, tải trước theo chương đang đọc (cuộn liên tục: mỗi chương được tính khi tới lượt đọc)
  useRecordChapterView(slug, current)
  usePrefetchChapters(chapter)

  // Tắt cuộn liên tục khi đang ở chương nối thêm: mở lại đúng chương đang đọc
  useEffect(() => {
    if (!continuous && current !== start.number) goToChapter(slug, current)
  }, [continuous, current, slug, start.number])

  // Nghe truyện: bộ phát dùng chung cả app (speechPlayer.ts)
  const player = useSpeechPlayer()
  const listening = player.status !== 'idle'
  const mine = player.slug === slug && player.chapter !== null && shown.includes(player.chapter)
  // Giọng đọc đã sang chương sau mà chương đó chưa được nối (như web)
  if (
    continuous &&
    listening &&
    player.slug === slug &&
    player.chapter !== null &&
    last?.next?.number === player.chapter &&
    !numbers.includes(player.chapter)
  ) {
    setNumbers([...numbers, player.chapter])
  }
  useEffect(() => {
    claimSpeech()
    // Người đọc tự mở chương khác (mục lục, nút chương) khi đang nghe thì dừng, như web; giọng đọc
    // tự chuyển chương thì bộ phát đã ở chương này
    const s = useSpeechPlayer.getState()
    if (s.status !== 'idle' && (s.slug !== slug || s.chapter !== start.number)) speech.stop()
    return releaseSpeech
  }, [slug, start.number])
  useEffect(() => {
    // Từng chương: mở trang chương sau; cuộn liên tục: chương sau được nối vào bên dưới
    setSpeechAdvance(continuous ? () => {} : (s, next) => goToChapter(s, next))
  }, [continuous])

  // Số đo để tính tỉ lệ đã đọc của chương đang đọc
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

  /** Cập nhật chương đang đọc và số đo của nó (gọi khi cuộn và khi dàn trang) */
  function sync() {
    const { scrollY, viewport } = view.current
    let now = current
    if (continuous) {
      const line = scrollY + viewport * CURRENT_LINE
      for (const n of shown) {
        const l = layouts.current.get(n)
        if (l && l.height > 0 && l.top <= line) now = n
      }
    }
    const l = layoutOf(now)
    Object.assign(metrics.current, { top: l.top, height: l.height, viewport, scrollY })
    const lastLayout = layouts.current.get(shown[shown.length - 1])
    Object.assign(frame.current, {
      scrollY,
      viewport,
      bodyHeight: l.bodyHeight,
      // Cuộn liên tục còn chương sau: chưa phải cuối, tự cuộn chờ chương sau nối vào
      articleBottom:
        continuous && last?.next
          ? 0
          : continuous
            ? (lastLayout?.top ?? 0) + (lastLayout?.height ?? 0)
            : l.top + l.height,
    })
    if (l.height > 0 && viewport > 0) progress.setValue(progressOf(metrics.current, scrollY))
    if (now !== current) setCurrent(now)
  }

  // Tới từ "Đọc tiếp": cuộn tới chỗ đã lưu một lần, khi đã biết cả khung nhìn và chiều cao chương
  function tryResume() {
    const l = layouts.current.get(start.number)
    const viewport = view.current.viewport
    if (!resuming || resumeDone.current || !l || l.height === 0 || viewport === 0) return
    resumeDone.current = true
    const target = offsetForProgress({ top: l.top, height: l.height, viewport }, resume)
    requestAnimationFrame(() => scroll.current?.scrollTo({ y: target, animated: false }))
  }

  const layoutEvents: ChapterLayoutEvents = {
    onTop: (n, y) => {
      layoutOf(n).top = y
      sync()
      tryResume()
    },
    onArticle: (n, height) => {
      layoutOf(n).height = height
      sync()
      tryResume()
    },
    onBody: (n, y, height) => {
      Object.assign(layoutOf(n), { bodyY: y, bodyHeight: height })
      sync()
    },
    onUnit: (n, index, y, height) => {
      layoutOf(n).units.set(index, { y, height })
    },
  }

  function onViewportLayout(e: LayoutChangeEvent) {
    view.current.viewport = e.nativeEvent.layout.height
    sync()
    tryResume()
  }

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent
    view.current.scrollY = contentOffset.y
    view.current.contentHeight = contentSize.height
    sync()
    touch()
    autoHide(contentOffset.y, contentOffset.y + layoutMeasurement.height >= contentSize.height - 64)
    autoScroll.check()
    // Cuộn liên tục: gần tới cuối thì nối chương sau
    const remaining = contentSize.height - (contentOffset.y + layoutMeasurement.height)
    if (continuous && last?.next && remaining < layoutMeasurement.height * APPEND_SCREENS) {
      append(last.next.number)
    }
  }

  const setTouching = (value: boolean) => () => {
    frame.current.touching = value
  }

  /** Vị trí của một đơn vị đọc tính từ đầu nội dung cuộn */
  const unitTop = (n: number, index: number) => {
    const l = layouts.current.get(n)
    const unit = l?.units.get(index)
    return l && unit ? l.top + l.bodyY + unit.y : null
  }

  // Đoạn đang đọc luôn ở giữa màn hình (như web)
  useEffect(() => {
    if (!mine || player.status !== 'playing' || player.chapter === null) return
    const top = unitTop(player.chapter, player.paragraph)
    const unit = layouts.current.get(player.chapter)?.units.get(player.paragraph)
    if (top === null || !unit) return
    const y = top + unit.height / 2 - view.current.viewport / 2
    scroll.current?.scrollTo({ y: Math.max(0, y), animated: !reducedMotion })
  }, [mine, player.status, player.chapter, player.paragraph, reducedMotion])

  /** Đoạn đầu tiên của chương đang đọc còn thấy được dưới thanh công cụ (bắt đầu nghe từ đó) */
  function firstVisibleParagraph() {
    const edge = view.current.scrollY + insets.top + TOOLBAR_HEIGHT
    const units = layouts.current.get(current)?.units
    const indexes = [...(units?.keys() ?? [])].sort((a, b) => a - b)
    for (const i of indexes) {
      const top = unitTop(current, i)
      if (top !== null && top + units!.get(i)!.height > edge) return i
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
        speech.start(slug, current, firstVisibleParagraph())
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
        {shown.map((n, i) => (
          <StreamChapter
            key={n}
            slug={slug}
            number={n}
            first={i === 0}
            continuous={continuous}
            activeParagraph={mine && player.chapter === n ? player.paragraph : undefined}
            onTap={() => setToolbarVisible((v) => !v)}
            onOpenIndex={openIndex}
            layout={layoutEvents}
          />
        ))}
        {continuous && last?.next && (
          <Button
            variant="outline"
            onPress={() => last.next && append(last.next.number)}
            className="mt-12 h-10 self-center rounded-full px-5"
            textClassName="text-sm"
          >
            {`Tải chương ${last.next.number}`}
          </Button>
        )}
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
          chapter={current}
          // Cuộn liên tục thì chương sau tự nối vào, không cần nút sang chương (như web)
          next={continuous ? null : (chapter.next?.number ?? null)}
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
          slug={slug}
          title={chapter.story.title}
          downloadable={chapter.story.visibility === 'published'}
          current={current}
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
