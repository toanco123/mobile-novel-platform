import type { ReactNode } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { Text } from '@/components/ui/text'

/**
 * Khung các màn đăng nhập/đăng ký/mật khẩu (thay AuthLayout + AuthHeading của web): cuộn được, tránh
 * bàn phím, tiêu đề serif lớn và dòng giới thiệu.
 */
export function AuthScreen({
  title,
  description,
  footer,
  children,
}: {
  title: string
  description?: string
  /** Dòng cuối màn, vd "Chưa có tài khoản? Tạo tài khoản" */
  footer?: ReactNode
  children: ReactNode
}) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="grow px-6 pt-4 pb-10"
      >
        <View className="mb-7 gap-2">
          <Text role="heading" className="font-heading-bold text-4xl leading-tight">
            {title}
          </Text>
          {description && <Text className="text-muted-foreground">{description}</Text>}
        </View>
        {children}
        {footer && <View className="mt-8 items-center">{footer}</View>}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

/** Dòng chữ nhỏ có link ở cuối màn (link là TextLink lồng bên trong) */
export function AuthFooter({ children }: { children: ReactNode }) {
  return <Text className="text-center text-sm text-muted-foreground">{children}</Text>
}
