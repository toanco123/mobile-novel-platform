import { router } from 'expo-router'
import { X } from 'lucide-react-native'
import type { ReactElement } from 'react'
import { Alert, FlatList, Pressable, type RefreshControlProps, View } from 'react-native'
import { SECTION_ERROR } from '@/components/common/SectionHeading'
import { Text } from '@/components/ui/text'
import { formatRelativeTime } from '@/lib/format'
import { links } from '@/lib/links'
import type { HistoryItem } from '@/types/library'
import { useClearHistory, useReadingHistory, useRemoveFromHistory } from '../hooks'
import { LibraryEmpty, ListSkeleton } from './LibraryStates'
import { LibraryRow, RowFrame } from './LibraryRow'
import { ProgressMeter } from './ProgressMeter'

type Props = {
  header: ReactElement
  refreshControl: ReactElement<RefreshControlProps>
}

/** Như HistoryList của web: truyện đã đọc gần đây kèm chỗ đọc dở, xóa từng truyện hoặc tất cả */
export function HistoryList({ header, refreshControl }: Props) {
  const { data, isPending, isError } = useReadingHistory()

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
            <View className="mb-3 flex-row items-center justify-between gap-3">
              <Text className="text-sm text-muted-foreground">
                {`${data.length} truyện đã đọc gần đây`}
              </Text>
              <ClearHistoryButton />
            </View>
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
            title="Chưa có lịch sử đọc"
            description="Truyện bạn mở đọc sẽ hiện ở đây, kèm chỗ đọc dở để đọc tiếp ngay."
            action="Tìm truyện ở Trang chủ"
            onAction={() => router.navigate('/')}
          />
        )
      }
      renderItem={({ item, index }) => (
        <RowFrame first={index === 0} last={index === (data?.length ?? 0) - 1}>
          <HistoryRow item={item} />
        </RowFrame>
      )}
    />
  )
}

function HistoryRow({ item: { story, progress } }: { item: HistoryItem }) {
  const remove = useRemoveFromHistory()
  return (
    <LibraryRow
      story={story}
      title={
        <Text numberOfLines={1} className="font-sans-medium">
          {story.title}
        </Text>
      }
      read={{
        label: 'Đọc tiếp',
        href: links.chapter(story.slug, progress.chapter, progress.progress),
      }}
      remove={{
        label: `Xóa ${story.title} khỏi lịch sử`,
        icon: (color) => <X size={20} color={color} />,
        pending: remove.isPending,
        onPress: () => remove.mutate(story.slug),
      }}
    >
      <Text numberOfLines={1} className="mt-0.5 text-sm text-muted-foreground">
        {`Chương ${progress.chapter}${progress.chapterTitle ? `: ${progress.chapterTitle}` : ''}`}
        <Text className="text-sm text-muted-foreground/70">
          {` · ${formatRelativeTime(progress.readAt)}`}
        </Text>
      </Text>
      <ProgressMeter value={progress.progress} className="mt-2" />
    </LibraryRow>
  )
}

/** "Xóa toàn bộ": hỏi lại bằng hộp thoại hệ thống như Dialog của web */
function ClearHistoryButton() {
  const clear = useClearHistory()
  const confirm = () =>
    Alert.alert(
      'Xóa toàn bộ lịch sử đọc?',
      'Chỗ đọc dở của mọi truyện sẽ mất. Truyện trong tủ vẫn được giữ.',
      [
        { text: 'Giữ lại', style: 'cancel' },
        { text: 'Xóa lịch sử', style: 'destructive', onPress: () => clear.mutate() },
      ],
    )
  return (
    <Pressable
      role="button"
      disabled={clear.isPending}
      onPress={confirm}
      hitSlop={6}
      className="rounded-full px-2 py-1 active:bg-muted"
    >
      <Text className="font-sans-medium text-sm text-muted-foreground">Xóa toàn bộ</Text>
    </Pressable>
  )
}
