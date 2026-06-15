'use client'
import { Liability } from '@/lib/types'
import { formatILS } from '@/lib/formatters'
import { monthlyPayment, totalInterestRemaining } from '@/lib/calculations'
import Card from '@/components/shared/Card'
import { Trash2 } from 'lucide-react'

interface Props {
  liability: Liability
  onDelete: (id: string) => void
}

export default function LoanCard({ liability: l, onDelete }: Props) {
  const pmt = monthlyPayment(l.currentBalance, l.annualRate, l.remainingPayments)
  const interest = totalInterestRemaining(l.currentBalance, l.annualRate, l.remainingPayments)
  const paidPct = l.principal > 0 ? ((l.principal - l.currentBalance) / l.principal) * 100 : 0

  const endDate = new Date()
  endDate.setMonth(endDate.getMonth() + l.remainingPayments)

  return (
    <Card>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-bold text-base">{l.label}</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            {(l.annualRate * 100).toFixed(2)}% שנתי
          </div>
        </div>
        <button
          onClick={() => onDelete(l.id)}
          className="p-1.5 rounded-lg transition-colors hover:bg-[var(--danger-dim)]"
          style={{ color: 'var(--muted)' }}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Balance + monthly */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="text-xs mb-0.5" style={{ color: 'var(--muted)' }}>יתרה</div>
          <div className="text-2xl font-black num" style={{ color: 'var(--danger)' }}>
            {formatILS(Math.round(l.currentBalance))}
          </div>
        </div>
        <div className="text-left">
          <div className="text-xs mb-0.5 text-right" style={{ color: 'var(--muted)' }}>תשלום חודשי</div>
          <div className="text-lg font-bold num text-right">{formatILS(Math.round(pmt))}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1.5">
          <span style={{ color: 'var(--muted)' }}>שולם {paidPct.toFixed(0)}%</span>
          <span style={{ color: 'var(--muted)' }}>{l.remainingPayments} תשלומים · {endDate.toLocaleDateString('he-IL', { month: 'short', year: 'numeric' })}</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface2)' }}>
          <div
            className="h-2 rounded-full transition-all duration-700"
            style={{ width: `${paidPct}%`, background: 'var(--primary)' }}
          />
        </div>
      </div>

      {/* Interest remaining */}
      <div className="flex items-center justify-between text-xs pt-3" style={{ borderTop: '1px solid var(--border)' }}>
        <span style={{ color: 'var(--muted)' }}>ריבית שנותרת</span>
        <span className="font-semibold num" style={{ color: 'var(--gold)' }}>{formatILS(Math.round(interest))}</span>
      </div>
    </Card>
  )
}
