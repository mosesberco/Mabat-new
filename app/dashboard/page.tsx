'use client'
import { usePortfolio } from '@/hooks/usePortfolio'
import { effectiveMonthlyExpenses } from '@/lib/calculations'
import NetWorthHero from '@/components/dashboard/NetWorthHero'
import AllocationRing from '@/components/dashboard/AllocationRing'
import CashFlowWaterfall from '@/components/dashboard/CashFlowWaterfall'
import NetWorthTimeline from '@/components/dashboard/NetWorthTimeline'
import HealthScoreGauge from '@/components/dashboard/HealthScoreGauge'
import FireProgress from '@/components/dashboard/FireProgress'
import EmergencyFund from '@/components/dashboard/EmergencyFund'
import PensionSummary from '@/components/dashboard/PensionSummary'
import Link from 'next/link'
import { PlusCircle, Upload, BarChart3 } from 'lucide-react'

export default function DashboardPage() {
  const { data, portfolio, pricesLoading, loading } = usePortfolio()

  if (loading || !portfolio) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--muted)]">טוען...</div>
      </div>
    )
  }

  const isEmpty = data.holdings.length === 0 && data.liabilities.length === 0

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] fade-up text-center px-4">
        <div className="text-5xl mb-5">💰</div>
        <h1 className="text-3xl font-black mb-2">ברוך הבא לכמה</h1>
        <p className="text-base mb-8 max-w-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
          הנתונים שלך נשמרים אצלך בלבד — ללא שרתים, ללא הרשמה.
          <br />
          התחל ביצירת תיק חדש או ייבוא מקובץ Excel.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <Link href="/assets"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all flex-1"
            style={{ background: 'var(--primary)', color: '#0A0A0F' }}>
            <PlusCircle size={17} />
            הוסף נכסים
          </Link>
          <Link href="/settings"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all flex-1"
            style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' }}>
            <Upload size={17} />
            ייבא Excel
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-3 gap-4 w-full max-w-sm">
          {[
            { emoji: '📊', title: 'ניתוח', desc: 'תובנות אוטומטיות' },
            { emoji: '🏠', title: 'סימולטור', desc: 'דירה מול בורסה' },
            { emoji: '🎯', title: 'FIRE', desc: 'מסלול לחופש כלכלי' },
          ].map(f => (
            <div key={f.title} className="p-3 rounded-2xl text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="text-2xl mb-1">{f.emoji}</div>
              <div className="text-xs font-bold">{f.title}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{f.desc}</div>
            </div>
          ))}
        </div>
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
        <FireProgress portfolio={portfolio} monthlyExpenses={effectiveMonthlyExpenses(data)} />
        <EmergencyFund portfolio={portfolio} target={data.profile.monthlyCushionTarget} />
      </div>

      <PensionSummary portfolio={portfolio} data={data} />

      <div className="text-xs text-center py-2" style={{ color: 'var(--muted)' }}>
        כלי להמחשה בלבד · לא ייעוץ השקעות · כל הנתונים נשמרים מקומית
      </div>
    </div>
  )
}
