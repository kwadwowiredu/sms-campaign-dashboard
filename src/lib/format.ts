import { CURRENCY, LOCALE } from '@/config'
import type { Micros } from '@/types'

export const MICROS_PER_UNIT = 1_000_000

/**
 * Amounts under GH₵1 keep up to 4 decimals (GH₵0.035); larger amounts use pesewas (GH₵87.22).
 */
export function formatMoney(micros: Micros, options: { precise?: boolean } = {}): string {
  const amount = micros / MICROS_PER_UNIT
  const precise = options.precise ?? Math.abs(amount) < 1
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: CURRENCY,
    minimumFractionDigits: 2,
    maximumFractionDigits: precise ? 4 : 2,
  }).format(amount)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(LOCALE).format(value)
}

/** Exact below 10,000 (1,264), compact above (12.5K), so filter chips stay narrow. */
export function formatCompactNumber(value: number): string {
  if (Math.abs(value) < 10_000) return formatNumber(value)
  return new Intl.NumberFormat(LOCALE, { notation: 'compact', maximumFractionDigits: 1 }).format(
    value,
  )
}

export function formatPercent(ratio: number): string {
  return new Intl.NumberFormat(LOCALE, { style: 'percent', maximumFractionDigits: 0 }).format(ratio)
}

/** +233241234567 → 024 123 4567, the way Ghanaian numbers are usually written. Other formats are returned unchanged. */
export function formatPhone(e164: string): string {
  const match = /^\+233(\d{2})(\d{3})(\d{4})$/.exec(e164)
  return match ? `0${match[1]} ${match[2]} ${match[3]}` : e164
}

export function formatSentAt(iso: string, now: Date = new Date()): string {
  const date = new Date(iso)
  const time = date.toLocaleTimeString(LOCALE, { hour: 'numeric', minute: '2-digit' })
  const sameDay = date.toDateString() === now.toDateString()
  if (sameDay) return `Today, ${time}`
  const day = date.toLocaleDateString(LOCALE, {
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() !== now.getFullYear() && { year: 'numeric' }),
  })
  return `${day}, ${time}`
}
