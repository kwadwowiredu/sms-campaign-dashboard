import { MESSAGE_STATUSES, type Message, type MessageStatus } from '@/types'

export type StatusFilter = MessageStatus | 'All'

export const STATUS_FILTERS: StatusFilter[] = ['All', ...MESSAGE_STATUSES]

/**
 * Every word in the query must appear somewhere in the message
 * ("esi school" matches Esi's Back to School message). Digits also match the
 * phone number in local or international form, so "0244908132", "024 490"
 * and "+233 24 490" all work.
 */
export function matchesSearch(message: Message, query: string): boolean {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return true

  const internationalDigits = message.recipientPhone.replace(/\D/g, '')
  const localDigits = internationalDigits.startsWith('233')
    ? `0${internationalDigits.slice(3)}`
    : internationalDigits
  const phoneMatches = (digits: string) =>
    digits.length > 0 && (localDigits.includes(digits) || internationalDigits.includes(digits))

  // A query that looks like a phone number ("024 490 8132") is matched as one number, not per group.
  if (/^[\d\s+()-]+$/.test(query.trim())) return phoneMatches(query.replace(/\D/g, ''))

  const haystack = [message.recipientName, message.body, message.campaignName, message.recipientPhone]
    .join(' ')
    .toLowerCase()

  return tokens.every((token) => haystack.includes(token) || phoneMatches(token.replace(/\D/g, '')))
}

export function filterMessages(
  messages: Message[],
  { query, status }: { query: string; status: StatusFilter },
): Message[] {
  return messages.filter(
    (message) => (status === 'All' || message.status === status) && matchesSearch(message, query),
  )
}

export function countByStatus(messages: Message[]): Record<StatusFilter, number> {
  const counts: Record<StatusFilter, number> = { All: messages.length, Delivered: 0, Pending: 0, Failed: 0 }
  for (const message of messages) counts[message.status]++
  return counts
}
