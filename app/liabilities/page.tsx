'use client'
import { useState } from 'react'
import { usePortfolio } from '@/hooks/usePortfolio'
import { Liability } from '@/lib/types'
import { formatILS } from '@/lib/formatters'
import { debtAvalanche } from '@/lib/calculations'
import LoanCard from '@/components/liabilities/LoanCard'
import AddLiabilityModal from '@/components/liabilities/AddLiabilityModal'
import DebtTimeline from '@/components/liabilities/DebtTimeline'
import Card from '@/components/shared/Card'
import { Plus, Zap } from 'lucide-react'

export default function LiabilitiesPage() {
  const { data, portfolio, loading, update } = usePortfolio()
  const [showModal, setShowModal] = useState(false)
  const [extra, setExtra] = useState('1000')

  const addLiability = (l: Liability) => {
    update(d => ({ ...d, liabilities: [...d.liabilities, l] }))
  }

  const deleteLiability = (id: string) => {
    update(d => ({ ...d, liabilities: d.liabilities.filter(l => l.id !== id) }))
  }

  if (loading || !portfolio) {
    return <div className="flex items-center justify-center h-64 text-[var(--muted)]">טוען...</div>
  }

  const avalanche = debtAvalanche(data.liabilities, parseFloat(extra) || 0)

  return (
    <div className="space-y-5 fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">חובות</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
            סה"כ: <span className="text-[var(--danger)] font-semibold num">{formatILS(Math.round(portfolio.totalLiabilities))}</span>
            {' '} · תשלום חודשי: <span className="num">{formatILS(Math.round(portfolio.monthlyDebtPayments))}</span>
          </p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
          style={{ background: 'var(--danger)', color: '#fff' }}>
          <Plus size={16} />
          הוסף חוב
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {portfolio.liabilities.map(l => (
          <LoanCard key={l.id} liability={l} onDelete={deleteLiability} />
        ))}
        {portfolio.liabilities.length === 0 && (
          <div className="col-span-2 text-center py-12 text-[var(--muted)]">אין חובות — מצוין! 🎉</div>
        )}
      </div>

      {data.liabilities.length > 0 && <DebtTimeline liabilities={data.liabilities} />}

      {data.liabilities.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} style={{ color: 'var(--gold)' }} />
            <span className="font-semibold">אסטרטגיית מפולת (Avalanche)</span>
            <span className="text-xs mr-auto" style={{ color: 'var(--muted)' }}>
              אם יש לך
              <input
                type="number" value={extra} onChange={e => setExtra(e.target.value)}
                className="mx-1 w-20 px-2 py-0.5 rounded text-xs num inline outline-none"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
              ₪ נוספים בחודש:
            </span>
          </div>
          <div className="space-y-3">
            {avalanche.map((item, i) => (
              <div key={item.id} className="flex items-center gap-3 text-sm">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: i === 0 ? 'var(--primary-dim)' : 'var(--surface2)', color: i === 0 ? 'var(--primary)' : 'var(--muted)' }}>
                  {i + 1}
                </div>
                <span className="flex-1 font-medium">{item.label}</span>
                <span className="num text-xs" style={{ color: 'var(--muted)' }}>{item.monthsToPayoff} חודשים</span>
                {item.interestSaved > 0 && (
                  <span className="text-xs font-semibold text-[var(--primary)] num">חיסכון: {formatILS(Math.round(item.interestSaved))}</span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {showModal && <AddLiabilityModal onClose={() => setShowModal(false)} onAdd={addLiability} />}
    </div>
  )
}
