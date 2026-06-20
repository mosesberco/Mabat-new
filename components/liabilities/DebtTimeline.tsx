'use client'
import { Liability } from '@/lib/types'
import { monthlyPayment } from '@/lib/calculations'
import { formatILS } from '@/lib/formatters'
import Card from '@/components/shared/Card'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const COLORS = ['#818CF8', '#F5A623', '#F87171', '#60A5FA', '#C084FC', '#34D399', '#FB923C', '#A78BFA']

export default function DebtTimeline({ liabilities }: { liabilities: Liability[] }) {
  const active = liabilities
    .filter(l => l.remainingPayments > 0 && l.currentBalance > 0)
    .map((l, i) => ({
      ...l,
      pmt: Math.round(monthlyPayment(l.currentBalance, l.annualRate, l.remainingPayments)),
      color: COLORS[i % COLORS.length],
    }))
  if (active.length === 0) return null

  const maxMonths = Math.max(...active.map(l => l.remainingPayments))
  const step = maxMonths > 180 ? 3 : 1
  const data: Record<string, number>[] = []
  for (let m = 0; m <= maxMonths; m += step) {
    const point: Record<string, number> = { month: m }
    active.forEach((l, i) => { point[`l${i}`] = m < l.remainingPayments ? l.pmt : 0 })
    data.push(point)
  }

  const now = new Date()
  const dateAt = (months: number) => {
    const d = new Date(now)
    d.setMonth(d.getMonth() + months)
    return d.toLocaleDateString('he-IL', { month: 'short', year: 'numeric' })
  }
  const dur = (m: number) => (m < 24 ? `${m} ח׳` : `${Math.round(m / 12)} שנ׳`)
  const totalNow = active.reduce((s, l) => s + l.pmt, 0)
  const byEnd = [...active].sort((a, b) => a.remainingPayments - b.remainingPayments)

  return (
    <Card>
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="min-w-0">
          <div className="font-bold text-lg">ציר זמן פירעון</div>
          <div className="text-sm" style={{ color: 'var(--muted)' }}>
            התשלום ({formatILS(totalNow)}/חודש) יורד בכל פעם שהלוואה נגמרת
          </div>
        </div>
        <div className="text-left flex-shrink-0">
          <div className="text-[11px]" style={{ color: 'var(--muted)' }}>חופש מחובות</div>
          <div className="text-xl font-black num" style={{ color: 'var(--primary)' }}>{dur(maxMonths)}</div>
          <div className="text-[11px] num" style={{ color: 'var(--muted)' }}>{dateAt(maxMonths)}</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={210}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: '#5B6470', fontSize: 11 }} axisLine={false} tickLine={false}
            tickFormatter={dur} interval="preserveStartEnd" minTickGap={40} />
          <YAxis tick={{ fill: '#5B6470', fontSize: 10 }} axisLine={false} tickLine={false}
            tickFormatter={v => formatILS(Number(v), true)} width={50} />
          <Tooltip
            labelFormatter={m => `בעוד ${dur(Number(m))} · ${dateAt(Number(m))}`}
            formatter={(v, name) => [formatILS(Number(v)), active[Number(String(name).slice(1))]?.label || 'הלוואה']}
            contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
          {active.map((l, i) => (
            <Area key={l.id} type="stepAfter" dataKey={`l${i}`} stackId="1" isAnimationActive={false}
              stroke={l.color} strokeWidth={1.5} fill={l.color} fillOpacity={0.5} />
          ))}
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-5 space-y-2.5">
        {byEnd.map(l => (
          <div key={l.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: 'var(--surface2)' }}>
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: l.color }} />
            <span className="flex-1 font-medium truncate text-sm">{l.label}</span>
            <span className="text-xs num whitespace-nowrap" style={{ color: 'var(--muted)' }}>נגמרת בעוד {dur(l.remainingPayments)}</span>
            <span className="text-xs font-bold num whitespace-nowrap px-2 py-0.5 rounded-md"
              style={{ color: 'var(--primary)', background: 'var(--primary-dim)' }}>+{formatILS(l.pmt)}/ח׳</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
