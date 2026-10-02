import { router, useLocalSearchParams } from 'expo-router'
import { ChevronDown } from 'lucide-react-native'
import { type ReactElement, type ReactNode, useState } from 'react'
import {
  FlatList,
  Pressable,
  type RefreshControlProps,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native'
import { BottomPanel } from '@/components/common/BottomPanel'
import { Pagination } from '@/components/common/Pagination'
import { SECTION_ERROR } from '@/components/common/SectionHeading'
import { Text } from '@/components/ui/text'
import { useGenres } from '@/features/genres/hooks'
import { useThemeColors } from '@/hooks/useThemeColors'
import { cn } from '@/lib/utils'
import type { BrowseFilters } from './api'
import {
  browseSearch,
  lengthOptions,
  parseBrowseParams,
  sortOptions,
  statusOptions,
} from './browseParams'
import { useBrowseStories } from './hooks'
import { StoryCard, StoryCardSkeleton } from './StoryCard'

type Props = {
  /** Bộ lọc cố định theo màn (vd /list/completed, /genres/:slug); không hiện nút chọn */
  fixed: Pick<BrowseFilters, 'status' | 'genre'>
  /** Phần trên hàng bộ lọc (tên, mô tả của màn) */
  header?: ReactNode
  /** Câu báo khi không có truyện nào (chưa lọc gì) */
  emptyMessage?: string
  refreshControl?: ReactElement<RefreshControlProps>
}

const COLUMNS = 3
const GAP = 12
const PADDING = 16
const BROWSE_KEYS = ['status', 'genre', 'length', 'sort', 'page'] as const

/**
 * Như StoryBrowser của web: lưới truyện có bộ lọc + phân trang. Mọi lựa chọn nằm trên params của
 * route (cùng dạng query string với web qua browseParams.ts).
 */
export function StoryBrowser({
  fixed,
  header,
  emptyMessage = 'Chưa có truyện nào ở đây.',
  refreshControl,
}: Props) {
  const params = useLocalSearchParams<Partial<Record<(typeof BROWSE_KEYS)[number], string>>>()
  const chosen = parseBrowseParams(
    new URLSearchParams(
      BROWSE_KEYS.flatMap((key) => (params[key] ? [[key, params[key]] as [string, string]] : [])),
    ),
  )
  const filters: BrowseFilters = { ...chosen, ...definedOnly(fixed) }
  const { data, isPending, isError, isPlaceholderData } = useBrowseStories(filters)
  const { data: genres } = useGenres()
  const { width } = useWindowDimensions()
  const cardWidth = Math.floor((width - PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS)

  const hasChoice = !!(
    (!fixed.status && chosen.status) ||
    (!fixed.genre && chosen.genre) ||
    chosen.length
  )
  /** Ghi bộ lọc lên params của route; khóa không có trong chuỗi mới thì xóa */
  const apply = (next: BrowseFilters) => {
    const search = new URLSearchParams(browseSearch(next))
    router.setParams(
      Object.fromEntries(BROWSE_KEYS.map((key) => [key, search.get(key) ?? undefined])),
    )
  }
  /** Đổi một bộ lọc thì quay về trang 1, như web */
  const update = (patch: Partial<BrowseFilters>) => apply({ ...chosen, ...patch, page: 1 })

  const filterBar = (
    <View className="gap-3 pb-4">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2"
        aria-label="Bộ lọc"
      >
        {!fixed.genre && (
          <FilterChip
            label="Thể loại"
            value={chosen.genre}
            options={(genres ?? []).map((g) => ({ value: g.slug, label: g.name }))}
            onChange={(genre) => update({ genre })}
          />
        )}
        {!fixed.status && (
          <FilterChip
            label="Trạng thái"
            value={chosen.status}
            options={statusOptions}
            onChange={(status) => update({ status })}
          />
        )}
        <FilterChip
          label="Độ dài"
          value={chosen.length}
          options={lengthOptions}
          onChange={(length) => update({ length })}
        />
        <FilterChip
          label="Sắp xếp"
          value={chosen.sort}
          options={sortOptions}
          onChange={(sort) => update({ sort: sort ?? 'updated' })}
          allowAll={false}
        />
      </ScrollView>
      <View className="flex-row items-center justify-between">
        {hasChoice ? (
          <Pressable role="button" hitSlop={6} onPress={() => apply({ sort: chosen.sort })}>
            <Text className="text-sm text-muted-foreground underline">Xóa bộ lọc</Text>
          </Pressable>
        ) : (
          <View />
        )}
        {data && <Text className="text-sm text-muted-foreground">{`${data.total} truyện`}</Text>}
      </View>
    </View>
  )

  return (
    <FlatList
      data={isPending ? [] : (data?.items ?? [])}
      keyExtractor={(s) => s.slug}
      numColumns={COLUMNS}
      refreshControl={refreshControl}
      aria-busy={isPending || isPlaceholderData}
      className={cn(isPlaceholderData && 'opacity-60')}
      columnWrapperStyle={{ gap: GAP }}
      contentContainerStyle={{ paddingHorizontal: PADDING, paddingBottom: 48, rowGap: 24 }}
      ListHeaderComponent={
        <View>
          {header}
          {filterBar}
        </View>
      }
      ListEmptyComponent={
        isError ? (
          <Text className="text-sm text-muted-foreground">{SECTION_ERROR}</Text>
        ) : isPending ? (
          <View className="flex-row flex-wrap" style={{ gap: GAP, rowGap: 24 }}>
            {Array.from({ length: 6 }, (_, i) => (
              <StoryCardSkeleton key={i} width={cardWidth} />
            ))}
          </View>
        ) : (
          <View className="rounded-xl border border-dashed border-border p-8">
            <Text className="text-center text-muted-foreground">
              {hasChoice ? 'Không có truyện nào khớp bộ lọc.' : emptyMessage}
            </Text>
          </View>
        )
      }
      renderItem={({ item }) => <StoryCard story={item} width={cardWidth} />}
      ListFooterComponent={
        data ? (
          <Pagination
            page={data.page}
            pageCount={data.pageCount}
            onChange={(page) => apply({ ...chosen, page })}
            label="Phân trang danh sách truyện"
            className="mt-4"
          />
        ) : null
      }
    />
  )
}

const definedOnly = <T extends object>(obj: T) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>

/** Nút lọc "Nhãn: giá trị ▾" (FilterSelect của web); bấm mở bảng chọn */
function FilterChip<T extends string>({
  label,
  value,
  options,
  onChange,
  allowAll = true,
}: {
  label: string
  value: T | undefined
  options: { value: T; label: string }[]
  onChange: (value: T | undefined) => void
  /** Có lựa chọn "Tất cả" (bỏ lọc) */
  allowAll?: boolean
}) {
  const [open, setOpen] = useState(false)
  const colors = useThemeColors()
  const current = options.find((o) => o.value === value)?.label ?? 'Tất cả'
  const choices = [...(allowAll ? [{ value: undefined, label: 'Tất cả' }] : []), ...options]
  const pick = (next: T | undefined) => {
    setOpen(false)
    if (next !== value) onChange(next)
  }

  return (
    <>
      <Pressable
        role="button"
        aria-label={`${label}: ${current}`}
        onPress={() => setOpen(true)}
        className={cn(
          'h-9 flex-row items-center gap-1 rounded-full border px-3.5',
          value !== undefined && allowAll ? 'border-primary/50 bg-primary/10' : 'border-border',
        )}
      >
        <Text className="text-sm text-muted-foreground">{`${label}:`}</Text>
        <Text className="font-sans-medium text-sm">{current}</Text>
        <ChevronDown size={14} color={colors.mutedForeground} />
      </Pressable>
      <BottomPanel open={open} onClose={() => setOpen(false)} title={label}>
        <ScrollView contentContainerClassName="px-2 pb-4">
          {choices.map((o) => {
            const active = o.value === value
            return (
              <Pressable
                key={o.value ?? 'all'}
                role="radio"
                aria-checked={active}
                onPress={() => pick(o.value)}
                className={cn(
                  'h-12 justify-center rounded-lg px-3',
                  active ? 'bg-primary/10' : 'active:bg-muted',
                )}
              >
                <Text className={cn(active ? 'font-sans-semibold text-primary' : '')}>
                  {o.label}
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>
      </BottomPanel>
    </>
  )
}
