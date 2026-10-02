// Như web: src/features/reader/readerOptions.ts. Khác web: màu nền là theme phụ của Uniwind (global.css)
// thay class reader-tone-*; không có độ rộng khung chữ và tốc độ (tự cuộn, nghe truyện: bước 5).
import type { ThemeName } from 'uniwind'
import type { ReaderFont, ReaderTone } from './useReaderSettings'

/** Theme phụ cho vùng đọc; null: theo theme sáng/tối của app */
export const toneTheme: Record<ReaderTone, ThemeName | null> = {
  theme: null,
  white: 'reader-white',
  paper: 'reader-paper',
  gray: 'reader-gray',
  black: 'reader-black',
}

/** Màu nền tối: thanh trạng thái chữ sáng */
export const darkTones: ReadonlySet<ReaderTone> = new Set(['gray', 'black'])

export const tones: { value: ReaderTone; label: string }[] = [
  { value: 'theme', label: 'Theo app' },
  { value: 'white', label: 'Trắng' },
  { value: 'paper', label: 'Giấy vàng' },
  { value: 'gray', label: 'Xám' },
  { value: 'black', label: 'Đen' },
]

/** Họ chữ theo độ đậm/nghiêng (React Native không tự chọn file theo độ đậm) */
type FontFaces = { regular: string; italic: string; bold: string; boldItalic: string }

export const fonts: { value: ReaderFont; label: string; faces: FontFaces }[] = [
  {
    value: 'serif',
    label: 'Có chân',
    faces: {
      regular: 'font-reading',
      italic: 'font-reading-italic',
      bold: 'font-reading-bold',
      boldItalic: 'font-reading-bold-italic',
    },
  },
  {
    value: 'sans',
    label: 'Không chân',
    // Chữ đậm của web là font-semibold
    faces: {
      regular: 'font-sans',
      italic: 'font-sans-italic',
      bold: 'font-sans-semibold',
      boldItalic: 'font-sans-semibold-italic',
    },
  },
]

export const fontFaces = (font: ReaderFont) =>
  (fonts.find((f) => f.value === font) ?? fonts[0]).faces

/** Họ chữ của một đoạn chữ có định dạng */
export function faceOf(faces: FontFaces, { bold, italic }: { bold?: boolean; italic?: boolean }) {
  if (bold) return italic ? faces.boldItalic : faces.bold
  return italic ? faces.italic : faces.regular
}

/** Tốc độ dạng "1,25×" (thanh nghe truyện và thanh tự cuộn); như web, không dùng toLocaleString (Hermes) */
export const rateLabel = (rate: number) => `${String(rate).replace('.', ',')}×`
