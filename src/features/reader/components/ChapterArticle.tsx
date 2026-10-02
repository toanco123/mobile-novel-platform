import { router } from 'expo-router'
import { CalendarDays, Clock, Type } from 'lucide-react-native'
import { type ReactNode, useMemo, useRef } from 'react'
import { type LayoutChangeEvent, Pressable, Text as RNText, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { Text } from '@/components/ui/text'
import { blockTexts, type Block, type Inline, parseContent } from '@/features/chapters/richText'
import { useThemeColors } from '@/hooks/useThemeColors'
import { formatDate, formatDecimal } from '@/lib/format'
import { links } from '@/lib/links'
import { cn } from '@/lib/utils'
import type { ChapterContent } from '@/types/chapter'
import { listMarker } from '../listMarker'
import { faceOf, fontFaces } from '../readerOptions'
import { countWords, WORDS_PER_MINUTE } from '../text'
import { useReaderSettings } from '../useReaderSettings'

type Props = {
  chapter: ChapterContent
  /** Thanh chuyển chương đặt giữa phần đầu chương và nội dung */
  nav?: ReactNode
  /** Chạm vào vùng chữ để ẩn/hiện thanh công cụ */
  onTap?: () => void
  /** Vị trí, chiều cao của cả khối chương (tính tỉ lệ đã đọc) */
  onLayout?: (e: LayoutChangeEvent) => void
  /** Vị trí, chiều cao phần nội dung trong khối chương (tốc độ tự cuộn, vị trí các đoạn) */
  onBodyLayout?: (e: LayoutChangeEvent) => void
  /** Vị trí (tính từ đầu phần nội dung), chiều cao của từng đơn vị đọc (nghe truyện) */
  onUnitLayout?: (index: number, y: number, height: number) => void
  /** Đoạn đang được đọc to (tô nền) */
  activeParagraph?: number
}

type UnitProps = {
  /** Số thứ tự đơn vị đọc đầu tiên của khối */
  start: number
  activeParagraph?: number
  onUnitLayout?: Props['onUnitLayout']
}

/** Nền của đoạn đang được đọc to, như shadow-primary/10 của web */
const activeClass = 'rounded-sm bg-primary/10'

type Faces = ReturnType<typeof fontFaces>

/** Tiêu đề trong chương dùng phông tiêu đề như web (đậm sẵn, nghiêng thì dùng bản nghiêng) */
const headingFaces: Faces = {
  regular: 'font-heading-bold',
  italic: 'font-heading-italic',
  bold: 'font-heading-bold',
  boldItalic: 'font-heading-italic',
}

/**
 * Như ChapterArticle của web: đầu chương (tên truyện, số chương, tên chương, ngày đăng, số chữ, số
 * phút đọc) và nội dung từ `parseContent`. Nội dung luôn render thành Text, không bao giờ là HTML.
 * Không có chữ hoa đầu chương (React Native không có float).
 */
export function ChapterArticle({
  chapter,
  nav,
  onTap,
  onLayout,
  onBodyLayout,
  onUnitLayout,
  activeParagraph,
}: Props) {
  const font = useReaderSettings((s) => s.font)
  const fontSize = useReaderSettings((s) => s.fontSize)
  const lineHeight = useReaderSettings((s) => s.lineHeight)
  const colors = useThemeColors()
  const blocks = useMemo(() => parseContent(chapter.content), [chapter.content])
  const words = countWords(blockTexts(blocks).join(' '))
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE))
  const faces = fontFaces(font)
  // Mỗi đoạn, tiêu đề, mục danh sách là một đơn vị đọc, đánh số liên tục như data-paragraph của web
  // (cùng thứ tự với blockTexts mà giọng đọc dùng)
  const starts: number[] = []
  let unit = 0
  for (const b of blocks) {
    starts.push(unit)
    unit += unitCount(b)
  }

  return (
    <View onLayout={onLayout}>
      <View className="items-center">
        <Pressable
          role="link"
          hitSlop={8}
          onPress={() => router.push(links.story(chapter.story.slug))}
        >
          <Text className="text-center text-sm text-rose-gold">{chapter.story.title}</Text>
        </Pressable>
        <Text className="mt-6 text-sm text-muted-foreground">Chương {chapter.number}</Text>
        {/* Chương không có tên: bỏ hẳn dòng tiêu đề (thẻ rỗng của web không chiếm chỗ) */}
        {chapter.title ? (
          <Text
            role="heading"
            className="mt-1 text-center font-heading-bold text-[36px] leading-[40px]"
            // Cormorant mặc định dùng số kiểu cổ (1 giống chữ ı): ép số thẳng như lining-nums của web
            style={{ fontVariant: ['lining-nums'] }}
          >
            {chapter.title}
          </Text>
        ) : null}
        <View className="mt-5 flex-row flex-wrap justify-center gap-x-5 gap-y-1">
          <Meta icon={<CalendarDays size={14} color={colors.mutedForeground} />}>
            {formatDate(chapter.publishedAt)}
          </Meta>
          <Meta icon={<Type size={14} color={colors.mutedForeground} />}>
            {`${formatDecimal(words)} chữ`}
          </Meta>
          <Meta icon={<Clock size={14} color={colors.mutedForeground} />}>
            {`khoảng ${minutes} phút đọc`}
          </Meta>
        </View>
        <Svg aria-hidden width={112} height={12} viewBox="0 0 120 12" style={{ marginTop: 32 }}>
          <Path d="M0 6h48M72 6h48" stroke={colors.roseGold} strokeOpacity={0.6} strokeWidth={1} />
          <Path d="M60 1l5 5-5 5-5-5z" fill={colors.roseGold} fillOpacity={0.6} />
        </Svg>
      </View>

      {nav && <View className="mt-8">{nav}</View>}

      {/* accessible={false}: trình đọc màn hình vẫn đọc từng đoạn, không gộp cả chương thành một nút */}
      <Pressable accessible={false} onPress={onTap} onLayout={onBodyLayout} className="mt-8">
        {blocks.map((block, k) => (
          <BlockView
            key={k}
            block={block}
            first={k === 0}
            faces={faces}
            fontSize={fontSize}
            lineHeight={lineHeight}
            start={starts[k]}
            activeParagraph={activeParagraph}
            onUnitLayout={onUnitLayout}
          />
        ))}
      </Pressable>
    </View>
  )
}

