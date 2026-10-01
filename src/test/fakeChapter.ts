// Chép từ web: fakeChapter trong src/test/offline.ts (phần giả mất mạng của web dùng DOM, app không cần)
import type { ChapterContent } from '@/types/chapter'

/** Chương giả (chương sau là number + 1, tới chương `last`) */
export function fakeChapter(
  slug: string,
  number: number,
  { title = 'Mùa Hạ', last = 1000 }: { title?: string; last?: number } = {},
): ChapterContent {
  return {
    story: {
      slug,
      title,
      author: { slug: 'tac-gia-u1', name: 'Tác giả' },
      status: 'ongoing',
      chapterCount: last,
      coverUrl: null,
      visibility: 'published',
    },
    number,
    title: `Chương ${number}`,
    content: `<p>Nội dung chương ${number}.</p>`,
    publishedAt: '2026-09-01T00:00:00.000Z',
    prev: number > 1 ? { number: number - 1, title: `Chương ${number - 1}` } : null,
    next: number < last ? { number: number + 1, title: `Chương ${number + 1}` } : null,
  }
}
