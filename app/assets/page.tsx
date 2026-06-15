'use client'
import { useState } from 'react'
import { usePortfolio } from '@/hooks/usePortfolio'
import { Holding } from '@/lib/types'
import { formatILS } from '@/lib/formatters'
import HoldingsTable from '@/components/assets/HoldingsTable'
import AddAssetModal from '@/components/assets/AddAssetModal'
import Card from '@/components/shared/Card'
import { Plus, RefreshCw } from 'lucide-react'

export default function AssetsPage() {
  const { data, portfolio, usdRate, loading, pricesLoading, update } = usePortfolio()
  const [showModal, setShowModal] = useState(false)

  const addHolding = (h: Holding) => {
    update(d => ({ ...d, holdings: [...d.holdings, h] }))
  }

  const deleteHolding = (id: string) => {
    update(d => ({ ...d, holdings: d.holdings.filter(h => h.id !== id) }))
  }

  if (loading || !portfolio) {
    return <div className="flex items-center justify-center h-64 text-[var(--muted)]">טוען...</div>
  }

  return (
    <div className="space-y-5 fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">נכסים</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
            סה"כ: {formatILS(Math.round(portfolio.totalAssets))}
            {pricesLoading && <span className="mr-2 text-xs opacity-60"><RefreshCw size={10} className="inline animate-spin" /> מעדכן מחירים</span>}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
          style={{ background: 'var(--primary)', color: '#0A0A0F' }}
        >
          <Plus size={16} />
          הוסף נכס
        </button>
      </div>

      <Card padding="p-0">
        <HoldingsTable
          holdings={portfolio.holdings}
          totalAssets={portfolio.totalAssets}
          onDelete={deleteHolding}
          usdRate={usdRate}
        />
      </Card>

      <div className="text-xs text-center py-2" style={{ color: 'var(--muted)' }}>
        נכסים נסחרים מוצגים עם מחיר חי (עדכון כל 10 דקות) · נכסים ידניים מוצגים לפי הסכום שהזנת
      </div>

      {showModal && <AddAssetModal onClose={() => setShowModal(false)} onAdd={addHolding} />}
    </div>
  )
}
