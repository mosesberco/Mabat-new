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
  onSelect?: (h: EnrichedHolding) => void
  usdRate: number
  pricesLoading?: boolean
}

export default function HoldingsTable({ holdings, totalAssets, onDelete, onSelect, usdRate, pricesLoading }: Props) {
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
            // A traded symbol, or a non-ILS cash holding with an amount, that
            // resolves to ₪0 means its price/FX rate hasn't loaded.
            const rateUnavailable = h.liveValue === 0 &&
              (!!h.symbol || (!!h.currency && h.currency !== 'ILS' && (h.value ?? 0) > 0))
            return (
              <tr
                key={h.id}
                onClick={() => onSelect?.(h)}
                onKeyDown={onSelect ? e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(h) } } : undefined}
                role={onSelect ? 'button' : undefined}
                tabIndex={onSelect ? 0 : undefined}
                aria-label={onSelect ? `פתח פרטים עבור ${h.symbol ?? h.label ?? h.type}` : undefined}
                className={`glass-hover ${onSelect ? 'cursor-pointer' : ''}`}
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <td className="py-3 px-3">
                  <div className="font-semibold" style={{ color: 'var(--text)' }}>
                    {h.symbol ?? h.label ?? h.type}
                  </div>
                  {h.account && <div className="text-xs" style={{ color: 'var(--muted)' }}>{h.account}</div>}
                  {h.qty && <div className="text-xs num" style={{ color: 'var(--muted)' }}>{h.qty} יח'</div>}
                  {!h.symbol && h.currency && h.currency !== 'ILS' && h.value != null && (
                    <div className="text-xs num" style={{ color: 'var(--muted)' }}>{h.value.toLocaleString('en-US')} {h.currency}</div>
                  )}
                  {h.monthlyContribution && <div className="text-xs num" style={{ color: 'var(--purple)' }}>+{formatILS(Math.round(h.monthlyContribution))}/חודש</div>}
                  {h.providerName && <div className="text-xs" style={{ color: 'var(--muted)' }}>{h.providerName}</div>}
                </td>
                <td className="py-3 px-3">
                  <Badge label={TYPE_LABELS[h.type] ?? h.type} color="muted" />
                </td>
                <td className="py-3 px-3">
                  {rateUnavailable ? (
                    pricesLoading ? (
                      <div className="text-xs animate-pulse" style={{ color: 'var(--muted)' }}>טוען מחיר…</div>
                    ) : (
                      <div className="text-xs" style={{ color: 'var(--muted)' }}>מחיר לא זמין</div>
                    )
                  ) : (
                    <>
                      <div className="font-bold num" style={{ color }}>{formatILS(Math.round(h.liveValue))}</div>
                      {h.currency === 'USD' && h.symbol && (
                        <div className="text-xs num" style={{ color: 'var(--muted)' }}>שער: {usdRate.toFixed(2)}</div>
                      )}
                    </>
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
                    onClick={e => { e.stopPropagation(); onDelete(h.id) }}
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
