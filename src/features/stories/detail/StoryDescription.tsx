import { Link } from 'expo-router'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { Text } from '@/components/ui/text'
import { links } from '@/lib/links'
import { cn } from '@/lib/utils'
import type { Story } from '@/types/story'

const COLLAPSED_LINES = 6
const textClass = 'text-[15px] leading-relaxed'

/** Như StoryDescription của web: gọn 6 dòng, "Xem thêm"; thể loại bên dưới */
export function StoryDescription({ story }: { story: Story }) {
  const [expanded, setExpanded] = useState(false)
  const [lineCount, setLineCount] = useState(0)
  // Chỉ hiện nút "Xem thêm" khi mô tả thật sự dài hơn 6 dòng
  const overflowing = lineCount > COLLAPSED_LINES

  return (
    <View className="px-4">
      {story.description ? (
        <View>
          <Text
            numberOfLines={expanded ? undefined : COLLAPSED_LINES}
            className={cn(textClass, 'text-foreground/90')}
          >
            {story.description}
          </Text>
          {/* Bản ẩn không giới hạn dòng để đếm số dòng thật (bản gọn chỉ báo số dòng đã cắt).
              pointerEvents none: bản ẩn dài hơn, nằm đè lên nút "Xem thêm" và sẽ nhận mất lần bấm */}
          <View aria-hidden pointerEvents="none" className="absolute inset-x-0 top-0 opacity-0">
            <Text
              onTextLayout={(e) => setLineCount(e.nativeEvent.lines.length)}
              className={textClass}
            >
              {story.description}
            </Text>
          </View>
        </View>
      ) : null}
      {(overflowing || expanded) && (
        <Pressable
          role="button"
          aria-expanded={expanded}
          hitSlop={8}
          onPress={() => setExpanded((v) => !v)}
          className="mt-2 self-start"
        >
          <Text className="font-sans-medium text-sm text-rose-gold">
            {expanded ? 'Thu gọn' : 'Xem thêm'}
          </Text>
        </Pressable>
      )}
      {story.genres.length > 0 && (
        <View aria-label="Thể loại" className="mt-5 flex-row flex-wrap gap-2">
          {story.genres.map((g) => (
            <Link key={g.slug} href={links.genre(g.slug)} asChild>
              <Pressable className="rounded-full border border-border px-3.5 py-1.5 active:border-primary/50">
                <Text className="text-sm text-muted-foreground">{g.name}</Text>
              </Pressable>
            </Link>
          ))}
        </View>
      )}
    </View>
  )
}
