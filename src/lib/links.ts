import type { Href } from 'expo-router'

/**
 * Đường dẫn trong app cho `router.push` / `Link`. Cùng dạng URL với `paths` (`src/lib/routes.ts`, chép
 * từ web) để deep link khớp link web, nhưng viết theo kiểu chặt của Expo Router (typed routes).
 * `paths` vẫn dùng cho trang mở trên web (`openWebPage`).
 */
export const links = {
  story: (slug: string) => ({ pathname: '/story/[slug]', params: { slug } }) satisfies Href,
  /** resume: vị trí đã đọc trong chương (0–1) để trang đọc cuộn tới, thay state "Đọc tiếp" của web */
  chapter: (slug: string, number: number, resume?: number) =>
    ({
      pathname: '/story/[slug]/[chapter]',
      params: {
        slug,
        chapter: `chapter-${number}`,
        ...(resume !== undefined && { resume: String(resume) }),
      },
    }) satisfies Href,
  genres: '/genres' as const satisfies Href,
  genre: (slug: string) => ({ pathname: '/genres/[slug]', params: { slug } }) satisfies Href,
  ranking: '/ranking' as const satisfies Href,
  /** Tìm kiếm (/search?q= như web); bỏ trống q thì mở ô tìm */
  search: (q?: string) => ({ pathname: '/search', params: q ? { q } : {} }) satisfies Href,
  /** Danh sách truyện theo loại như /list/:type của web */
  list: (type: ListType) => ({ pathname: '/list/[type]', params: { type } }) satisfies Href,
}

export type ListType = 'latest' | 'ongoing' | 'completed'
