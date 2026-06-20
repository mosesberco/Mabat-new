'use client'
import { useState } from 'react'
import { usePortfolio } from '@/hooks/usePortfolio'
import { Liability } from '@/lib/types'
import { formatILS } from '@/lib/formatters'
import LoanCard from '@/components/liabilities/LoanCard'
import AddLiabilityModal from '@/components/liabilities/AddLiabilityModal'
import DebtTimeline from '@/components/liabilities/DebtTimeline'
import { Plus } from 'lucide-react'

export default function LiabilitiesPage() {
  const { data, portfolio, loading, update } = usePortfolio()
  const [showModal, setShowModal] = useState(false)

  const addLiability = (l: Liability) => {
    update(d => ({ ...d, liabilities: [...d.liabilities, l] }))
  }

  const deleteLiability = (id: string) => {
    update(d => ({ ...d, liabilities: d.liabilities.filter(l => l.id !== id) }))
  }

  if (loading || !portfolio) {
    return <div className="flex items-center justify-center h-64 text-[var(--muted)]">טוען...</div>
  }

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

      {showModal && <AddLiabilityModal onClose={() => setShowModal(false)} onAdd={addLiability} />}
    </div>
  )
}
