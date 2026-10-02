// Như test của web (src/features/reader/autoscroll/pace.test.ts); ca đo bố cục viết lại theo số đo
import { estimatedPixelsPerWord, pixelsPerSecond, pixelsPerWord, stepSpeed } from './pace'
import { AUTO_SCROLL_SPEEDS } from './useAutoScrollSettings'

vi.mock('./useAutoScrollSettings', () => ({
  AUTO_SCROLL_SPEEDS: [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3],
}))

test('1× là đọc kịp 220 chữ/phút; tốc độ gấp đôi thì cuộn nhanh gấp đôi', () => {
  expect(pixelsPerSecond(3, 1)).toBeCloseTo(11) // 3 px/chữ × 220 chữ/phút = 11 px/giây
  expect(pixelsPerSecond(3, 2)).toBeCloseTo(22)
})

test('đổi tốc độ theo từng nấc, dừng ở hai đầu', () => {
  expect(stepSpeed(1, 1)).toBe(1.25)
  expect(stepSpeed(1, -1)).toBe(0.75)
  expect(stepSpeed(AUTO_SCROLL_SPEEDS[0], -1)).toBe(AUTO_SCROLL_SPEEDS[0])
  expect(stepSpeed(3, 1)).toBe(3)
  // Giá trị lạ (dữ liệu cũ) thì tính từ 1×
  expect(stepSpeed(1.1, 1)).toBe(1.25)
})

test('số px mỗi chữ đo từ bố cục; không đo được thì dùng ước lượng', () => {
  expect(pixelsPerWord(60, 6, 7)).toBe(10)
  expect(pixelsPerWord(0, 6, 7)).toBe(7)
  expect(pixelsPerWord(60, 0, 7)).toBe(7)
  expect(estimatedPixelsPerWord(20, 2)).toBe(4)
})
