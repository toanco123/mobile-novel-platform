import { router, Stack, useLocalSearchParams } from 'expo-router'
import { View } from 'react-native'
import { PlaceholderScreen } from '@/components/common/PlaceholderScreen'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { useGenres } from '@/features/genres/hooks'
import { StoryBrowser } from '@/features/stories/StoryBrowser'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { links } from '@/lib/links'

/** Truyện của một thể loại (GenreStoriesPage của web, bỏ nút "Đăng truyện") */
export default function GenreStoriesScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const genres = useGenres()
  const genre = genres.data?.find((g) => g.slug === slug)
  const refreshControl = usePullToRefresh([['stories'], ['genres']])

  if (genres.data && !genre) {
    return (
      <PlaceholderScreen
        title="Không tìm thấy thể loại"
        description="Có thể thể loại đã bị đổi tên hoặc gỡ."
      >
        <Button
          variant="outline"
          onPress={() => router.replace(links.genres)}
          className="mt-2 px-6"
        >
          Xem các thể loại
        </Button>
      </PlaceholderScreen>
    )
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: genre?.name ?? '' }} />
      <StoryBrowser
        fixed={{ genre: slug }}
        emptyMessage="Chưa có truyện nào thuộc thể loại này."
        refreshControl={refreshControl}
        header={
          <View className="pt-2 pb-5">
            <Text role="heading" className="font-heading-bold text-4xl leading-tight">
              {genre?.name ?? '…'}
            </Text>
            {genre?.description ? (
              <Text className="mt-2 text-muted-foreground">{genre.description}</Text>
            ) : null}
            {genre?.createdBy && (
              <Text className="mt-1 text-xs text-rose-gold">
                {`Thể loại do ${genre.createdBy.displayName} tạo`}
              </Text>
            )}
          </View>
        }
      />
    </View>
  )
}
