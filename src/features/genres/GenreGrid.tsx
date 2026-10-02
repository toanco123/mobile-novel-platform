import { Link } from 'expo-router'
import { Search } from 'lucide-react-native'
import { type ReactElement, useState } from 'react'
import {
  FlatList,
  Pressable,
  type RefreshControlProps,
  useWindowDimensions,
  View,
} from 'react-native'
import { SECTION_ERROR } from '@/components/common/SectionHeading'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import { useThemeColors } from '@/hooks/useThemeColors'
import { links } from '@/lib/links'
import { slugify } from '@/lib/slugify'
import { useGenres } from './hooks'

type Props = {
  /** Phần trên ô lọc (tab Khám phá: lối vào xếp hạng, danh sách) */
  header?: ReactElement
  refreshControl?: ReactElement<RefreshControlProps>
}

/**
 * Lưới thể loại có ô lọc như GenresPage của web (tìm theo tên không dấu và mô tả). App chỉ cho
 * người đọc nên không có nút "Tạo thể loại", "Đăng truyện" (khu Sáng tác ở web).
 */
export function GenreGrid({ header, refreshControl }: Props) {
  const { data: genres, isPending, isError } = useGenres()
  const [query, setQuery] = useState('')
  const colors = useThemeColors()
  const { width } = useWindowDimensions()
  // Ô rộng cố định nửa hàng (px-4 hai bên, gap-3 giữa): ô lẻ cuối không giãn ra cả hàng
  const cellWidth = Math.floor((width - 32 - 12) / 2)
  const q = slugify(query)
  const shown = genres?.filter(
    (g) => g.slug.includes(q) || slugify(g.description ?? '').includes(q),
  )

  return (
    <FlatList
      data={shown ?? []}
      keyExtractor={(g) => g.slug}
      numColumns={2}
      refreshControl={refreshControl}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      columnWrapperClassName="gap-3"
      contentContainerClassName="gap-3 px-4 pb-12"
      ListHeaderComponent={
        <View className="gap-4 pb-1">
          {header}
          <View>
            <Text role="heading" className="font-heading-bold text-[28px] leading-tight">
              Thể loại
            </Text>
            {genres && (
              <Text className="text-sm text-muted-foreground">{`${genres.length} thể loại`}</Text>
            )}
          </View>
          <View className="justify-center">
            <Input
              aria-label="Tìm thể loại"
              value={query}
              onChangeText={setQuery}
              placeholder="Tìm thể loại…"
              returnKeyType="search"
              autoCorrect={false}
              className="h-10 rounded-full bg-muted/60 pl-10 text-sm"
            />
            <View pointerEvents="none" className="absolute left-3.5">
              <Search size={16} color={colors.mutedForeground} />
            </View>
          </View>
        </View>
      }
      ListEmptyComponent={
        isError ? (
          <Text className="text-sm text-muted-foreground">{SECTION_ERROR}</Text>
        ) : isPending ? (
          <View className="flex-row flex-wrap gap-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 grow basis-[45%] rounded-xl" />
            ))}
          </View>
        ) : (
          <View className="rounded-xl border border-dashed border-border p-6">
            <Text className="text-center text-sm text-muted-foreground">
              {query.trim()
                ? `Không tìm thấy thể loại “${query.trim()}”.`
                : 'Chưa có thể loại nào.'}
            </Text>
          </View>
        )
      }
      renderItem={({ item: g }) => (
        <Link href={links.genre(g.slug)} asChild>
          <Pressable
            style={{ width: cellWidth }}
            className="rounded-xl border border-border bg-card/50 p-4 active:border-primary/50"
          >
            <Text className="font-heading-bold text-xl leading-tight">{g.name}</Text>
            <Text className="mt-0.5 text-sm text-muted-foreground">{`${g.storyCount} truyện`}</Text>
            {g.description ? (
              <Text numberOfLines={2} className="mt-2 text-xs text-muted-foreground">
                {g.description}
              </Text>
            ) : null}
            {g.createdBy && (
              <Text className="mt-auto pt-2 text-xs text-rose-gold">
                {`do ${g.createdBy.displayName} tạo`}
              </Text>
            )}
          </Pressable>
        </Link>
      )}
    />
  )
}
