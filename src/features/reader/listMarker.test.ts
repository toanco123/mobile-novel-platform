import { listMarker, toAlpha, toRoman } from './listMarker'

describe('listMarker', () => {
  it('mặc định: chấm tròn hoặc số', () => {
    expect(listMarker(undefined, false, 0)).toBe('•')
    expect(listMarker(undefined, true, 0)).toBe('1.')
    expect(listMarker(undefined, true, 9)).toBe('10.')
  })

  it('các kiểu chấm', () => {
    expect(listMarker('circle', false, 3)).toBe('◦')
    expect(listMarker('square', false, 0)).toBe('▪')
  })

  it('chữ cái và số La Mã', () => {
    expect(listMarker('lower-alpha', true, 0)).toBe('a.')
    expect(listMarker('lower-alpha', true, 25)).toBe('z.')
    expect(listMarker('lower-roman', true, 3)).toBe('iv.')
    expect(listMarker('upper-roman', true, 8)).toBe('IX.')
  })
})

describe('toAlpha', () => {
  it('như lower-alpha của CSS', () => {
    expect([1, 2, 26, 27, 28, 52, 53, 702, 703].map(toAlpha)).toEqual([
      'a',
      'b',
      'z',
      'aa',
      'ab',
      'az',
      'ba',
      'zz',
      'aaa',
    ])
  })
})

describe('toRoman', () => {
  it('đổi đúng các mốc', () => {
    expect([1, 4, 9, 14, 40, 90, 400, 1994, 2026, 3999].map(toRoman)).toEqual([
      'i',
      'iv',
      'ix',
      'xiv',
      'xl',
      'xc',
      'cd',
      'mcmxciv',
      'mmxxvi',
      'mmmcmxcix',
    ])
  })

  it('ngoài 1–3999 thì dùng số thường', () => {
    expect(toRoman(0)).toBe('0')
    expect(toRoman(4000)).toBe('4000')
  })
})
