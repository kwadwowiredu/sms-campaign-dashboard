import { SMS_RULES } from '@/config'
import { computeStats } from '@/lib/stats'
import {
  ApiError,
  fetchDashboard,
  resetMockApi,
  sendCampaign,
  subscribeToDeliveryReports,
} from '@/services/campaign-api'
import type { StatusUpdate } from '@/types'

beforeEach(() => {
  vi.useFakeTimers()
  resetMockApi()
})

afterEach(() => {
  vi.useRealTimers()
})

async function settle<T>(promise: Promise<T>): Promise<T> {
  await vi.advanceTimersByTimeAsync(1_000)
  return promise
}

describe('mock campaign API', () => {
  it('derives segments and cost from seed message bodies', async () => {
    const { messages } = await settle(fetchDashboard())
    const stats = computeStats(messages)

    expect(stats).toMatchObject({ totalSent: 18, delivered: 12, pending: 2, failed: 4 })
    // VIP Early Access body is over 160 chars, so those messages are 2 SMS each.
    expect(messages.find((message) => message.campaignName === 'VIP Early Access')?.segments).toBe(2)
    expect(stats.totalCostMicros).toBe(stats.billedSegments * SMS_RULES.pricePerSmsMicros)
    expect(messages.every((message) => /^\+233\d{9}$/.test(message.recipientPhone))).toBe(true)
  })

  it('creates one pending message per opted-in recipient', async () => {
    const { audiences } = await settle(fetchDashboard())
    const vip = audiences.find((audience) => audience.id === 'vip')!

    const sent = await settle(
      sendCampaign({ name: ' VIP Preview ', audienceId: 'vip', body: 'a'.repeat(200) }),
    )

    expect(sent).toHaveLength(vip.size)
    expect(sent.every((message) => message.status === 'Pending' && message.segments === 2)).toBe(true)
    expect(sent[0].campaignName).toBe('VIP Preview')
    expect(new Set(sent.map((message) => message.recipientPhone)).size).toBe(sent.length)
  })

  it('re-validates on the server and rejects invalid campaigns', async () => {
    const request = sendCampaign({ name: '', audienceId: 'nope', body: '' })
    const assertion = expect(request).rejects.toBeInstanceOf(ApiError)
    await vi.advanceTimersByTimeAsync(1_000)
    await assertion
  })

  it('resolves pending messages through delivery reports', async () => {
    const received: StatusUpdate[] = []
    const unsubscribe = subscribeToDeliveryReports((updates) => received.push(...updates))

    const sent = await settle(sendCampaign({ name: 'Flash', audienceId: 'abandoned-cart', body: 'Hi' }))
    await vi.advanceTimersByTimeAsync(60_000)
    unsubscribe()

    expect(received).toHaveLength(sent.length)
    expect(received.every((update) => update.status !== 'Pending')).toBe(true)

    const { messages } = await settle(fetchDashboard())
    const sentIds = new Set(sent.map((message) => message.id))
    expect(messages.filter((message) => sentIds.has(message.id) && message.status === 'Pending')).toEqual([])
  })
})
