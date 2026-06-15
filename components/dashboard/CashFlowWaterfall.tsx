'use client'
import { ComputedPortfolio } from '@/lib/types'
import { formatILS } from '@/lib/formatters'
import Card from '@/components/shared/Card'

interface Props { portfolio: ComputedPortfolio }

export default function CashFlowWaterfall({ portfolio }: Props) {
  const { monthlyIncome, monthlyDebtPayments, monthlySavings } = portfolio
  const expenses = monthlyIncome - monthlyDebtPayments - monthlySavings

  const bars = [
    { label: 'הכנסה נטו', value: monthlyIncome, color: 'var(--primary)', pct: 100 },
    { label: 'הוצאות חיים', value: expenses, color: 'var(--muted)', pct: monthlyIncome ? (expenses / monthlyIncome) * 100 : 0 },
    { label: 'חזרי חוב', value: monthlyDebtPayments, color: 'var(--danger)', pct: monthlyIncome ? (monthlyDebtPayments / monthlyIncome) * 100 : 0 },
    { label: 'חיסכון נטו', value: monthlySavings, color: monthlySavings >= 0 ? 'var(--gold)' : 'var(--danger)', pct: monthlyIncome ? Math.abs(monthlySavings / monthlyIncome) * 100 : 0 },
  ]

  return (
    <Card>
      <div className="text-sm font-semibold mb-4" style={{ color: 'var(--muted)' }}>תזרים חודשי</div>
      <div className="space-y-3">
        {bars.map(b => (
          <div key={b.label}>
            <div className="flex justify-between text-xs mb-1">
              <span style={{ color: 'var(--muted)' }}>{b.label}</span>
              <span className="font-semibold num" style={{ color: b.color }}>{formatILS(Math.round(b.value))}</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: 'var(--surface2)' }}>
              <div
                className="h-2 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(b.pct, 100)}%`, background: b.color }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 flex justify-between items-center" style={{ borderTop: '1px solid var(--border)' }}>
        <span className="text-xs" style={{ color: 'var(--muted)' }}>שיעור חיסכון</span>
        <span className="text-lg font-black num" style={{ color: portfolio.savingsRate >= 20 ? 'var(--primary)' : portfolio.savingsRate >= 0 ? 'var(--gold)' : 'var(--danger)' }}>
          {portfolio.savingsRate.toFixed(1)}%
        </span>
      </div>
    </Card>
  )
}
