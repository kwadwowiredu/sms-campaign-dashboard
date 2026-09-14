import { Check, Clock, X, type LucideIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { MessageStatus } from '@/types'

const STATUS_STYLES: Record<MessageStatus, { icon: LucideIcon; className: string }> = {
  Delivered: { icon: Check, className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  Pending: { icon: Clock, className: 'border-amber-200 bg-amber-50 text-amber-700' },
  Failed: { icon: X, className: 'border-red-200 bg-red-50 text-red-700' },
}

export function StatusBadge({ status, className }: { status: MessageStatus; className?: string }) {
  const { icon: Icon, className: statusClassName } = STATUS_STYLES[status]
  return (
    <Badge variant="outline" className={cn(statusClassName, className)}>
      <Icon data-icon="inline-start" aria-hidden />
      {status}
    </Badge>
  )
}
