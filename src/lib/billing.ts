import { SMS_RULES } from '@/config'
import type { Account, Message, MessageStatus, Micros } from '@/types'

export function messageCostMicros(
  segments: number,
  pricePerSmsMicros: Micros = SMS_RULES.pricePerSmsMicros,
): Micros {
  return segments * pricePerSmsMicros
}

export function campaignCostMicros(recipients: number, segmentsPerMessage: number): Micros {
  return recipients * messageCostMicros(segmentsPerMessage)
}

/**
 * Failed messages are not billed. Pending messages are charged up front
 * (a hold) and released if the carrier later reports a failure.
 */
export function isBillable(status: MessageStatus): boolean {
  return status !== 'Failed'
}

export function billedCostMicros(message: Pick<Message, 'status' | 'costMicros'>): Micros {
  return isBillable(message.status) ? message.costMicros : 0
}

/** Balance is derived from the ledger: top-ups minus everything billed. */
export function availableBalanceMicros(account: Account, messages: Message[]): Micros {
  const spent = messages.reduce((sum, message) => sum + billedCostMicros(message), 0)
  return account.creditMicros - spent
}
