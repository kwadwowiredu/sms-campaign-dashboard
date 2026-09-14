import { AlertTriangle, Info, Loader2, Send } from 'lucide-react'
import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { toast } from 'sonner'

import { SmsCounter, SmsSegmentBar } from '@/components/dashboard/sms-counter'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { campaignCostMicros } from '@/lib/billing'
import { formatMoney, formatNumber } from '@/lib/format'
import { analyzeMessage, describeSmsBudget } from '@/lib/sms'
import { cn } from '@/lib/utils'
import { hasErrors, validateCampaign, type CampaignErrors } from '@/lib/validation'
import { ApiError } from '@/services/campaign-api'
import type { Audience, Micros, NewCampaignInput } from '@/types'

interface CampaignFormProps {
  audiences: Audience[]
  balanceMicros: Micros
  loading: boolean
  onSend: (input: NewCampaignInput) => Promise<unknown>
  className?: string
}

const EMPTY_FORM: NewCampaignInput = { name: '', audienceId: '', body: '' }

export function CampaignForm({ audiences, balanceMicros, loading, onSend, className }: CampaignFormProps) {
  const id = useId()
  const [values, setValues] = useState<NewCampaignInput>(EMPTY_FORM)
  const [touched, setTouched] = useState<Partial<Record<keyof NewCampaignInput, boolean>>>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [serverErrors, setServerErrors] = useState<CampaignErrors>({})

  const audience = audiences.find((item) => item.id === values.audienceId)
  const analysis = analyzeMessage(values.body)
  const recipients = audience?.size ?? 0
  const costMicros = campaignCostMicros(recipients, analysis.segments)
  const errors = { ...validateCampaign(values, { audience, availableBalanceMicros: balanceMicros }), ...serverErrors }

  const fieldError = (field: keyof NewCampaignInput) =>
    touched[field] || submitAttempted ? errors[field] : undefined

  function update<K extends keyof NewCampaignInput>(field: K, value: NewCampaignInput[K]) {
    setValues((current) => ({ ...current, [field]: value }))
    setServerErrors({})
  }

  const markTouched = (field: keyof NewCampaignInput) =>
    setTouched((current) => ({ ...current, [field]: true }))

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitAttempted(true)
    if (hasErrors(errors) || submitting) return

    setSubmitting(true)
    try {
      await onSend(values)
      toast.success(`"${values.name.trim()}" is on its way`, {
        description: `${formatNumber(recipients)} messages queued · ${formatMoney(costMicros)}`,
      })
      setValues(EMPTY_FORM)
      setTouched({})
      setSubmitAttempted(false)
    } catch (error) {
      if (error instanceof ApiError) setServerErrors(error.fieldErrors)
      toast.error('Campaign not sent', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const nameError = fieldError('name')
  const audienceError = fieldError('audienceId')
  const bodyError = fieldError('body')
  const showOptOutTip = analysis.characters > 20 && !/\bstop\b/i.test(values.body)

  return (
    <Card className={cn('gap-0 py-0', className)}>
      <CardHeader className="border-b py-5">
        <CardTitle className="text-base font-semibold">Send new campaign</CardTitle>
        <CardDescription>Messages go out immediately to the selected audience.</CardDescription>
      </CardHeader>

      <CardContent className="py-5">
        <form noValidate onSubmit={handleSubmit} className="space-y-5" aria-busy={submitting}>
          <div className="space-y-2">
            <Label htmlFor={`${id}-name`}>Campaign name</Label>
            <Input
              id={`${id}-name`}
              value={values.name}
              placeholder="Christmas Mega Sale"
              onChange={(event) => update('name', event.target.value)}
              onBlur={() => markTouched('name')}
              aria-invalid={!!nameError}
              aria-describedby={nameError ? `${id}-name-error` : undefined}
              className="h-9"
            />
            <FieldError id={`${id}-name-error`} message={nameError} />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${id}-audience`}>Audience</Label>
            {loading ? (
              <Skeleton className="h-9 w-full" />
            ) : (
              <Select
                value={values.audienceId}
                onValueChange={(value) => {
                  update('audienceId', value)
                  markTouched('audienceId')
                }}
              >
                <SelectTrigger
                  id={`${id}-audience`}
                  className="h-9 w-full data-[size=default]:h-9"
                  aria-invalid={!!audienceError}
                  aria-describedby={`${id}-audience-hint`}
                >
                  <SelectValue placeholder="Choose an audience" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {audiences.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                      <span className="text-muted-foreground">· {formatNumber(item.size)}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p id={`${id}-audience-hint`} className="text-xs text-muted-foreground">
              {audience
                ? `${audience.description} ${formatNumber(audience.size)} opted-in recipients.`
                : 'Only contacts who opted in to marketing texts are included.'}
            </p>
            <FieldError message={audienceError} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor={`${id}-body`}>Message</Label>
              <SmsCounter id={`${id}-counter`} analysis={analysis} />
            </div>
            <Textarea
              id={`${id}-body`}
              value={values.body}
              rows={5}
              placeholder="Our Christmas sale starts Friday! Up to 30% off at all our shops. Pay with MoMo and get free delivery in Accra. Reply STOP to opt out"
              onChange={(event) => update('body', event.target.value)}
              onBlur={() => markTouched('body')}
              aria-invalid={!!bodyError || analysis.isOverLimit}
              aria-describedby={`${id}-counter ${id}-body-hint`}
              className="min-h-28 resize-y [field-sizing:fixed]"
            />
            <SmsSegmentBar analysis={analysis} />
            <p
              id={`${id}-body-hint`}
              className={cn('text-xs text-muted-foreground', analysis.isOverLimit && 'text-destructive')}
            >
              {describeSmsBudget(analysis)}
            </p>
            {!analysis.isOverLimit && <FieldError message={bodyError} />}

            {analysis.nonGsmCharacters.length > 0 && (
              <Notice icon={AlertTriangle} tone="warning">
                Contains special characters ({analysis.nonGsmCharacters.slice(0, 5).map((char) => `“${char}”`).join(' ')}
                ). Many carriers send these at 70 characters per SMS, which can raise the real cost.
              </Notice>
            )}
            {showOptOutTip && (
              <Notice icon={Info}>Tip: end with “Reply STOP to opt out” to stay compliant.</Notice>
            )}
          </div>

          <div className="space-y-3 border-t pt-4">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-muted-foreground">
                {formatNumber(recipients)} recipients × {analysis.segments} SMS
              </span>
              <span className="text-lg font-semibold tabular-nums">{formatMoney(costMicros)}</span>
            </div>
            {errors.form ? (
              <Notice icon={AlertTriangle} tone="error">
                {errors.form}
              </Notice>
            ) : (
              audience &&
              analysis.segments > 0 && (
                <p className="text-xs text-muted-foreground">
                  Balance after sending: {formatMoney(balanceMicros - costMicros)}
                </p>
              )
            )}
            <Button type="submit" size="lg" className="h-10 w-full" disabled={submitting || loading}>
              {submitting ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : (
                <Send aria-hidden />
              )}
              {submitting
                ? 'Sending…'
                : audience
                  ? `Send to ${formatNumber(recipients)} recipients`
                  : 'Send campaign'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="text-xs font-medium text-destructive">
      {message}
    </p>
  )
}

function Notice({
  icon: Icon,
  tone = 'info',
  children,
}: {
  icon: typeof Info
  tone?: 'info' | 'warning' | 'error'
  children: ReactNode
}) {
  return (
    <p
      role={tone === 'error' ? 'alert' : undefined}
      className={cn(
        'flex gap-2 rounded-md px-2.5 py-2 text-xs',
        tone === 'info' && 'bg-muted text-muted-foreground',
        tone === 'warning' && 'bg-amber-50 text-amber-800',
        tone === 'error' && 'bg-red-50 text-red-700',
      )}
    >
      <Icon className="mt-px size-3.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  )
}
