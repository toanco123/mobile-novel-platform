import { View } from 'react-native'
import { GenreGrid } from '@/features/genres/GenreGrid'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'

/** /genres như GenresPage của web (deep link); trong app thì tab Khám phá đã có lưới này */
export default function GenresScreen() {
  const refreshControl = usePullToRefresh([['genres']])
  return (
    <View className="flex-1 bg-background">
      <GenreGrid refreshControl={refreshControl} header={<View className="pt-2" />} />
    </View>
  )
}
