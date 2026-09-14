import { MAX_MESSAGE_CHARS } from '@/config'
import { campaignCostMicros } from '@/lib/billing'
import { formatMoney } from '@/lib/format'
import { analyzeMessage } from '@/lib/sms'
import type { Audience, Micros, NewCampaignInput } from '@/types'

export const CAMPAIGN_NAME_MAX = 60

export type CampaignErrors = Partial<Record<keyof NewCampaignInput | 'form', string>>

/**
 * Shared by the form (instant feedback) and the mock API (never trust the client).
 */
export function validateCampaign(
  input: NewCampaignInput,
  context: { audience: Audience | undefined; availableBalanceMicros: Micros },
): CampaignErrors {
  const errors: CampaignErrors = {}
  const name = input.name.trim()
  const { characters, segments } = analyzeMessage(input.body)

  if (!name) errors.name = 'Give your campaign a name.'
  else if (name.length > CAMPAIGN_NAME_MAX)
    errors.name = `Keep the name under ${CAMPAIGN_NAME_MAX} characters.`

  if (!context.audience) errors.audienceId = 'Choose who should receive this campaign.'
  else if (context.audience.size === 0) errors.audienceId = 'This audience has no subscribers yet.'

  if (!input.body.trim()) errors.body = 'Write a message to send.'
  else if (characters > MAX_MESSAGE_CHARS)
    errors.body = `Messages are limited to ${MAX_MESSAGE_CHARS} characters.`

  if (context.audience && segments > 0 && !errors.body) {
    const cost = campaignCostMicros(context.audience.size, segments)
    if (cost > context.availableBalanceMicros) {
      errors.form = `This campaign costs ${formatMoney(cost)} but your balance is ${formatMoney(context.availableBalanceMicros)}.`
    }
  }

  return errors
}

export function hasErrors(errors: CampaignErrors): boolean {
  return Object.keys(errors).length > 0
}
