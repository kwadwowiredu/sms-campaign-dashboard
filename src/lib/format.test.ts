import { formatCompactNumber, formatMoney, formatPhone, formatSentAt } from '@/lib/format'

describe('formatMoney', () => {
  it('formats cedis, keeping sub-cedi precision and rounding larger amounts to pesewas', () => {
    expect(formatMoney(35_000)).toBe('GH₵0.035')
    expect(formatMoney(665_000)).toBe('GH₵0.665')
    expect(formatMoney(87_221_000)).toBe('GH₵87.22')
    expect(formatMoney(2_500_000_000)).toBe('GH₵2,500.00')
    expect(formatMoney(0)).toBe('GH₵0.00')
  })
})

describe('formatCompactNumber', () => {
  it('stays exact below 10,000 and compacts above', () => {
    expect(formatCompactNumber(1_264)).toBe('1,264')
    expect(formatCompactNumber(12_480)).toBe('12.5K')
  })
})

describe('formatPhone', () => {
  it('formats Ghanaian E.164 numbers the local way and leaves others untouched', () => {
    expect(formatPhone('+233244908132')).toBe('024 490 8132')
    expect(formatPhone('+233509241785')).toBe('050 924 1785')
    expect(formatPhone('+233302771264')).toBe('030 277 1264')
    expect(formatPhone('+2348031234567')).toBe('+2348031234567')
  })
})

describe('formatSentAt', () => {
  it('shows "Today" for same-day messages', () => {
    const now = new Date(2026, 8, 13, 18, 0)
    expect(formatSentAt(new Date(2026, 8, 13, 9, 5).toISOString(), now)).toBe('Today, 9:05 am')
    expect(formatSentAt(new Date(2026, 8, 12, 13, 0).toISOString(), now)).toMatch(/^12 Sept?, 1:00 pm$/)
  })
})
