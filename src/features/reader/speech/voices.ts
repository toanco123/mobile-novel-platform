// Như useVoices của web (src/features/reader/speech/useVoices.ts) trên expo-speech: giọng đọc của máy,
// giọng tiếng Việt xếp trước. Danh sách lấy một lần, giữ trong cache của TanStack Query.
import { queryOptions, useQuery } from '@tanstack/react-query'
import { getAvailableVoicesAsync, type Voice } from 'expo-speech'

const isVietnamese = (v: Voice) => v.language.toLowerCase().startsWith('vi')

export const voicesQuery = queryOptions({
  queryKey: ['speech', 'voices'],
  queryFn: async () => {
    const voices = await getAvailableVoicesAsync()
    return [...voices.filter(isVietnamese), ...voices.filter((v) => !isVietnamese(v))]
  },
  staleTime: Infinity,
  networkMode: 'always',
})

export function useVoices() {
  const { data: all = [] } = useQuery(voicesQuery)
  return { all, vietnamese: all.filter(isVietnamese) }
}

/** Giọng sẽ dùng: giọng đã chọn nếu còn, không thì giọng tiếng Việt đầu tiên */
export const pickVoice = (voices: Voice[], id: string | null) =>
  voices.find((v) => v.identifier === id) ?? voices.find(isVietnamese) ?? null
