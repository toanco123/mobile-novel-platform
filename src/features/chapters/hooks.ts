// Chép từ web: src/features/chapters/hooks.ts (cùng query key). Phần trang đọc (useChapter...) thêm
// ở 2c; đọc qua kho trên máy (features/offline) thêm ở bước 3.
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { ChapterOrder } from '@/types/chapter'
import * as api from './api'

export const chapterKeys = {
  list: (slug: string, page: number, order: ChapterOrder) =>
    ['chapters', slug, 'list', page, order] as const,
  detail: (slug: string, number: number) => ['chapters', slug, 'detail', number] as const,
  countFrom: (slug: string, from: number) => ['chapters', slug, 'count-from', from] as const,
}

export const useChapterList = (slug: string, page: number, order: ChapterOrder) =>
  useQuery({
    queryKey: chapterKeys.list(slug, page, order),
    queryFn: () => api.getChapterList(slug, { page, order }),
    placeholderData: keepPreviousData,
  })
