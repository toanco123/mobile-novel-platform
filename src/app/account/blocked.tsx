import { Alert, FlatList, Pressable, View } from 'react-native'
import { toast } from 'sonner-native'
import { SECTION_ERROR } from '@/components/common/SectionHeading'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import { UserAvatar } from '@/features/auth/components/UserAvatar'
import { authErrorMessage } from '@/features/auth/hooks'
import type { BlockedUser } from '@/features/blocks/api'
import { useBlockedUsers, useUnblockUser } from '@/features/blocks/hooks'
import { formatRelativeTime } from '@/lib/format'

/** Người đã chặn (riêng của app): bỏ chặn thì thấy lại bình luận của người đó */
export default function BlockedUsersScreen() {
  const { data, isPending, isError } = useBlockedUsers()

  return (
    <FlatList
      data={data ?? []}
      keyExtractor={(item) => item.user.id}
      className="flex-1 bg-background"
      contentContainerClassName="px-4 pt-2 pb-12"
      ListHeaderComponent={
        <Text className="mb-4 text-sm text-muted-foreground">
          Bạn không thấy bình luận và trả lời của những người này. Họ không được báo khi bị chặn.
        </Text>
      }
      ListEmptyComponent={
        isError ? (
          <Text className="text-sm text-muted-foreground">{SECTION_ERROR}</Text>
        ) : isPending ? (
          <View className="gap-3">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </View>
        ) : (
          <View className="rounded-xl border border-dashed border-border p-6">
            <Text className="text-center text-sm text-muted-foreground">
              Bạn chưa chặn ai. Muốn chặn một người, bấm "Chặn" dưới bình luận của họ.
            </Text>
          </View>
        )
      }
      ItemSeparatorComponent={() => <View className="h-px bg-border" />}
      renderItem={({ item }) => <BlockedRow item={item} />}
    />
  )
}

function BlockedRow({ item }: { item: BlockedUser }) {
  const unblock = useUnblockUser()
  const name = item.user.displayName
  const confirm = () =>
    Alert.alert(`Bỏ chặn ${name}?`, 'Bạn sẽ thấy lại bình luận và trả lời của người này.', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Bỏ chặn',
        onPress: () =>
          unblock.mutate(item.user.id, {
            onSuccess: () => toast.success(`Đã bỏ chặn ${name}`),
            onError: (error) => toast.error(authErrorMessage(error)),
          }),
      },
    ])

  return (
    <View className="flex-row items-center gap-3 py-3">
      <UserAvatar user={item.user} size={40} />
      <View className="flex-1">
        <Text numberOfLines={1} className="font-sans-medium">
          {name}
        </Text>
        <Text className="text-xs text-muted-foreground">
          {`Đã chặn ${formatRelativeTime(item.blockedAt)}`}
        </Text>
      </View>
      <Pressable
        role="button"
        aria-label={`Bỏ chặn ${name}`}
        disabled={unblock.isPending}
        onPress={confirm}
        className="h-9 justify-center rounded-full border border-border px-4 active:bg-muted"
      >
        <Text className="font-sans-medium text-sm">Bỏ chặn</Text>
      </Pressable>
    </View>
  )
}
