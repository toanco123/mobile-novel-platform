// Ô nhập của form nối react-hook-form (thay FormField + register của web: React Native cần Controller).
// Nhãn đọc kèm ô nhập; có lỗi thì trình đọc màn hình đọc lỗi sau nhãn (accessibilityHint).
import { Eye, EyeOff } from 'lucide-react-native'
import { type ReactNode, useState } from 'react'
import { type Control, type FieldValues, type Path, useController } from 'react-hook-form'
import { Pressable, type TextInputProps, View } from 'react-native'
import { Input } from '@/components/ui/input'
import { Text } from '@/components/ui/text'
import { useThemeColors } from '@/hooks/useThemeColors'

type FieldProps<T extends FieldValues> = {
  control: Control<T>
  name: Path<T>
  label: string
  /** Nội dung đặt cạnh nhãn, vd link "Quên mật khẩu?" */
  labelAside?: ReactNode
  /** Nội dung dưới ô nhập, luôn hiện (vd thanh độ mạnh mật khẩu) */
  below?: ReactNode
} & Omit<TextInputProps, 'value' | 'onChangeText' | 'onBlur' | 'secureTextEntry'>

function FieldShell({
  label,
  labelAside,
  below,
  error,
  children,
}: {
  label: string
  labelAside?: ReactNode
  below?: ReactNode
  error?: string
  children: ReactNode
}) {
  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between gap-2">
        <Text className="font-sans-medium text-sm">{label}</Text>
        {labelAside}
      </View>
      {children}
      {below}
      {error && <Text className="text-sm text-destructive">{error}</Text>}
    </View>
  )
}

export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  labelAside,
  below,
  ...inputProps
}: FieldProps<T>) {
  // Tách field ra từng biến: React Compiler coi mọi thuộc tính của object có `ref` là đọc ref
  const {
    field: { ref, value, onChange, onBlur },
    fieldState,
  } = useController({ control, name })
  const error = fieldState.error?.message
  return (
    <FieldShell label={label} labelAside={labelAside} below={below} error={error}>
      <Input
        ref={ref}
        value={value as string}
        onChangeText={onChange}
        onBlur={onBlur}
        invalid={!!error}
        accessibilityLabel={label}
        accessibilityHint={error}
        {...inputProps}
      />
    </FieldShell>
  )
}

/** Ô mật khẩu có nút hiện/ẩn */
export function PasswordField<T extends FieldValues>({
  control,
  name,
  label,
  labelAside,
  below,
  ...inputProps
}: FieldProps<T>) {
  // Tách field ra từng biến: React Compiler coi mọi thuộc tính của object có `ref` là đọc ref
  const {
    field: { ref, value, onChange, onBlur },
    fieldState,
  } = useController({ control, name })
  const error = fieldState.error?.message
  const [visible, setVisible] = useState(false)
  const colors = useThemeColors()
  const Icon = visible ? EyeOff : Eye
  return (
    <FieldShell label={label} labelAside={labelAside} below={below} error={error}>
      <View className="justify-center">
        <Input
          ref={ref}
          value={value as string}
          onChangeText={onChange}
          onBlur={onBlur}
          invalid={!!error}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={label}
          accessibilityHint={error}
          className="pr-12"
          {...inputProps}
        />
        <Pressable
          role="button"
          aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          aria-pressed={visible}
          onPress={() => setVisible((v) => !v)}
          hitSlop={6}
          className="absolute right-0 h-12 w-12 items-center justify-center"
        >
          <Icon size={18} color={colors.mutedForeground} />
        </Pressable>
      </View>
    </FieldShell>
  )
}
