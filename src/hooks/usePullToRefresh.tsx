import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { RefreshControl } from 'react-native'
import { useThemeColors } from './useThemeColors'

/**
 * Kéo xuống để tải lại: trả RefreshControl tải lại các query đang hiện có khóa bắt đầu bằng một
 * trong `keys` (vd [['stories'], ['genres']])
 */
export function usePullToRefresh(keys: readonly (readonly unknown[])[]) {
  const queryClient = useQueryClient()
  const colors = useThemeColors()
  const [refreshing, setRefreshing] = useState(false)
  const refresh = async () => {
    setRefreshing(true)
    await Promise.all(
      keys.map((queryKey) => queryClient.refetchQueries({ queryKey, type: 'active' })),
    )
    setRefreshing(false)
  }
  return <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
}
