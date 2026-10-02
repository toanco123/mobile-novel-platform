import { Link, router, Stack, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, Search, X } from 'lucide-react-native'
import { useRef, useState } from 'react'
import { FlatList, Keyboard, Pressable, ScrollView, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Pagination } from '@/components/common/Pagination'
import { SECTION_ERROR } from '@/components/common/SectionHeading'
import { Input } from '@/components/ui/input'
import { Text } from '@/components/ui/text'
import { useSearchStories, useSearchSuggestions } from '@/features/stories/hooks'
import { GenreCloud } from '@/features/stories/sections/GenreCloud'
import { TrendingWeekly } from '@/features/stories/sections/TrendingWeekly'
import { StoryListItem } from '@/features/stories/StoryListItem'
import { StoryRow, StoryRowSkeleton } from '@/features/stories/StoryRow'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useThemeColors } from '@/hooks/useThemeColors'
import { links } from '@/lib/links'
import { cn } from '@/lib/utils'

const MIN_QUERY = 2

/**
 * Tìm truyện: gộp ô tìm ở header (SearchBox, gợi ý khi gõ từ 2 ký tự) và trang /search?q= của web.
 * Từ khóa đã tìm và trang kết quả giữ trên params của route.
 */
export default function SearchScreen() {
  const params = useLocalSearchParams<{ q?: string; page?: string }>()
  const q = (params.q ?? '').trim()
  const page = Math.max(1, Number(params.page) || 1)
  const insets = useSafeAreaInsets()
  const colors = useThemeColors()
  const input = useRef<TextInput>(null)
  const [value, setValue] = useState(q)
  // Đang gõ (chưa bấm Tìm): hiện gợi ý thay cho kết quả
  const [editing, setEditing] = useState(!q)

  const query = value.trim()
  const debounced = useDebouncedValue(query, 200)
  const suggesting = editing && query.length >= MIN_QUERY

  function submit(next = query) {
    Keyboard.dismiss()
    setValue(next)
    setEditing(false)
    router.setParams({ q: next || undefined, page: undefined })
  }

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'))

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center gap-1 px-2 pt-1 pb-3">
        <Pressable
          role="button"
          aria-label="Quay lại"
          onPress={back}
          className="size-11 items-center justify-center rounded-full active:bg-muted"
        >
          <ArrowLeft size={22} color={colors.foreground} />
        </Pressable>
        <View className="flex-1 justify-center">
          <Input
            ref={input}
            aria-label="Tên truyện hoặc tác giả"
            autoFocus={!q}
            value={value}
            onChangeText={(text) => {
              setValue(text)
              setEditing(true)
            }}
            onFocus={() => setEditing(true)}
            onSubmitEditing={() => submit()}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            placeholder="Tên truyện hoặc tác giả"
            className="h-11 rounded-full bg-muted/60 pr-10 pl-10 text-[15px]"
          />
          <View pointerEvents="none" className="absolute left-3.5">
            <Search size={17} color={colors.mutedForeground} />
          </View>
          {value.length > 0 && (
            <Pressable
              role="button"
              aria-label="Xóa ô tìm"
              hitSlop={8}
              onPress={() => {
                setValue('')
                setEditing(true)
                input.current?.focus()
              }}
              className="absolute right-3"
            >
              <X size={17} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      {suggesting ? (
        <Suggestions query={query} debounced={debounced} onSubmit={submit} />
      ) : q && !editing ? (
        <Results q={q} page={page} />
      ) : (
        <Ideas />
      )}
    </View>
  )
}

/** Gợi ý truyện khi đang gõ (như SearchBox của web) và dòng "Xem tất cả kết quả" */
function Suggestions({
  query,
  debounced,
  onSubmit,
}: {
  query: string
  debounced: string
  onSubmit: (q: string) => void
}) {
  const { data } = useSearchSuggestions(debounced)
  const colors = useThemeColors()
  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="px-2 pb-12">
      {(data ?? []).map((s) => (
        <StoryListItem key={s.slug} story={s} />
      ))}
      <Pressable
        role="button"
        onPress={() => onSubmit(query)}
        className="flex-row items-center gap-3 rounded-lg p-3 active:bg-muted"
      >
        <Search size={18} color={colors.primary} />
        <Text numberOfLines={1} className="flex-1 font-sans-medium text-primary">
          {`Xem tất cả kết quả cho “${query}”`}
        </Text>
      </Pressable>
    </ScrollView>
  )
}

/** Ô trống hoặc không có kết quả: thể loại và top tuần như web */
function Ideas({ note }: { note?: string }) {
  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="pb-12">
      {note && (
        <View className="mx-4 mt-2 rounded-xl border border-dashed border-border p-5">
          <Text className="text-sm text-muted-foreground">{note}</Text>
        </View>
      )}
      <GenreCloud />
      <TrendingWeekly />
    </ScrollView>
  )
}

function Results({ q, page }: { q: string; page: number }) {
  const { data, isPending, isError, isPlaceholderData } = useSearchStories(q, page)
  const list = useRef<FlatList>(null)

  if (isError) {
    return <Text className="px-4 text-sm text-muted-foreground">{SECTION_ERROR}</Text>
  }
  if (data?.total === 0) {
    return (
      <View className="flex-1">
        <Text className="px-4 text-muted-foreground">
          Không tìm thấy truyện nào cho <Text className="font-sans-medium">{`“${q}”`}</Text>
        </Text>
        <Ideas note="Thử gõ ngắn hơn, bỏ bớt từ, hoặc tìm theo tên tác giả. Dưới đây là vài gợi ý cho bạn." />
      </View>
    )
  }

  return (
    <FlatList
      ref={list}
      data={isPending ? [] : (data?.items ?? [])}
      keyExtractor={(s) => s.slug}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      aria-label="Kết quả tìm kiếm"
      aria-busy={isPending || isPlaceholderData}
      className={cn(isPlaceholderData && 'opacity-60')}
      contentContainerClassName="px-4 pb-12"
      ItemSeparatorComponent={() => <View className="h-px bg-border" />}
      ListHeaderComponent={
        <View className="gap-4 pb-1">
          <Text className="text-muted-foreground">
            {data ? `${data.total} truyện cho ` : 'Đang tìm… '}
            {data && <Text className="font-sans-medium">{`“${q}”`}</Text>}
          </Text>
          {data && data.genres.length > 0 && (
            <View className="flex-row flex-wrap items-center gap-2">
              <Text className="text-sm text-muted-foreground">Thể loại:</Text>
              {data.genres.map((g) => (
                <Link key={g.slug} href={links.genre(g.slug)} asChild>
                  <Pressable className="rounded-full border border-rose-gold/40 px-3.5 py-1.5 active:border-rose-gold">
                    <Text className="text-sm text-rose-gold">{g.name}</Text>
                  </Pressable>
                </Link>
              ))}
            </View>
          )}
        </View>
      }
      ListEmptyComponent={
        isPending ? (
          <View>
            {[0, 1, 2, 3].map((i) => (
              <StoryRowSkeleton key={i} />
            ))}
          </View>
        ) : null
      }
      renderItem={({ item }) => <StoryRow story={item} />}
      ListFooterComponent={
        data ? (
          <Pagination
            page={data.page}
            pageCount={data.pageCount}
            onChange={(next) => {
              router.setParams({ page: next > 1 ? String(next) : undefined })
              list.current?.scrollToOffset({ offset: 0, animated: true })
            }}
            label="Phân trang kết quả tìm kiếm"
          />
        ) : null
      }
    />
  )
}
