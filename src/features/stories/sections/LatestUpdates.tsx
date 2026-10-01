import { Link } from 'expo-router'
import { Fragment } from 'react'
import { Pressable, View } from 'react-native'
import { SECTION_ERROR, SectionHeading, SectionNote } from '@/components/common/SectionHeading'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import { TextLink } from '@/components/ui/text-link'
import { formatRelativeTime } from '@/lib/format'
import { links } from '@/lib/links'
import { useLatestUpdated } from '../hooks'

/** Mới cập nhật: tên, thể loại đầu, chương mới nhất (bấm mở chương), thời gian (như web) */
export function LatestUpdates() {
  const { data, isPending, isError } = useLatestUpdated()

  return (
    <View className="mt-10">
      <SectionHeading>Mới cập nhật</SectionHeading>
      {isError ? (
        <SectionNote>{SECTION_ERROR}</SectionNote>
      ) : data?.length === 0 ? (
        <SectionNote>Chưa có truyện nào được đăng.</SectionNote>
      ) : (
        <View className="mx-4 overflow-hidden rounded-xl border border-border bg-card">
          {isPending
            ? [0, 1, 2, 3, 4].map((i) => (
                <View key={i} className="gap-2 border-b border-border px-4 py-3.5">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </View>
              ))
            : data.map((s, i) => (
                <Fragment key={s.slug}>
                  {i > 0 && <View className="h-px bg-border" />}
                  <Link href={links.story(s.slug)} asChild>
                    <Pressable className="gap-1 px-4 py-3.5 active:bg-muted">
                      <View className="flex-row items-baseline justify-between gap-3">
                        <Text numberOfLines={1} className="flex-1 font-sans-medium">
                          {s.title}
                        </Text>
                        <Text className="text-xs text-muted-foreground">
                          {formatRelativeTime(s.updatedAt)}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        {s.latestChapter ? (
                          <Link href={links.chapter(s.slug, s.latestChapter.number)} asChild>
                            <TextLink numberOfLines={1} className="shrink font-sans">
                              {`Chương ${s.latestChapter.number}${s.latestChapter.title ? `: ${s.latestChapter.title}` : ''}`}
                            </TextLink>
                          </Link>
                        ) : (
                          <Text className="text-sm text-muted-foreground">Chưa có chương</Text>
                        )}
                        {s.genres[0] && (
                          <Text className="text-xs text-muted-foreground">
                            · {s.genres[0].name}
                          </Text>
                        )}
                      </View>
                    </Pressable>
                  </Link>
                </Fragment>
              ))}
        </View>
      )}
    </View>
  )
}
