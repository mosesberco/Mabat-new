'use client'
import { Liability } from '@/lib/types'
import { formatILS, formatDate } from '@/lib/formatters'
import { monthlyPayment, totalInterestRemaining } from '@/lib/calculations'
import Card from '@/components/shared/Card'
import { Trash2, TrendingDown } from 'lucide-react'

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
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="font-bold text-lg">{l.label}</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            {(l.annualRate * 100).toFixed(2)}% שנתי · {l.remainingPayments} תשלומים נותרים
          </div>
        </div>
        <button onClick={() => onDelete(l.id)} className="p-1.5 rounded-lg hover:bg-[var(--danger-dim)] transition-colors" style={{ color: 'var(--muted)' }}>
          <Trash2 size={14} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <div className="text-xs mb-0.5" style={{ color: 'var(--muted)' }}>יתרה</div>
          <div className="font-bold num text-[var(--danger)]">{formatILS(Math.round(l.currentBalance))}</div>
        </div>
        <div>
          <div className="text-xs mb-0.5" style={{ color: 'var(--muted)' }}>תשלום חודשי</div>
          <div className="font-bold num">{formatILS(Math.round(pmt))}</div>
        </div>
        <div>
          <div className="text-xs mb-0.5" style={{ color: 'var(--muted)' }}>ריבית שנותרת</div>
          <div className="font-bold num text-[var(--gold)]">{formatILS(Math.round(interest))}</div>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span style={{ color: 'var(--muted)' }}>שולם {paidPct.toFixed(0)}%</span>
          <span style={{ color: 'var(--muted)' }}>סיום: {endDate.toLocaleDateString('he-IL', { month: 'short', year: 'numeric' })}</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--surface2)' }}>
          <div className="h-2.5 rounded-full transition-all duration-700" style={{ width: `${paidPct}%`, background: 'var(--primary)' }} />
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted)' }}>
        <TrendingDown size={12} />
        <span>סה"כ שולם: {formatILS(Math.round(l.principal - l.currentBalance))}</span>
      </div>
    </Card>
  )
}
