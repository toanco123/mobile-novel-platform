import { View, type ViewProps } from 'react-native'
import { cn } from '@/lib/utils'

/** Khối giữ chỗ khi đang tải (như animate-pulse bg-muted của web, đứng yên) */
export function Skeleton({ className, ...props }: ViewProps) {
  return <View aria-hidden className={cn('rounded bg-muted', className)} {...props} />
}
