'use client'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Holding, TYPE_COLORS, TYPE_LABELS, TRADED_TYPES } from '@/lib/types'
import { formatILS, formatPct } from '@/lib/formatters'
import { X, Pencil, Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import Badge from '@/components/shared/Badge'

type Enriched = Holding & { liveValue: number; gain?: number; gainPct?: number }
type Range = '1W' | '1M' | '3M' | '1Y'

interface CandleData {
  points: { t: number; c: number }[]
  currency: string
  current: number | null
  prevClose: number | null
  high52: number | null
  low52: number | null
}

interface Props {
  holding: Enriched
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

const RANGES: Range[] = ['1W', '1M', '3M', '1Y']
const RANGE_LABELS: Record<Range, string> = { '1W': 'שבוע', '1M': 'חודש', '3M': '3 ח׳', '1Y': 'שנה' }

export default function HoldingDetailModal({ holding, onClose, onEdit, onDelete }: Props) {
  const isTraded = !!holding.symbol && TRADED_TYPES.includes(holding.type)
  const color = TYPE_COLORS[holding.type] ?? '#818CF8'
  const name = holding.symbol ?? holding.label ?? TYPE_LABELS[holding.type] ?? holding.type

  const [range, setRange] = useState<Range>('1M')
  const [data, setData] = useState<CandleData | null>(null)
  const [loading, setLoading] = useState(false)

  // Lock the page behind the modal so the bottom-sheet doesn't scroll-bleed on touch.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    if (!isTraded || !holding.symbol) return
    let alive = true
    setLoading(true)
    fetch('/api/candles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol: holding.symbol, range }),
    })
      .then(r => r.json())
      .then((d: CandleData) => { if (alive) { setData(d); setLoading(false) } })
      // Keep the last good chart on a failed range switch rather than collapsing
      // to the "unavailable" state.
      .catch(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [holding.symbol, isTraded, range])

  const cur = data?.currency || holding.currency || 'USD'
  const priceSym = cur === 'USD' ? '$' : '₪'
  const fmtPrice = (n: number) => `${priceSym}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const dayChange = data?.current != null && data?.prevClose != null && data.prevClose !== 0
    ? ((data.current - data.prevClose) / data.prevClose) * 100
    : null

  const chartData = (data?.points ?? []).map(p => ({ t: p.t, c: p.c }))
  const up = dayChange == null ? (holding.gainPct ?? 0) >= 0 : dayChange >= 0

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="glass w-full max-w-lg flex flex-col rounded-t-[20px] md:rounded-[20px]"
        style={{ maxHeight: '92vh', overflow: 'hidden' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-lg font-black truncate">{name}</span>
            <Badge label={TYPE_LABELS[holding.type] ?? holding.type} color="muted" />
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface2)] flex-shrink-0">
            <X size={18} style={{ color: 'var(--muted)' }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 min-h-0">
          {/* Value + day change */}
          <div>
            <div className="text-3xl font-black num" style={{ color: 'var(--text)' }}>
              {formatILS(Math.round(holding.liveValue))}
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm">
              {isTraded && data?.current != null && (
                <span className="num" style={{ color: 'var(--muted)' }}>{fmtPrice(data.current)} ליחידה</span>
              )}
              {dayChange != null && (
                <span className={`num inline-flex items-center gap-0.5 ${up ? 'text-[var(--primary)]' : 'text-[var(--danger)]'}`}>
                  {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {formatPct(dayChange)} היום
                </span>
              )}
            </div>
          </div>

          {/* Chart (traded only) */}
          {isTraded && (
            <div>
              <div className="flex gap-1.5 mb-3">
                {RANGES.map(r => (
                  <button key={r} type="button" onClick={() => setRange(r)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: range === r ? 'var(--primary-dim)' : 'var(--surface2)',
                      color: range === r ? 'var(--primary)' : 'var(--muted)',
                      border: range === r ? '1px solid rgba(129,140,248,0.3)' : '1px solid var(--border)',
                    }}>
                    {RANGE_LABELS[r]}
                  </button>
                ))}
              </div>
              <div className="h-[200px]">
                {loading ? (
                  <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--muted)' }}>טוען גרף…</div>
                ) : chartData.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`grad-${holding.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="t" type="number" domain={['dataMin', 'dataMax']} scale="time"
                        tick={{ fill: '#5B6470', fontSize: 10 }} axisLine={false} tickLine={false}
                        tickFormatter={(t) => new Date(t).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })}
                        minTickGap={40}
                      />
                      <YAxis hide domain={['dataMin', 'dataMax']} />
                      <Tooltip
                        formatter={(v) => [fmtPrice(Number(v)), 'מחיר']}
                        labelFormatter={(t) => new Date(Number(t)).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: '2-digit' })}
                        contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                      />
                      <Area type="monotone" dataKey="c" stroke={color} strokeWidth={2} fill={`url(#grad-${holding.id})`} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-center px-4" style={{ color: 'var(--muted)' }}>
                    גרף לא זמין למכשיר זה — אין נתוני מחיר היסטוריים מהמקור
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {holding.qty != null && <Stat label="כמות" value={`${holding.qty.toLocaleString('he-IL')} יח׳`} />}
            {holding.costBasis != null && (
              <Stat label="מחיר קנייה ליחידה" value={`${holding.currency === 'USD' ? '$' : '₪'}${holding.costBasis.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
            )}
            {holding.gain != null && (
              <Stat
                label="רווח/הפסד"
                value={`${holding.gain >= 0 ? '+' : ''}${formatILS(Math.round(holding.gain))}${holding.gainPct != null ? ` (${formatPct(holding.gainPct)})` : ''}`}
                color={holding.gain >= 0 ? 'var(--primary)' : 'var(--danger)'}
              />
            )}
            {data?.high52 != null && <Stat label="גבוה 52 ש׳" value={fmtPrice(data.high52)} />}
            {data?.low52 != null && <Stat label="נמוך 52 ש׳" value={fmtPrice(data.low52)} />}
            {holding.account && <Stat label="חשבון" value={holding.account} />}
            {holding.providerName && <Stat label="חברה מנהלת" value={holding.providerName} />}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all"
              style={{ background: 'var(--primary)', color: '#0A0A0F' }}
            >
              <Pencil size={15} /> ערוך פרטים
            </button>
            <button
              onClick={() => { if (confirm(`למחוק את ${name}?`)) onDelete() }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
              style={{ background: 'var(--danger-dim)', color: 'var(--danger)', border: '1px solid rgba(248,113,113,0.25)' }}
            >
              <Trash2 size={15} /> מחק
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
      <div className="text-[11px] mb-0.5" style={{ color: 'var(--muted)' }}>{label}</div>
      <div className="font-bold num text-sm" style={{ color: color ?? 'var(--text)' }}>{value}</div>
    </div>
  )
}
