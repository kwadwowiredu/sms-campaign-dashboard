import { SMS_RULES } from '@/config'
import { formatNumber } from '@/lib/format'
import type { MessageAnalysis } from '@/lib/sms'
import { cn } from '@/lib/utils'

/** "118/640 chars · 1 SMS" shown beside the Message label. */
export function SmsCounter({ analysis, id }: { analysis: MessageAnalysis; id?: string }) {
  const { characters, maxCharacters, segments, isOverLimit } = analysis
  return (
    <p id={id} className={cn('text-xs text-muted-foreground tabular-nums', isOverLimit && 'text-destructive')}>
      <span>
        {formatNumber(characters)}/{formatNumber(maxCharacters)} chars
      </span>
      <span aria-hidden> · </span>
      <span className="font-medium text-foreground" aria-live="polite">
        {segments} SMS
      </span>
    </p>
  )
}

/** One bar per SMS part; the current part fills as you type. */
export function SmsSegmentBar({ analysis }: { analysis: MessageAnalysis }) {
  const { characters, isOverLimit } = analysis

  return (
    <div className="flex gap-1" aria-hidden>
      {Array.from({ length: SMS_RULES.maxSegments }, (_, index) => {
        const segmentStart = index * SMS_RULES.charsPerSms
        const fill = Math.min(Math.max((characters - segmentStart) / SMS_RULES.charsPerSms, 0), 1)
        return (
          <div key={index} className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className={cn('h-full rounded-full bg-primary transition-[width] duration-150', isOverLimit && 'bg-destructive')}
              style={{ width: `${fill * 100}%` }}
            />
          </div>
        )
      })}
    </div>
  )
}
