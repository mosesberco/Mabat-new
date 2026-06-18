'use client'
import { useState } from 'react'
import { usePortfolio } from '@/hooks/usePortfolio'
import { Holding } from '@/lib/types'
import { formatILS } from '@/lib/formatters'
import HoldingsTable from '@/components/assets/HoldingsTable'
import AddAssetModal from '@/components/assets/AddAssetModal'
import HoldingDetailModal from '@/components/assets/HoldingDetailModal'
import Card from '@/components/shared/Card'
import { Plus, RefreshCw } from 'lucide-react'

export default function AssetsPage() {
  const { data, portfolio, usdRate, loading, pricesLoading, update } = usePortfolio()
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Holding | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const upsertHolding = (h: Holding) => {
    update(d => ({
      ...d,
      holdings: d.holdings.some(x => x.id === h.id)
        ? d.holdings.map(x => (x.id === h.id ? h : x))
        : [...d.holdings, h],
    }))
  }

  const deleteHolding = (id: string) => {
    update(d => ({ ...d, holdings: d.holdings.filter(h => h.id !== id) }))
  }

  if (loading || !portfolio) {
    return <div className="flex items-center justify-center h-64 text-[var(--muted)]">טוען...</div>
  }

  const selected = selectedId ? portfolio.holdings.find(h => h.id === selectedId) ?? null : null

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
          onClick={() => setShowAdd(true)}
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
          onSelect={h => setSelectedId(h.id)}
          usdRate={usdRate}
          pricesLoading={pricesLoading}
        />
      </Card>

      <div className="text-xs text-center py-2" style={{ color: 'var(--muted)' }}>
        נכסים נסחרים מוצגים עם מחיר חי (עדכון כל 2 דקות) · לחיצה על נכס פותחת גרף ופרטים · נכסים ידניים מוצגים לפי הסכום שהזנת
      </div>

      {(showAdd || editing) && (
        <AddAssetModal
          initial={editing ?? undefined}
          onClose={() => { setShowAdd(false); setEditing(null) }}
          onAdd={upsertHolding}
        />
      )}

      {selected && (
        <HoldingDetailModal
          holding={selected}
          onClose={() => setSelectedId(null)}
          onEdit={() => { setEditing(selected); setSelectedId(null) }}
          onDelete={() => { deleteHolding(selected.id); setSelectedId(null) }}
        />
      )}
    </div>
  )
}
