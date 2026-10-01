import { View } from 'react-native'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'

/** Thanh % đã đọc trong chương (chữ % đi kèm để không phụ thuộc màu), như web */
export function ProgressMeter({ value, className }: { value: number; className?: string }) {
  const percent = Math.round(value * 100)
  return (
    <View className={cn('flex-row items-center gap-2', className)}>
      <View className="h-1 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden>
        <View className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </View>
      <Text className="text-xs text-muted-foreground tabular-nums">{percent}%</Text>
    </View>
  )
}
