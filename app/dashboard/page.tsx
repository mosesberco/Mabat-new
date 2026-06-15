'use client'
import { usePortfolio } from '@/hooks/usePortfolio'
import NetWorthHero from '@/components/dashboard/NetWorthHero'
import AllocationRing from '@/components/dashboard/AllocationRing'
import CashFlowWaterfall from '@/components/dashboard/CashFlowWaterfall'
import NetWorthTimeline from '@/components/dashboard/NetWorthTimeline'
import HealthScoreGauge from '@/components/dashboard/HealthScoreGauge'
import FireProgress from '@/components/dashboard/FireProgress'
import EmergencyFund from '@/components/dashboard/EmergencyFund'
import PensionSummary from '@/components/dashboard/PensionSummary'

export default function DashboardPage() {
  const { data, portfolio, pricesLoading, loading } = usePortfolio()

  if (loading || !portfolio) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--muted)]">טוען...</div>
      </div>
    )
  }

  return (
    <div className="space-y-5 fade-up">
      <NetWorthHero portfolio={portfolio} snapshots={data.snapshots} pricesLoading={pricesLoading} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        <AllocationRing portfolio={portfolio} />
        <CashFlowWaterfall portfolio={portfolio} />
        <HealthScoreGauge portfolio={portfolio} data={data} />
      </div>

      <NetWorthTimeline snapshots={data.snapshots} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        <FireProgress portfolio={portfolio} monthlyExpenses={data.profile.monthlyExpenses} />
        <EmergencyFund portfolio={portfolio} target={data.profile.monthlyCushionTarget} />
      </div>

      <PensionSummary portfolio={portfolio} data={data} />

      <div className="text-xs text-center py-2" style={{ color: 'var(--muted)' }}>
        כלי להמחשה בלבד · לא ייעוץ השקעות · כל הנתונים נשמרים מקומית
      </div>
    </div>
  )
}
