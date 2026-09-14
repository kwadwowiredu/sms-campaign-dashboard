import { AlertTriangle, RotateCw } from 'lucide-react'

import { CampaignForm } from '@/components/dashboard/campaign-form'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { MessagesPanel } from '@/components/dashboard/messages-panel'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { Button } from '@/components/ui/button'
import { useDashboard } from '@/hooks/use-dashboard'

export default function App() {
  const { state, data, messages, stats, balanceMicros, sendCampaign, reload } = useDashboard()
  const loading = state.status === 'loading'

  return (
    <div className="min-h-svh bg-background">
      <DashboardHeader
        merchantName={data?.account.merchantName}
        balanceMicros={balanceMicros}
        loading={loading}
      />

      <main className="mx-auto max-w-7xl space-y-4 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-8">
        {state.status === 'error' ? (
          <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border bg-card px-6 py-16 text-center">
            <AlertTriangle className="size-6 text-destructive" aria-hidden />
            <p className="font-medium">{state.error}</p>
            <Button variant="outline" onClick={reload}>
              <RotateCw aria-hidden />
              Try again
            </Button>
          </div>
        ) : (
          <>
            <StatsCards stats={stats} loading={loading} />

            <div className="grid items-start gap-4 sm:gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
              <CampaignForm
                audiences={data?.audiences ?? []}
                balanceMicros={balanceMicros}
                loading={loading}
                onSend={sendCampaign}
                className="lg:sticky lg:top-24"
              />
              <MessagesPanel messages={messages} loading={loading} />
            </div>
          </>
        )}
      </main>
    </div>
  )
}
