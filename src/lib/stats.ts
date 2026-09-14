import { billedCostMicros, isBillable } from '@/lib/billing'
import type { DashboardStats, Message } from '@/types'

/** Every stat is derived from the message list, so cards and table can never disagree. */
export function computeStats(messages: Message[]): DashboardStats {
  const stats: DashboardStats = {
    totalSent: messages.length,
    delivered: 0,
    pending: 0,
    failed: 0,
    deliveryRate: 0,
    billedSegments: 0,
    totalCostMicros: 0,
  }

  for (const message of messages) {
    if (message.status === 'Delivered') stats.delivered++
    else if (message.status === 'Pending') stats.pending++
    else stats.failed++

    if (isBillable(message.status)) stats.billedSegments += message.segments
    stats.totalCostMicros += billedCostMicros(message)
  }

  stats.deliveryRate = stats.totalSent === 0 ? 0 : stats.delivered / stats.totalSent
  return stats
}
