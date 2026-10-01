import { router } from 'expo-router'
import { ALargeSmall, ArrowLeft, ListOrdered } from 'lucide-react-native'
import { type ReactNode, useEffect, useState } from 'react'
import { Animated, Pressable, View } from 'react-native'
import { useReducedMotion } from 'react-native-reanimated'
import { Text } from '@/components/ui/text'
import { useThemeColors } from '@/hooks/useThemeColors'
import { links } from '@/lib/links'
import type { ChapterContent } from '@/types/chapter'

export const TOOLBAR_HEIGHT = 56

type Props = {
  chapter: ChapterContent
  visible: boolean
  /** Thanh nằm ngay dưới thanh trạng thái (tai thỏ) */
  top: number
  onOpenIndex: () => void
  onOpenSettings: () => void
}

/**
 * Như ReaderToolbar của web: quay lại, tên truyện + chương, mục lục, cài đặt đọc. Trượt lên ẩn sau dải
 * nền của thanh trạng thái khi đọc. Nút tự cuộn và nghe truyện thêm ở bước 5.
 */
export function ReaderToolbar({ chapter, visible, top, onOpenIndex, onOpenSettings }: Props) {
  const { story } = chapter
  const colors = useThemeColors()
  const reducedMotion = useReducedMotion()
  const [offset] = useState(() => new Animated.Value(0))

  useEffect(() => {
    Animated.timing(offset, {
      toValue: visible ? 0 : -(TOOLBAR_HEIGHT + 1),
      duration: reducedMotion ? 0 : 250,
      useNativeDriver: true,
    }).start()
  }, [offset, visible, reducedMotion])

  const back = () => {
    if (router.canGoBack()) router.back()
    else router.replace(links.story(story.slug))
  }

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={{
        position: 'absolute',
        top,
        left: 0,
        right: 0,
        zIndex: 10,
        transform: [{ translateY: offset }],
      }}
    >
      <View
        role="toolbar"
        style={{ height: TOOLBAR_HEIGHT }}
        className="flex-row items-center gap-1 border-b border-border bg-background px-2"
      >
        <IconButton label="Về trang trước" onPress={back}>
          <ArrowLeft size={22} color={colors.foreground} />
        </IconButton>
        <View className="flex-1 px-1">
          <Text numberOfLines={1} className="font-sans-medium text-sm">
            {story.title}
          </Text>
          <Text numberOfLines={1} className="text-xs text-muted-foreground">
            {chapter.title
              ? `Chương ${chapter.number}: ${chapter.title}`
              : `Chương ${chapter.number}`}
          </Text>
        </View>
        <IconButton label="Mục lục" onPress={onOpenIndex}>
          <ListOrdered size={22} color={colors.foreground} />
        </IconButton>
        <IconButton label="Cài đặt đọc" onPress={onOpenSettings}>
          <ALargeSmall size={24} color={colors.foreground} />
        </IconButton>
      </View>
    </Animated.View>
  )
}

function IconButton({
  label,
  onPress,
  children,
}: {
  label: string
  onPress: () => void
  children: ReactNode
}) {
  return (
    <Pressable
      role="button"
      aria-label={label}
      onPress={onPress}
      className="size-11 items-center justify-center rounded-full active:bg-muted"
    >
      {children}
    </Pressable>
  )
}
