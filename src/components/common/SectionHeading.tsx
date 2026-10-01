import type { ReactNode } from 'react'
import { View } from 'react-native'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'

/** Tiêu đề khối trên trang (như SectionHeading của web); action: vd link "Xem tất cả" */
export function SectionHeading({
  icon,
  action,
  className,
  children,
}: {
  icon?: ReactNode
  action?: ReactNode
  className?: string
  children: string
}) {
  return (
    <View className={cn('mb-4 flex-row items-end justify-between gap-4 px-4', className)}>
      <View className="flex-row items-center gap-2">
        {icon}
        <Text role="heading" className="font-heading-bold text-[28px] leading-tight">
          {children}
        </Text>
      </View>
      {action}
    </View>
  )
}

/** Khung chữ viền đứt: lỗi tải hoặc danh sách trống */
export function SectionNote({ children }: { children: string }) {
  return (
    <View className="mx-4 rounded-lg border border-dashed border-border p-5">
      <Text className="text-sm text-muted-foreground">{children}</Text>
    </View>
  )
}

export const SECTION_ERROR = 'Không tải được danh sách này. Kéo xuống để tải lại.'
