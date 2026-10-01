import { offsetForProgress, progressOf } from './progress'

const article = { top: 100, height: 2100, viewport: 800 }

describe('progressOf', () => {
  it('0 khi đầu chương chưa lên tới mép trên, 1 khi cuối chương chạm mép dưới', () => {
    expect(progressOf(article, 0)).toBe(0)
    expect(progressOf(article, 100)).toBe(0)
    expect(progressOf(article, 750)).toBe(0.5)
    expect(progressOf(article, 1400)).toBe(1)
    expect(progressOf(article, 5000)).toBe(1)
  })

  it('chương ngắn hơn màn hình: 1 khi đã cuộn qua đầu chương', () => {
    const short = { top: 100, height: 500, viewport: 800 }
    expect(progressOf(short, 50)).toBe(0)
    expect(progressOf(short, 100)).toBe(1)
  })
})

describe('offsetForProgress', () => {
  it('ngược với progressOf', () => {
    for (const p of [0, 0.25, 0.4, 1]) {
      expect(progressOf(article, offsetForProgress(article, p))).toBeCloseTo(p)
    }
  })

  it('chương ngắn hơn màn hình: cuộn tới đầu chương', () => {
    expect(offsetForProgress({ top: 100, height: 500, viewport: 800 }, 0.7)).toBe(100)
  })
})
