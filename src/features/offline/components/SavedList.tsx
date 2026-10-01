import { router } from 'expo-router'
import { Trash2 } from 'lucide-react-native'
import type { ReactElement } from 'react'
import { Alert, FlatList, Pressable, type RefreshControlProps, View } from 'react-native'
import { SECTION_ERROR } from '@/components/common/SectionHeading'
import { Text } from '@/components/ui/text'
import { LibraryRow, RowFrame } from '@/features/library/components/LibraryRow'
import { LibraryEmpty, ListSkeleton } from '@/features/library/components/LibraryStates'
import { formatBytes } from '@/lib/format'
import { links } from '@/lib/links'
import { useClearSaved, useRemoveSavedStory, useSavedStories } from '../hooks'
import type { SavedStory } from '../store'

type Props = {
  header: ReactElement
  refreshControl: ReactElement<RefreshControlProps>
}

/** Như SavedList của web (tab "Đã lưu" của tủ truyện): chỉ đọc kho trên máy nên dùng được khi offline */
export function SavedList({ header, refreshControl }: Props) {
  const { data, isPending, isError } = useSavedStories()
  const bytes = data?.reduce((sum, s) => sum + s.bytes, 0) ?? 0

  return (
    <FlatList
      data={data ?? []}
      keyExtractor={(saved) => saved.story.slug}
      refreshControl={refreshControl}
      contentContainerClassName="px-4 pb-12"
      ListHeaderComponent={
        <View>
          {header}
          {data && data.length > 0 && (
            <View className="mb-3 flex-row items-center justify-between gap-3">
              <Text className="text-sm text-muted-foreground">
                {`${data.length} truyện · ${formatBytes(bytes)} trên máy này`}
              </Text>
              <ClearSavedButton />
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
            title="Chưa có chương nào được lưu"
            description={
              'Chương bạn mở sẽ tự được lưu để đọc khi không có mạng. Muốn đọc cả truyện lúc offline thì bấm "Tải về đọc offline" ở trang truyện.'
            }
            action="Tìm truyện ở Trang chủ"
            onAction={() => router.navigate('/')}
          />
        )
      }
      renderItem={({ item, index }) => (
        <RowFrame first={index === 0} last={index === (data?.length ?? 0) - 1}>
          <SavedRow saved={item} />
        </RowFrame>
      )}
    />
  )
}

function SavedRow({ saved }: { saved: SavedStory }) {
  const remove = useRemoveSavedStory()
  const { story, numbers, resume } = saved
  const range = numbers.length > 1 ? `${numbers[0]}–${numbers.at(-1)}` : `${numbers[0]}`

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
        href: links.chapter(story.slug, resume.number, resume.progress),
      }}
      remove={{
        label: `Xóa ${story.title} khỏi máy`,
        icon: (color) => <Trash2 size={19} color={color} />,
        pending: remove.isPending,
        onPress: () => remove.mutate(story.slug),
      }}
    >
      <Text numberOfLines={1} className="mt-0.5 text-sm text-muted-foreground">
        {`Đã lưu ${numbers.length} chương (${range}) · ${formatBytes(saved.bytes)}`}
      </Text>
      {saved.pinned && (
        <View className="mt-2 self-start rounded-md bg-secondary px-2 py-0.5">
          <Text className="font-sans-medium text-xs text-secondary-foreground">Đã tải về</Text>
        </View>
      )}
    </LibraryRow>
  )
}

/** "Xóa tất cả": hỏi lại bằng hộp thoại hệ thống như Dialog của web */
function ClearSavedButton() {
  const clear = useClearSaved()
  const confirm = () =>
    Alert.alert(
      'Xóa mọi chương đã lưu?',
      'Chương đã lưu và đã tải về trên máy này sẽ bị xóa. Lịch sử đọc và tủ truyện vẫn được giữ.',
      [
        { text: 'Giữ lại', style: 'cancel' },
        { text: 'Xóa hết', style: 'destructive', onPress: () => clear.mutate() },
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
      <Text className="font-sans-medium text-sm text-muted-foreground">Xóa tất cả</Text>
    </Pressable>
  )
}
