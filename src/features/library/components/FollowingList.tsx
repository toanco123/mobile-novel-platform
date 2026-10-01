import { router } from 'expo-router'
import { BookmarkX, Sparkles } from 'lucide-react-native'
import type { ReactElement } from 'react'
import { FlatList, type RefreshControlProps, Pressable, View } from 'react-native'
import { SECTION_ERROR } from '@/components/common/SectionHeading'
import { Text } from '@/components/ui/text'
import { useThemeColors } from '@/hooks/useThemeColors'
import { formatRelativeTime } from '@/lib/format'
import { links } from '@/lib/links'
import type { LibraryItem } from '@/types/library'
import { useLibrary, useToggleFollow } from '../hooks'
import { LibraryEmpty, ListSkeleton } from './LibraryStates'
import { LibraryRow, RowFrame } from './LibraryRow'
import { ProgressMeter } from './ProgressMeter'

type Props = {
  header: ReactElement
  refreshControl: ReactElement<RefreshControlProps>
}

/** Như FollowingList của web: truyện đang theo dõi, truyện có chương mới, chỗ đang đọc */
export function FollowingList({ header, refreshControl }: Props) {
  const { data, isPending, isError } = useLibrary()
  const updated = data?.filter((item) => item.newChapters > 0).length ?? 0

  return (
    <FlatList
      data={data ?? []}
      keyExtractor={(item) => item.story.slug}
      refreshControl={refreshControl}
      contentContainerClassName="px-4 pb-12"
      ListHeaderComponent={
        <View>
          {header}
          {data && data.length > 0 && (
            <Text className="mb-3 text-sm text-muted-foreground">
              {`${data.length} truyện${updated > 0 ? `, ${updated} truyện có chương mới` : ''}`}
            </Text>
          )}
        </View>
      }
      ListEmptyComponent={
        isError ? (
          <Text className="text-sm text-muted-foreground">{SECTION_ERROR}</Text>
        ) : isPending ? (
          <ListSkeleton />
        ) : (
          <LibraryEmpty
            title="Tủ truyện còn trống"
            description="Bấm “Thêm vào tủ truyện” ở trang truyện để theo dõi. Có chương mới là thấy ngay ở đây."
            action="Tìm truyện ở Trang chủ"
            onAction={() => router.navigate('/')}
          />
        )
      }
      renderItem={({ item, index }) => (
        <RowFrame first={index === 0} last={index === (data?.length ?? 0) - 1}>
          <FollowingRow item={item} />
        </RowFrame>
      )}
    />
  )
}

function FollowingRow({ item: { story, newChapters, progress } }: { item: LibraryItem }) {
  const unfollow = useToggleFollow(story.slug)
  const colors = useThemeColors()
  const read = progress
    ? { label: 'Đọc tiếp', href: links.chapter(story.slug, progress.chapter, progress.progress) }
    : story.firstChapterNumber !== null
      ? { label: 'Đọc', href: links.chapter(story.slug, story.firstChapterNumber) }
      : null
  const latest = story.latestChapter

  return (
    <LibraryRow
      story={story}
      title={
        <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
          <Text numberOfLines={1} className="shrink font-sans-medium">
            {story.title}
          </Text>
          {newChapters > 0 && (
            <View className="flex-row items-center gap-1 rounded-full bg-neon/15 px-2 py-0.5">
              <Sparkles size={12} color={colors.neon} />
              <Text className="font-sans-semibold text-xs text-neon">
                {`${newChapters} chương mới`}
              </Text>
            </View>
          )}
        </View>
      }
      read={read}
      remove={{
        label: `Bỏ theo dõi ${story.title}`,
        icon: (color) => <BookmarkX size={20} color={color} />,
        pending: unfollow.isPending,
        onPress: () => unfollow.mutate(false),
      }}
    >
      {latest ? (
        <View className="mt-0.5 flex-row flex-wrap items-center">
          <Text className="text-sm text-muted-foreground">Mới nhất: </Text>
          <Pressable
            role="link"
            hitSlop={6}
            onPress={() => router.push(links.chapter(story.slug, latest.number))}
          >
            <Text className="text-sm text-rose-gold">{`Chương ${latest.number}`}</Text>
          </Pressable>
          <Text className="text-sm text-muted-foreground">
            {`, ${formatRelativeTime(story.updatedAt)}`}
          </Text>
        </View>
      ) : (
        <Text className="mt-0.5 text-sm text-muted-foreground">Chưa có chương</Text>
      )}
      {progress ? (
        <View className="mt-2">
          <Text className="mb-1 text-xs text-muted-foreground">
            {`Đang đọc chương ${progress.chapter}/${story.chapterCount}`}
          </Text>
          <ProgressMeter value={progress.progress} />
        </View>
      ) : (
        <Text className="mt-2 text-xs text-muted-foreground">Chưa đọc</Text>
      )}
    </LibraryRow>
  )
}
