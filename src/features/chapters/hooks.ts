// Chép từ web: src/features/chapters/hooks.ts (cùng query key). Khác web: chưa có kho chương trên máy
// (features/offline, bước 3) nên trang đọc lấy chương thẳng từ api.
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
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

/** Một chương cho trang đọc */
export const useChapter = (slug: string, number: number) =>
  useQuery({
    queryKey: chapterKeys.detail(slug, number),
    queryFn: () => api.getChapter(slug, number),
  })

/** Tính 1 lượt đọc khi mở chương */
export function useRecordChapterView(slug: string, number: number | undefined) {
  useEffect(() => {
    if (number !== undefined) void api.recordChapterView(slug, number)
  }, [slug, number])
}
