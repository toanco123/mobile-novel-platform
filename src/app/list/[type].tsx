import { router, useLocalSearchParams } from 'expo-router'
import { View } from 'react-native'
import { PlaceholderScreen } from '@/components/common/PlaceholderScreen'
import { SegmentedTabs } from '@/components/common/SegmentedTabs'
import { Text } from '@/components/ui/text'
import { StoryBrowser } from '@/features/stories/StoryBrowser'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { links, type ListType } from '@/lib/links'
import type { StoryStatus } from '@/types/story'

// Tên, mô tả như STATIC_PAGES của web (src/lib/seo.ts)
const lists: Record<
  ListType,
  { tab: string; title: string; description: string; status?: StoryStatus }
> = {
  latest: {
    tab: 'Mới cập nhật',
    title: 'Truyện mới cập nhật',
    description: 'Truyện vừa có chương mới, xếp theo lần cập nhật gần nhất.',
  },
  ongoing: {
    tab: 'Đang ra',
    title: 'Truyện đang ra',
    description: 'Truyện còn đang ra chương mới. Theo dõi để biết ngay khi có chương.',
    status: 'ongoing',
  },
  completed: {
    tab: 'Truyện full',
    title: 'Truyện full',
    description: 'Truyện đã hoàn thành, đọc một mạch tới chương cuối.',
    status: 'completed',
  },
}

const isListType = (type: string | undefined): type is ListType => !!type && type in lists

/** Danh sách truyện theo loại (BrowsePage của web: /list/latest, /list/ongoing, /list/completed) */
export default function ListScreen() {
  const { type } = useLocalSearchParams<{ type: string }>()
  const refreshControl = usePullToRefresh([['stories'], ['genres']])
  if (!isListType(type)) {
    return (
      <PlaceholderScreen title="Không có danh sách này" description="Đường dẫn không hợp lệ." />
    )
  }
  const list = lists[type]

  return (
    <View className="flex-1 bg-background">
      <StoryBrowser
        // key: đổi danh sách thì bộ lọc bắt đầu lại, như web
        key={type}
        fixed={{ status: list.status }}
        refreshControl={refreshControl}
        header={
          <View className="gap-4 pt-2 pb-5">
            <View>
              <Text role="heading" className="font-heading-bold text-4xl leading-tight">
                {list.title}
              </Text>
              <Text className="mt-1 text-muted-foreground">{list.description}</Text>
            </View>
            <SegmentedTabs
              label="Danh sách truyện"
              value={type}
              onChange={(next) => router.replace(links.list(next))}
              items={(Object.keys(lists) as ListType[]).map((key) => ({
                value: key,
                label: lists[key].tab,
              }))}
            />
          </View>
        }
      />
    </View>
  )
}
