import { messageCostMicros } from '@/lib/billing'
import type { Message } from '@/types'

let sequence = 0

export function makeMessage(overrides: Partial<Message> = {}): Message {
  sequence++
  const segments = overrides.segments ?? 1
  return {
    id: `msg_test_${sequence}`,
    campaignId: 'cmp_test',
    campaignName: 'Test Campaign',
    recipientName: 'Akosua Mensah',
    recipientPhone: '+233241234508',
    body: 'Hello from the test suite',
    status: 'Delivered',
    sentAt: '2026-09-12T13:00:00.000Z',
    ...overrides,
    segments,
    costMicros: overrides.costMicros ?? messageCostMicros(segments),
  }
}
