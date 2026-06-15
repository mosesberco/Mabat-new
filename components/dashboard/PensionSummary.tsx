'use client'
import { ComputedPortfolio, FinancialData, PENSION_TYPES, TYPE_LABELS, TYPE_COLORS } from '@/lib/types'
import { formatILS } from '@/lib/formatters'
import Card from '@/components/shared/Card'
import { Shield, TrendingUp } from 'lucide-react'

interface Props { portfolio: ComputedPortfolio; data: FinancialData }

const TRACK_LABELS: Record<string, string> = {
  equity: 'מניות', bonds: "אג\"ח", mixed: 'מעורב', money_market: 'כספי'
}

export default function PensionSummary({ portfolio, data }: Props) {
  const pensionHoldings = portfolio.holdings.filter(h => PENSION_TYPES.includes(h.type as typeof PENSION_TYPES[number]))
  if (pensionHoldings.length === 0) return null

  const totalPension = pensionHoldings.reduce((s, h) => s + h.liveValue, 0)
  const totalMonthly = pensionHoldings.reduce((s, h) => s + (h.monthlyContribution ?? 0), 0)
  const totalExpectedPension = pensionHoldings.reduce((s, h) => s + (h.expectedMonthlyPension ?? 0), 0)

  // estimated value at retirement (age 67)
  const birthYear = new Date(data.profile.birthDate).getFullYear()
  const currentYear = new Date().getFullYear()
  const yearsToRetirement = Math.max(0, (data.profile.retirementAge ?? 67) - (currentYear - birthYear))

  let projectedValue = totalPension
  const monthlyReturn = 0.06 / 12 // 6% annual
  for (let m = 0; m < yearsToRetirement * 12; m++) {
    projectedValue = projectedValue * (1 + monthlyReturn) + totalMonthly
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Shield size={15} style={{ color: 'var(--purple)' }} />
        <span className="font-semibold text-sm" style={{ color: 'var(--muted)' }}>פנסיה וחסכונות מוסדיים</span>
        {yearsToRetirement > 0 && (
          <span className="mr-auto text-xs" style={{ color: 'var(--muted)' }}>פרישה בעוד {yearsToRetirement} שנים</span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <div className="text-xs mb-0.5" style={{ color: 'var(--muted)' }}>שווי עכשיו</div>
          <div className="font-black text-xl num" style={{ color: 'var(--purple)' }}>{formatILS(Math.round(totalPension))}</div>
        </div>
        <div>
          <div className="text-xs mb-0.5" style={{ color: 'var(--muted)' }}>הפקדה חודשית</div>
          <div className="font-black text-xl num" style={{ color: 'var(--primary)' }}>{formatILS(Math.round(totalMonthly))}</div>
        </div>
        {yearsToRetirement > 0 && (
          <div>
            <div className="text-xs mb-0.5" style={{ color: 'var(--muted)' }}>שווי צפוי בפרישה (6%)</div>
            <div className="font-black text-xl num" style={{ color: 'var(--gold)' }}>{formatILS(Math.round(projectedValue))}</div>
          </div>
        )}
      </div>

      {totalExpectedPension > 0 && (
        <div className="flex items-center gap-2 mb-3 text-sm">
          <TrendingUp size={14} style={{ color: 'var(--primary)' }} />
          <span>קצבה חודשית צפויה: </span>
          <span className="font-bold num" style={{ color: 'var(--primary)' }}>{formatILS(Math.round(totalExpectedPension))}</span>
        </div>
      )}

      <div className="space-y-2">
        {pensionHoldings.map(h => (
          <div key={h.id} className="flex items-center gap-3 text-sm p-2.5 rounded-xl" style={{ background: 'var(--surface2)' }}>
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: TYPE_COLORS[h.type] ?? '#6B7280' }} />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{h.label ?? h.type}</div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>
                {TYPE_LABELS[h.type]}
                {h.providerName && ` · ${h.providerName}`}
                {h.track && ` · ${TRACK_LABELS[h.track] ?? h.track}`}
              </div>
            </div>
            <div className="text-left">
              <div className="font-bold num text-sm">{formatILS(Math.round(h.liveValue))}</div>
              {h.monthlyContribution && (
                <div className="text-xs num" style={{ color: 'var(--muted)' }}>
                  +{formatILS(Math.round(h.monthlyContribution))}/חודש
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
