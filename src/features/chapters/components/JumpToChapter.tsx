import { router } from 'expo-router'
import { useState } from 'react'
import { View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Text } from '@/components/ui/text'
import { links } from '@/lib/links'

/** Như JumpToChapter của web: nhập số chương rồi mở trang đọc */
export function JumpToChapter({ slug, max }: { slug: string; max: number }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  function submit() {
    const n = Number(value)
    if (!value || !Number.isInteger(n) || n < 1 || n > max) {
      setError(`Nhập số chương từ 1 đến ${max}`)
      return
    }
    router.push(links.chapter(slug, n))
  }

  return (
    <View className="items-end gap-1">
      <View className="flex-row items-center gap-1.5">
        <Input
          aria-label="Đi tới chương"
          keyboardType="number-pad"
          returnKeyType="go"
          placeholder="Số chương"
          value={value}
          onChangeText={(text) => {
            setValue(text.replace(/\D/g, ''))
            setError(null)
          }}
          onSubmitEditing={submit}
          invalid={!!error}
          className="h-9 w-28 rounded-full px-3.5 text-sm"
        />
        <Button
          variant="outline"
          onPress={submit}
          className="h-9 rounded-full px-4"
          textClassName="text-sm"
        >
          Đi tới
        </Button>
      </View>
      {error && (
        <Text role="alert" className="text-xs text-destructive">
          {error}
        </Text>
      )}
    </View>
  )
}
