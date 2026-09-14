import { MAX_MESSAGE_CHARS, SMS_RULES } from '@/config'
import { formatNumber } from '@/lib/format'

/**
 * Counts user-perceived characters by code point, so an emoji counts as 1
 * rather than the 2 UTF-16 units that `string.length` reports.
 */
export function countCharacters(text: string): number {
  return Array.from(text).length
}

/** Brief rule: 0 chars = 0 SMS, 1–160 = 1, 161–320 = 2, and so on. */
export function calculateSmsSegments(
  text: string,
  charsPerSms: number = SMS_RULES.charsPerSms,
): number {
  return Math.ceil(countCharacters(text) / charsPerSms)
}

// GSM 03.38 basic alphabet plus its extension table (extension chars cost 2 on real networks).
const GSM_BASIC =
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?' +
  '¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà'
const GSM_EXTENSION = '\f^{}\\[~]|€'
const GSM_CHARSET = new Set(Array.from(GSM_BASIC + GSM_EXTENSION))

/**
 * Real carriers switch to Unicode (70 chars per SMS) when a message contains
 * anything outside the GSM alphabet: emoji, smart quotes, em dashes.
 * We bill by the brief's 160 rule but surface this so merchants aren't surprised.
 */
export function findNonGsmCharacters(text: string): string[] {
  const found = new Set<string>()
  for (const char of text) {
    if (!GSM_CHARSET.has(char)) found.add(char)
  }
  return [...found]
}

export interface MessageAnalysis {
  characters: number
  segments: number
  /** Characters left before the next SMS part starts. */
  remainingInSegment: number
  maxCharacters: number
  isOverLimit: boolean
  nonGsmCharacters: string[]
}

export function analyzeMessage(text: string): MessageAnalysis {
  const characters = countCharacters(text)
  const segments = calculateSmsSegments(text)
  const remainingInSegment =
    characters === 0 ? SMS_RULES.charsPerSms : segments * SMS_RULES.charsPerSms - characters

  return {
    characters,
    segments,
    remainingInSegment,
    maxCharacters: MAX_MESSAGE_CHARS,
    isOverLimit: characters > MAX_MESSAGE_CHARS,
    nonGsmCharacters: findNonGsmCharacters(text),
  }
}

/** Helper text shown under the message box. */
export function describeSmsBudget({ characters, segments, remainingInSegment, isOverLimit, maxCharacters }: MessageAnalysis) {
  if (isOverLimit) {
    return `${formatNumber(characters - maxCharacters)} characters over the ${SMS_RULES.maxSegments}-SMS limit.`
  }
  if (characters === 0) {
    return `${SMS_RULES.charsPerSms} characters fit in a single SMS. Longer messages are split and billed per part.`
  }
  if (remainingInSegment === 0) {
    return `SMS ${segments} is full. The next character starts SMS ${segments + 1}.`
  }
  return `${formatNumber(remainingInSegment)} characters left in SMS ${segments}.`
}
