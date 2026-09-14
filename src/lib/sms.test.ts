import { analyzeMessage, calculateSmsSegments, countCharacters, findNonGsmCharacters } from '@/lib/sms'

describe('calculateSmsSegments', () => {
  it.each([
    [0, 0],
    [1, 1],
    [159, 1],
    [160, 1],
    [161, 2],
    [320, 2],
    [321, 3],
    [480, 3],
    [481, 4],
    [640, 4],
  ])('%i characters → %i SMS', (length, expected) => {
    expect(calculateSmsSegments('a'.repeat(length))).toBe(expected)
  })

  it('counts newlines and spaces as characters', () => {
    expect(calculateSmsSegments(`${'a'.repeat(159)}\n`)).toBe(1)
    expect(calculateSmsSegments(`${'a'.repeat(160)} `)).toBe(2)
  })
})

describe('countCharacters', () => {
  it('counts an emoji as one character, not two UTF-16 units', () => {
    expect('👋'.length).toBe(2)
    expect(countCharacters('Hi 👋')).toBe(4)
  })
})

describe('findNonGsmCharacters', () => {
  it('returns nothing for plain GSM text', () => {
    expect(findNonGsmCharacters('Sale ends Friday! 20% off @ boakyeyiadom.com.gh {VIP} Pay with MoMo')).toEqual([])
  })

  it('flags emoji, smart quotes and em dashes once each', () => {
    expect(findNonGsmCharacters('It’s back — 🧶🧶')).toEqual(['’', '—', '🧶'])
  })
})

describe('analyzeMessage', () => {
  it('reports a full budget for an empty message', () => {
    expect(analyzeMessage('')).toMatchObject({ characters: 0, segments: 0, remainingInSegment: 160 })
  })

  it('reports characters left in the current SMS', () => {
    expect(analyzeMessage('a'.repeat(150)).remainingInSegment).toBe(10)
    expect(analyzeMessage('a'.repeat(160)).remainingInSegment).toBe(0)
    expect(analyzeMessage('a'.repeat(161)).remainingInSegment).toBe(159)
  })

  it('flags messages over the 4-SMS limit', () => {
    expect(analyzeMessage('a'.repeat(640)).isOverLimit).toBe(false)
    expect(analyzeMessage('a'.repeat(641)).isOverLimit).toBe(true)
  })
})
