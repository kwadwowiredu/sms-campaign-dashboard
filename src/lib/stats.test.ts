import { SMS_RULES } from '@/config'
import { availableBalanceMicros, campaignCostMicros } from '@/lib/billing'
import { computeStats } from '@/lib/stats'
import { makeMessage } from '@/test/factories'

const PRICE = SMS_RULES.pricePerSmsMicros // GH₵0.035

describe('computeStats', () => {
  it('returns zeros for no messages without dividing by zero', () => {
    expect(computeStats([])).toEqual({
      totalSent: 0,
      delivered: 0,
      pending: 0,
      failed: 0,
      deliveryRate: 0,
      billedSegments: 0,
      totalCostMicros: 0,
    })
  })

  it('counts every status and bills delivered and pending, not failed', () => {
    const stats = computeStats([
      makeMessage({ status: 'Delivered', segments: 1 }),
      makeMessage({ status: 'Delivered', segments: 2 }),
      makeMessage({ status: 'Pending', segments: 1 }),
      makeMessage({ status: 'Failed', segments: 3 }),
    ])

    expect(stats).toMatchObject({ totalSent: 4, delivered: 2, pending: 1, failed: 1, deliveryRate: 0.5 })
    expect(stats.billedSegments).toBe(4)
    expect(stats.totalCostMicros).toBe(4 * PRICE)
  })

  it('keeps money exact over many messages (no float drift)', () => {
    const messages = Array.from({ length: 1_000 }, () => makeMessage({ segments: 1 }))
    expect(computeStats(messages).totalCostMicros).toBe(35_000_000) // exactly GH₵35.00
  })
})

describe('billing', () => {
  it('prices a campaign as recipients × SMS parts × unit price', () => {
    expect(campaignCostMicros(1_248, 2)).toBe(1_248 * 2 * PRICE)
    expect(campaignCostMicros(1_248, 0)).toBe(0)
  })

  it('derives balance from credits minus billed messages', () => {
    const account = { merchantName: 'Test', creditMicros: 1_000_000 }
    const messages = [
      makeMessage({ status: 'Delivered', segments: 2 }),
      makeMessage({ status: 'Failed', segments: 2 }),
    ]
    expect(availableBalanceMicros(account, messages)).toBe(1_000_000 - 2 * PRICE)
  })
})
