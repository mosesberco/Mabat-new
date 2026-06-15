'use client'
import { Holding, TYPE_COLORS, TYPE_LABELS } from '@/lib/types'
import { formatILS, formatPct } from '@/lib/formatters'
import { Trash2 } from 'lucide-react'
import Badge from '@/components/shared/Badge'

interface EnrichedHolding extends Holding {
  liveValue: number
  gain?: number
  gainPct?: number
}

interface Props {
  holdings: EnrichedHolding[]
  totalAssets: number
  onDelete: (id: string) => void
  usdRate: number
}

export default function HoldingsTable({ holdings, totalAssets, onDelete, usdRate }: Props) {
  if (holdings.length === 0) {
    return <div className="text-center py-12 text-[var(--muted)]">אין נכסים עדיין — הוסף את הנכס הראשון</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['נכס', 'סוג', 'שווי', '% מהתיק', 'רווח/הפסד', ''].map(h => (
              <th key={h} className="py-2.5 px-3 text-right text-xs font-medium" style={{ color: 'var(--muted)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {holdings.sort((a, b) => b.liveValue - a.liveValue).map(h => {
            const pct = totalAssets > 0 ? (h.liveValue / totalAssets) * 100 : 0
            const color = TYPE_COLORS[h.type] ?? '#6B7280'
            return (
              <tr key={h.id} className="glass-hover" style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="py-3 px-3">
                  <div className="font-semibold" style={{ color: 'var(--text)' }}>
                    {h.symbol ?? h.label ?? h.type}
                  </div>
                  {h.account && <div className="text-xs" style={{ color: 'var(--muted)' }}>{h.account}</div>}
                  {h.qty && <div className="text-xs num" style={{ color: 'var(--muted)' }}>{h.qty} יח'</div>}
                  {h.monthlyContribution && <div className="text-xs num" style={{ color: 'var(--purple)' }}>+{formatILS(Math.round(h.monthlyContribution))}/חודש</div>}
                  {h.providerName && <div className="text-xs" style={{ color: 'var(--muted)' }}>{h.providerName}</div>}
                </td>
                <td className="py-3 px-3">
                  <Badge label={TYPE_LABELS[h.type] ?? h.type} color="muted" />
                </td>
                <td className="py-3 px-3">
                  <div className="font-bold num" style={{ color }}>{formatILS(Math.round(h.liveValue))}</div>
                  {h.currency === 'USD' && h.symbol && (
                    <div className="text-xs num" style={{ color: 'var(--muted)' }}>שער: {usdRate.toFixed(2)}</div>
                  )}
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 rounded-full" style={{ width: `${Math.min(pct, 100) * 0.8}px`, minWidth: 4, background: color }} />
                    <span className="num text-xs" style={{ color: 'var(--muted)' }}>{pct.toFixed(1)}%</span>
                  </div>
                </td>
                <td className="py-3 px-3">
                  {h.gain !== undefined ? (
                    <div>
                      <div className={`font-semibold num text-xs ${h.gain >= 0 ? 'text-[var(--primary)]' : 'text-[var(--danger)]'}`}>
                        {h.gain >= 0 ? '+' : ''}{formatILS(Math.round(h.gain))}
                      </div>
                      {h.gainPct !== undefined && (
                        <div className={`text-xs num ${h.gainPct >= 0 ? 'text-[var(--primary)]' : 'text-[var(--danger)]'}`}>
                          {formatPct(h.gainPct)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--muted)' }}>—</span>
                  )}
                </td>
                <td className="py-3 px-3">
                  <button
                    onClick={() => onDelete(h.id)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-[var(--danger-dim)]"
                    style={{ color: 'var(--muted)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
