/**
 * Business rules live in one place so pricing or SMS limits can change
 * without touching components.
 */
export const SMS_RULES = {
  /** Brief: 160 characters = 1 SMS, 161–320 = 2 SMS, and so on. */
  charsPerSms: 160,
  /** Longest message we allow: 4 SMS parts. */
  maxSegments: 4,
  /** GH₵0.035 per SMS part, stored in micro-units (GH₵1 = 1,000,000). */
  pricePerSmsMicros: 35_000,
} as const

export const MAX_MESSAGE_CHARS = SMS_RULES.charsPerSms * SMS_RULES.maxSegments

export const LOCALE = 'en-GH'
export const CURRENCY = 'GHS'

export const PAGE_SIZE = 10