function Meta({ icon, children }: { icon: ReactNode; children: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      {icon}
      <Text className="text-xs text-muted-foreground">{children}</Text>
    </View>
  )
}

const unitCount = (block: Block) => (block.type === 'list' ? block.items.length : 1)

/** Một khối nội dung; khoảng cách giữa các khối tính theo cỡ chữ như em của web */
function BlockView({
  block,
  first,
  faces,
  fontSize,
  lineHeight,
  start,
  activeParagraph,
  onUnitLayout,
}: {
  block: Block
  first: boolean
  faces: Faces
  fontSize: number
  lineHeight: number
} & UnitProps) {
  const body = { fontSize, lineHeight: fontSize * lineHeight }
  const unitLayout = (e: LayoutChangeEvent) =>
    onUnitLayout?.(start, e.nativeEvent.layout.y, e.nativeEvent.layout.height)

  if (block.type === 'list') {
    return (
      <ListView
        block={block}
        first={first}
        faces={faces}
        fontSize={fontSize}
        body={body}
        start={start}
        activeParagraph={activeParagraph}
        onUnitLayout={onUnitLayout}
      />
    )
  }

  const align = block.align === 'center' ? ('center' as const) : undefined
  if (block.type === 'heading') {
    const size = fontSize * (block.level === 2 ? 1.4 : 1.2)
    return (
      <RNText
        role="heading"
        onLayout={unitLayout}
        className={cn(
          'font-heading-bold text-foreground',
          activeParagraph === start && activeClass,
        )}
        style={{
          fontSize: size,
          lineHeight: size * 1.3,
          textAlign: align,
          marginTop: first ? 0 : fontSize * 1.6,
        }}
      >
        <Inlines inlines={block.inlines} faces={headingFaces} />
      </RNText>
    )
  }

  return (
    <RNText
      onLayout={unitLayout}
      className={cn(faces.regular, 'text-foreground', activeParagraph === start && activeClass)}
      style={[body, { textAlign: align, marginTop: first ? 0 : fontSize * 0.95 }]}
    >
      <Inlines inlines={block.inlines} faces={faces} />
    </RNText>
  )
}

/**
 * Danh sách: mỗi mục là một đơn vị đọc. Vị trí của mục = vị trí danh sách + vị trí mục trong danh
 * sách; hai sự kiện onLayout tới không theo thứ tự nên báo khi đã có đủ cả hai.
 */
function ListView({
  block,
  first,
  faces,
  fontSize,
  body,
  start,
  activeParagraph,
  onUnitLayout,
}: {
  block: Extract<Block, { type: 'list' }>
  first: boolean
  faces: Faces
  fontSize: number
  body: { fontSize: number; lineHeight: number }
} & UnitProps) {
  const listY = useRef<number | null>(null)
  const items = useRef(new Map<number, { y: number; height: number }>())
  const report = (j: number) => {
    const item = items.current.get(j)
    if (listY.current !== null && item)
      onUnitLayout?.(start + j, listY.current + item.y, item.height)
  }

  return (
    <View
      onLayout={(e) => {
        listY.current = e.nativeEvent.layout.y
        items.current.forEach((_, j) => report(j))
      }}
      style={{ marginTop: first ? 0 : fontSize * 0.95, gap: fontSize * 0.4 }}
    >
      {block.items.map((item, j) => (
        <View
          key={j}
          onLayout={(e) => {
            items.current.set(j, { y: e.nativeEvent.layout.y, height: e.nativeEvent.layout.height })
            report(j)
          }}
          className={cn('flex-row', activeParagraph === start + j && activeClass)}
        >
          <RNText
            aria-hidden
            className={cn(faces.regular, 'text-right text-foreground')}
            style={[body, { width: fontSize * 1.4, marginRight: fontSize * 0.4 }]}
          >
            {listMarker(block.style, block.ordered, j)}
          </RNText>
          <RNText className={cn(faces.regular, 'flex-1 text-foreground')} style={body}>
            <Inlines inlines={item} faces={faces} />
          </RNText>
        </View>
      ))}
    </View>
  )
}

/** Chữ có định dạng: đoạn đậm/nghiêng đổi họ chữ, gạch chân/gạch ngang bằng textDecorationLine */
function Inlines({ inlines, faces }: { inlines: Inline[]; faces: Faces }) {
  return inlines.map((inline, i) => {
    const decoration =
      inline.underline && inline.strike
        ? ('underline line-through' as const)
        : inline.underline
          ? ('underline' as const)
          : inline.strike
            ? ('line-through' as const)
            : undefined
    if (!inline.bold && !inline.italic && !decoration) return inline.text
    return (
      <RNText
        key={i}
        className={faceOf(faces, inline)}
        style={decoration && { textDecorationLine: decoration }}
      >
        {inline.text}
      </RNText>
    )
  })
}
