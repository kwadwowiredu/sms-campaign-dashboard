import type { ReactNode } from 'react'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { SMS_RULES } from '@/config'
import { formatMoney, formatNumber, formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { DashboardStats } from '@/types'

interface StatsCardsProps {
  stats: DashboardStats
  loading: boolean
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
  const share = (count: number) => (stats.totalSent === 0 ? 0 : count / stats.totalSent)

  return (
    <section aria-label="Campaign summary" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <StatCard
        label="Total sent"
        value={formatNumber(stats.totalSent)}
        hint={`${formatNumber(stats.pending)} in flight`}
        loading={loading}
        footer={<StatusBar delivered={share(stats.delivered)} pending={share(stats.pending)} failed={share(stats.failed)} />}
      />
      <StatCard
        label="Delivered"
        value={formatNumber(stats.delivered)}
        valueClassName="text-emerald-600"
        hint={`${formatPercent(stats.deliveryRate)} of sent`}
        loading={loading}
      />
      <StatCard
        label="Failed"
        value={formatNumber(stats.failed)}
        valueClassName="text-red-600"
        hint={`${formatPercent(share(stats.failed))} of sent · not billed`}
        loading={loading}
      />
      <StatCard
        label="Total cost"
        value={formatMoney(stats.totalCostMicros)}
        hint={`${formatNumber(stats.billedSegments)} SMS × ${formatMoney(SMS_RULES.pricePerSmsMicros, { precise: true })}`}
        loading={loading}
      />
    </section>
  )
}

interface StatCardProps {
  label: string
  value: string
  hint: string
  loading: boolean
  valueClassName?: string
  footer?: ReactNode
}

function StatCard({ label, value, hint, loading, valueClassName, footer }: StatCardProps) {
  return (
    <Card className="gap-1 px-4 py-4 sm:px-5">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      {loading ? (
        <>
          <Skeleton className="my-1 h-8 w-20" />
          <Skeleton className="h-4 w-24" />
        </>
      ) : (
        <>
          <p className={cn('text-2xl font-semibold tabular-nums sm:text-3xl', valueClassName)}>{value}</p>
          <p className="text-xs text-muted-foreground sm:text-sm">{hint}</p>
          {footer}
        </>
      )}
    </Card>
  )
}

function StatusBar({ delivered, pending, failed }: { delivered: number; pending: number; failed: number }) {
  const label = `${formatPercent(delivered)} delivered, ${formatPercent(pending)} pending, ${formatPercent(failed)} failed`
  return (
    <div role="img" aria-label={label} title={label} className="mt-2 flex h-1.5 gap-px overflow-hidden rounded-full bg-muted">
      <span className="bg-emerald-500 transition-[width] duration-500" style={{ width: `${delivered * 100}%` }} />
      <span className="bg-amber-400 transition-[width] duration-500" style={{ width: `${pending * 100}%` }} />
      <span className="bg-red-500 transition-[width] duration-500" style={{ width: `${failed * 100}%` }} />
    </div>
  )
}
