import type { ListStyle } from '@/features/chapters/richText'

const BULLETS = { disc: '•', circle: '◦', square: '▪' } as const

const ROMAN: [number, string][] = [
  [1000, 'm'],
  [900, 'cm'],
  [500, 'd'],
  [400, 'cd'],
  [100, 'c'],
  [90, 'xc'],
  [50, 'l'],
  [40, 'xl'],
  [10, 'x'],
  [9, 'ix'],
  [5, 'v'],
  [4, 'iv'],
  [1, 'i'],
]

/** Số La Mã thường; như CSS, ngoài khoảng 1–3999 thì dùng số thường */
export function toRoman(n: number) {
  if (n < 1 || n > 3999) return String(n)
  let rest = n
  let out = ''
  for (const [value, symbol] of ROMAN) {
    while (rest >= value) {
      out += symbol
      rest -= value
    }
  }
  return out
}

/** a, b, ..., z, aa, ab... như lower-alpha của CSS */
export function toAlpha(n: number) {
  let rest = n
  let out = ''
  while (rest > 0) {
    rest -= 1
    out = String.fromCharCode(97 + (rest % 26)) + out
    rest = Math.floor(rest / 26)
  }
  return out
}

/**
 * Dấu đầu dòng của mục thứ `index` (từ 0), thay list-style của web (React Native không có).
 * Không có style: chấm tròn hoặc 1. 2. 3. như mặc định của trình duyệt.
 */
export function listMarker(style: ListStyle | undefined, ordered: boolean, index: number) {
  const kind = style ?? (ordered ? 'decimal' : 'disc')
  const n = index + 1
  switch (kind) {
    case 'disc':
    case 'circle':
    case 'square':
      return BULLETS[kind]
    case 'decimal':
      return `${n}.`
    case 'lower-alpha':
      return `${toAlpha(n)}.`
    case 'lower-roman':
      return `${toRoman(n)}.`
    case 'upper-roman':
      return `${toRoman(n).toUpperCase()}.`
  }
}
