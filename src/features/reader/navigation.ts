import { router } from 'expo-router'
import { links } from '@/lib/links'

/**
 * Sang chương khác trong trang đọc: thay màn hiện tại (không chồng thêm) để nút quay lại về thẳng chỗ
 * trước khi vào đọc, không lùi qua từng chương đã đọc
 */
export const goToChapter = (slug: string, number: number) =>
  router.replace(links.chapter(slug, number))
