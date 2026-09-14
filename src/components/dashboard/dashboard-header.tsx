import { MessageSquareText } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatMoney } from '@/lib/format'
import type { Micros } from '@/types'

interface DashboardHeaderProps {
  merchantName?: string
  balanceMicros: Micros
  loading: boolean
}

export function DashboardHeader({ merchantName, balanceMicros, loading }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b bg-card/90 backdrop-blur supports-backdrop-filter:bg-card/75">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <MessageSquareText className="size-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base leading-tight font-semibold">SMS Campaigns</h1>
            {loading ? (
              <Skeleton className="mt-1 h-4 w-28" />
            ) : (
              <p className="truncate text-sm text-muted-foreground">{merchantName}</p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4 sm:gap-6">
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0} className="flex items-center gap-2 rounded text-sm text-muted-foreground">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                <span className="max-sm:sr-only">Live</span>
              </span>
            </TooltipTrigger>
            <TooltipContent>Delivery reports update in real time</TooltipContent>
          </Tooltip>

          <div className="text-right">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Balance
            </p>
            {loading ? (
              <Skeleton className="mt-1 h-4 w-16" />
            ) : (
              <p className="text-sm font-semibold tabular-nums">{formatMoney(balanceMicros)}</p>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
