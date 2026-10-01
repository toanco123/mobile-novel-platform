import { View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'

/** Khung chữ viền đứt giữa màn: danh sách trống, mời đăng nhập (như web) */
export function LibraryEmpty({
  title,
  description,
  action,
  onAction,
}: {
  title: string
  description: string
  action: string
  onAction: () => void
}) {
  return (
    <View className="items-center rounded-xl border border-dashed border-border px-6 py-10">
      <Text className="text-center font-heading-bold text-2xl">{title}</Text>
      <Text className="mt-1 text-center text-muted-foreground">{description}</Text>
      <Button onPress={onAction} className="mt-5 h-10 rounded-full px-5" textClassName="text-sm">
        {action}
      </Button>
    </View>
  )
}

export function ListSkeleton() {
  return (
    <View className="rounded-xl border border-border">
      {[0, 1, 2].map((i) => (
        <View key={i} className={cn('flex-row gap-4 p-4', i < 2 && 'border-b border-border')}>
          <Skeleton className="h-[84px] w-14" />
          <View className="flex-1 gap-2">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </View>
        </View>
      ))}
    </View>
  )
}
