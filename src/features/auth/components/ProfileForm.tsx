import { zodResolver } from '@hookform/resolvers/zod'
import * as ImagePicker from 'expo-image-picker'
import { ImageUp } from 'lucide-react-native'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { useThemeColors } from '@/hooks/useThemeColors'
import { CoverError, prepareAvatar } from '@/lib/image'
import type { User } from '@/types/user'
import { authErrorMessage, useUpdateProfile } from '../hooks'
import { profileSchema, type ProfileValues } from '../schemas'
import { FormAlert } from './FormAlert'
import { TextField } from './FormFields'
import { UserAvatar } from './UserAvatar'

export function ProfileForm({ user }: { user: User }) {
  const update = useUpdateProfile()
  const colors = useThemeColors()
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const { control, handleSubmit, reset } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    mode: 'onTouched',
    defaultValues: { displayName: user.displayName },
  })
  const displayName = useWatch({ control, name: 'displayName' })

  async function pickAvatar() {
    setAvatarError(null)
    // Cắt vuông ngay trong bộ chọn ảnh; prepareAvatar vẫn cắt giữa phòng khi ảnh chưa vuông
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    })
    if (result.canceled) return
    setProcessing(true)
    try {
      setAvatarUrl(await prepareAvatar(result.assets[0].uri))
    } catch (e) {
      setAvatarError(e instanceof CoverError ? e.message : 'Không xử lý được ảnh này.')
    } finally {
      setProcessing(false)
    }
  }

  const onSubmit = handleSubmit(({ displayName }) =>
    update.mutate(
      { displayName, avatarUrl },
      { onSuccess: (saved) => reset({ displayName: saved.displayName }) },
    ),
  )

  return (
    <View className="gap-6">
      {update.isError && <FormAlert>{authErrorMessage(update.error)}</FormAlert>}
      {update.isSuccess && <FormAlert variant="success">Đã lưu hồ sơ.</FormAlert>}

      <View className="items-center gap-3">
        <UserAvatar user={{ displayName: displayName || user.displayName, avatarUrl }} size={96} />
        <View className="flex-row gap-2">
          <Button
            variant="outline"
            icon={<ImageUp size={16} color={colors.foreground} />}
            pending={processing}
            pendingLabel="Đang xử lý…"
            onPress={pickAvatar}
            className="h-10 rounded-full"
            textClassName="text-sm"
          >
            Đổi ảnh đại diện
          </Button>
          {avatarUrl && (
            <Button
              variant="ghost"
              onPress={() => setAvatarUrl(null)}
              className="h-10 rounded-full"
              textClassName="text-sm text-muted-foreground"
            >
              Bỏ ảnh
            </Button>
          )}
        </View>
        <Text className="text-center text-xs text-muted-foreground">
          Ảnh được cắt vuông ở giữa, hiện ở bình luận và truyện bạn đăng.
        </Text>
        {avatarError && (
          <Text role="alert" className="text-sm text-destructive">
            {avatarError}
          </Text>
        )}
      </View>

      <TextField
        control={control}
        name="displayName"
        label="Tên hiển thị"
        autoComplete="nickname"
        textContentType="nickname"
        returnKeyType="done"
      />

      <View className="gap-2">
        <Text className="font-sans-medium text-sm">Email</Text>
        <Text className="text-muted-foreground">{user.email}</Text>
      </View>

      <Button pending={update.isPending} pendingLabel="Đang lưu…" onPress={() => onSubmit()}>
        Lưu hồ sơ
      </Button>
    </View>
  )
}
