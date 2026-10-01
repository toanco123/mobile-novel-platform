import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'
import type { Story } from '@/types/story'
import { coverPalette } from './coverPalette'

type Props = {
  story: Pick<Story, 'slug' | 'title' | 'coverUrl' | 'author'>
  /** Chiều rộng (pt); bìa luôn tỉ lệ 2:3 */
  width: number
  /** Bìa cỡ nhỏ (thumbnail, xếp hạng): chỉ giữ màu và khung, bỏ chữ */
  compact?: boolean
  /** Bo góc, viền... (đặt trên khung ngoài) */
  className?: string
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** Như StoryCover của web: ảnh bìa, chưa có ảnh (hoặc ảnh lỗi) thì bìa chữ tự sinh theo slug */
export function StoryCover({ story, width, compact = false, className }: Props) {
  const height = width * 1.5
  const [failed, setFailed] = useState<string | null>(null)
  const label = `Bìa truyện ${story.title}`

  if (story.coverUrl && failed !== story.coverUrl) {
    const url = story.coverUrl
    return (
      <View style={{ width, height }} className={cn('overflow-hidden bg-muted', className)}>
        <Image
          source={url}
          accessibilityLabel={label}
          contentFit="cover"
          transition={200}
          onError={() => setFailed(url)}
          style={{ width, height }}
        />
      </View>
    )
  }

  const p = coverPalette(story.slug)
  const frame = { borderWidth: 1, borderColor: `${p.ink}59` }
  const titleSize = clamp(width * 0.13, 12, 44)
  return (
    <View
      role="img"
      aria-label={label}
      style={{ width, height }}
      className={cn('overflow-hidden', className)}
    >
      <LinearGradient
        colors={[p.from, p.to]}
        start={{ x: 0.25, y: 0 }}
        end={{ x: 0.75, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {compact ? (
        <View style={[frame, { position: 'absolute', inset: width * 0.1 }]} />
      ) : (
        <View
          style={[
            frame,
            {
              position: 'absolute',
              inset: width * 0.06,
              paddingHorizontal: width * 0.08,
              paddingVertical: height * 0.1,
              alignItems: 'center',
              justifyContent: 'space-between',
            },
          ]}
        >
          <View style={{ height: 1, width: '25%', backgroundColor: `${p.ink}99` }} />
          <Text
            numberOfLines={5}
            className="text-center font-heading-italic"
            style={{ color: p.ink, fontSize: titleSize, lineHeight: titleSize * 1.05 }}
          >
            {story.title}
          </Text>
          <Text
            numberOfLines={1}
            className="text-center"
            style={{ color: p.ink, opacity: 0.75, fontSize: clamp(width * 0.06, 8, 14) }}
          >
            {story.author.name}
          </Text>
        </View>
      )}
    </View>
  )
}
