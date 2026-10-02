import { router } from 'expo-router'
import { View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import { TextLink } from '@/components/ui/text-link'
import { useSession } from '@/features/auth/hooks'
import type { Comment } from '@/types/comment'
import { useComments, useMyRating, useRateStory, useRatingSummary } from '../hooks'
import { CommentForm } from './CommentForm'
import { CommentItem } from './CommentItem'
import { RatingSummary } from './RatingSummary'
import { StarRatingInput } from './StarRatingInput'

type Props = {
  slug: string
  /** Có số: bình luận của chương đó (không có phần chấm điểm) */
  chapter?: number | null
}

const toLogin = () => router.push('/login')

/** Như CommentsSection của web: chấm điểm (của truyện), ô viết, danh sách bình luận tải thêm */
export function CommentsSection({ slug, chapter = null }: Props) {
  const { data: user } = useSession()
  const comments = useComments(slug, chapter)
  const items = uniqueById(comments.data?.pages.flatMap((p) => p.items) ?? [])

  return (
    <View className="gap-8">
      {chapter === null && <RatingPanel slug={slug} signedIn={!!user} />}

      {user ? (
        <CommentForm slug={slug} user={user} chapter={chapter} />
      ) : (
        <View className="rounded-xl border border-dashed border-border p-5">
          <Text className="text-center text-sm text-muted-foreground">
            <TextLink onPress={toLogin}>Đăng nhập</TextLink> để viết bình luận.
          </Text>
        </View>
      )}

      {comments.isError ? (
        <Text className="text-sm text-muted-foreground">
          Không tải được bình luận. Kéo xuống để tải lại.
        </Text>
      ) : comments.isPending ? (
        <View className="gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </View>
      ) : items.length === 0 ? (
        <Text className="text-sm text-muted-foreground">
          Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ cảm nhận.
        </Text>
      ) : (
        <View>
          <View
            aria-label={chapter === null ? 'Danh sách bình luận' : `Bình luận chương ${chapter}`}
          >
            {items.map((c, i) => (
              <View key={c.id} className={i > 0 ? 'border-t border-border' : undefined}>
                <CommentItem comment={c} viewer={user ?? null} />
              </View>
            ))}
          </View>
          {comments.hasNextPage && (
            <Button
              variant="outline"
              onPress={() => comments.fetchNextPage()}
              pending={comments.isFetchingNextPage}
              pendingLabel="Đang tải…"
              className="mt-4 h-10 rounded-full"
              textClassName="text-sm"
            >
              Xem thêm bình luận
            </Button>
          )}
        </View>
      )}
    </View>
  )
}

/**
 * Như web: bỏ bình luận lặp lại, giữ lần xuất hiện đầu (trang sau lấy theo vị trí: có người bình
 * luận thêm giữa hai lần tải thì trang sau mở đầu bằng bình luận cuối của trang trước)
 */
function uniqueById(comments: Comment[]) {
  const seen = new Set<string>()
  return comments.filter((c) => {
    if (seen.has(c.id)) return false
    seen.add(c.id)
    return true
  })
}

function RatingPanel({ slug, signedIn }: { slug: string; signedIn: boolean }) {
  const summary = useRatingSummary(slug)
  return (
    <View className="gap-5 rounded-xl border border-border bg-card/50 p-5">
      {summary.data ? (
        <RatingSummary summary={summary.data} />
      ) : (
        <Skeleton className="h-24 rounded-lg" />
      )}
      <View className="border-t border-border pt-5">
        <Text className="mb-2 font-sans-medium text-sm">Đánh giá của bạn</Text>
        {signedIn ? (
          <MyRating slug={slug} />
        ) : (
          <Text className="text-sm text-muted-foreground">
            <TextLink onPress={toLogin}>Đăng nhập</TextLink> để chấm điểm truyện.
          </Text>
        )}
      </View>
    </View>
  )
}

function MyRating({ slug }: { slug: string }) {
  const mine = useMyRating(slug)
  const rate = useRateStory(slug)
  const value = rate.isPending ? rate.variables : (mine.data ?? null)

  return (
    <View>
      <StarRatingInput value={value} onChange={(s) => rate.mutate(s)} disabled={mine.isPending} />
      <Text role="status" className="mt-1.5 h-4 text-xs text-muted-foreground">
        {rate.isSuccess && `Đã lưu: ${rate.data} sao. Cảm ơn bạn!`}
        {rate.isError && (
          <Text className="text-xs text-destructive">Chưa lưu được điểm. Thử lại nhé.</Text>
        )}
      </Text>
    </View>
  )
}
