import { Link, router } from 'expo-router'
import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { Button } from '@/components/ui/button'
import { StoryCover } from '@/features/stories/StoryCover'
import { useThemeColors } from '@/hooks/useThemeColors'
import { links } from '@/lib/links'
import { cn } from '@/lib/utils'
import type { Story } from '@/types/story'

type Props = {
  /** Chỉ cần phần dùng cho bìa và link (tab Đã lưu chỉ có thông tin truyện trong bản lưu) */
  story: Pick<Story, 'slug' | 'title' | 'coverUrl' | 'author'>
  /** Dòng tên truyện (tên + nhãn) */
  title: ReactNode
  /** Thông tin bên dưới tên: chương, thời gian, thanh % */
  children: ReactNode
  /** Nút đọc chính; null khi truyện chưa có chương */
  read: { label: string; href: ReturnType<typeof links.chapter> } | null
  /** Nút phụ (bỏ theo dõi, xóa khỏi lịch sử) */
  remove: {
    label: string
    icon: (color: string) => ReactNode
    pending: boolean
    onPress: () => void
  }
}

/** Một truyện trong tủ (FollowingRow / HistoryRow của web): bìa, thông tin, nút đọc và nút xóa */
export function LibraryRow({ story, title, children, read, remove }: Props) {
  const colors = useThemeColors()
  return (
    <View className="flex-row gap-4 p-4">
      <Link href={links.story(story.slug)} asChild>
        <Pressable aria-hidden className="self-start">
          <StoryCover story={story} width={56} compact className="rounded" />
        </Pressable>
      </Link>
      <View className="flex-1">
        <Link href={links.story(story.slug)} asChild>
          <Pressable role="link" className="active:opacity-70">
            {title}
          </Pressable>
        </Link>
        {children}
        <View className="mt-3 flex-row items-center gap-2">
          {read && (
            <Button
              onPress={() => router.push(read.href)}
              className="h-9 flex-1 rounded-full px-4"
              textClassName="text-sm"
            >
              {read.label}
            </Button>
          )}
          <Pressable
            role="button"
            aria-label={remove.label}
            disabled={remove.pending}
            onPress={remove.onPress}
            hitSlop={4}
            className="size-10 items-center justify-center rounded-full active:bg-muted"
          >
            {remove.icon(colors.mutedForeground)}
          </Pressable>
        </View>
      </View>
    </View>
  )
}

/** Khung các dòng như danh sách viền bo góc của web (divide-y rounded-xl border bg-card/40) */
export function RowFrame({
  first,
  last,
  children,
}: {
  first: boolean
  last: boolean
  children: ReactNode
}) {
  return (
    <View
      className={cn(
        'border-x border-t border-border bg-card/40',
        first && 'rounded-t-xl',
        last && 'rounded-b-xl border-b',
      )}
    >
      {children}
    </View>
  )
}
