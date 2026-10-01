import type { ReactNode } from 'react'
import { Text, View } from 'react-native'

/** Màn hình tạm của bộ khung: giữ chỗ cho các bước trong documents/plan-app-di-dong.md */
export function PlaceholderScreen({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children?: ReactNode
}) {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-background px-6">
      <Text className="font-heading-bold text-3xl text-foreground">{title}</Text>
      <Text className="text-center font-sans text-base text-muted-foreground">{description}</Text>
      {children}
    </View>
  )
}
