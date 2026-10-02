import { Link } from 'expo-router'
import { Pressable, View } from 'react-native'
import { SectionHeading, SeeAll } from '@/components/common/SectionHeading'
import { Text } from '@/components/ui/text'
import { useGenres } from '@/features/genres/hooks'
import { links } from '@/lib/links'

/** Như GenreCloud của web: các thể loại dạng thẻ; chưa có thể loại nào thì ẩn cả khối */
export function GenreCloud() {
  const { data } = useGenres()
  if (!data?.length) return null

  return (
    <View className="mt-10">
      <SectionHeading action={<SeeAll href={links.genres} />}>Thể loại</SectionHeading>
      <View className="flex-row flex-wrap gap-2 px-4">
        {data.map((g) => (
          <Link key={g.slug} href={links.genre(g.slug)} asChild>
            <Pressable className="rounded-full border border-border px-3.5 py-1.5 active:border-primary/50">
              <Text className="text-sm text-muted-foreground">{g.name}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </View>
  )
}
