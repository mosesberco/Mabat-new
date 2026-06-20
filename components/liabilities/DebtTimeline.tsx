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
    .map(l => ({ ...l, pmt: Math.round(monthlyPayment(l.currentBalance, l.annualRate, l.remainingPayments)) }))
  if (active.length === 0) return null

  const maxMonths = Math.max(...active.map(l => l.remainingPayments))
  // Keep the chart light: sample every few months for long horizons.
  const step = maxMonths > 180 ? 3 : 1

  const data: Record<string, number>[] = []
  for (let m = 0; m <= maxMonths; m += step) {
    const point: Record<string, number> = { month: m }
    active.forEach((l, i) => { point[`l${i}`] = m < l.remainingPayments ? l.pmt : 0 })
    data.push(point)
  }

  const now = new Date()
  const endLabel = (months: number) => {
    const d = new Date(now)
    d.setMonth(d.getMonth() + months)
    return d.toLocaleDateString('he-IL', { month: 'short', year: 'numeric' })
  }
  const tickFmt = (m: number) => (m < 24 ? `${m} ח׳` : `${Math.round(m / 12)} שנ׳`)

  const byEnd = active.map((l, i) => ({ ...l, idx: i })).sort((a, b) => a.remainingPayments - b.remainingPayments)

  return (
    <Card>
      <div className="font-semibold mb-1">ציר זמן פירעון</div>
      <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
        התשלום החודשי יורד בכל פעם שהלוואה נגמרת. כל החובות ייפרעו בעוד {tickFmt(maxMonths)} ({endLabel(maxMonths)}).
      </p>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 12, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: '#5B6470', fontSize: 11 }} axisLine={false} tickLine={false}
            tickFormatter={tickFmt} interval="preserveStartEnd" />
          <YAxis tick={{ fill: '#5B6470', fontSize: 10 }} axisLine={false} tickLine={false}
            tickFormatter={v => formatILS(Number(v), true)} width={52} />
          <Tooltip
            labelFormatter={m => `בעוד ${tickFmt(Number(m))} · ${endLabel(Number(m))}`}
            formatter={(v, name) => [formatILS(Number(v)), active[Number(String(name).slice(1))]?.label || 'הלוואה']}
            contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
          {active.map((l, i) => (
            <Area key={l.id} type="stepAfter" dataKey={`l${i}`} stackId="1"
              stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.5} />
          ))}
        </AreaChart>
      </ResponsiveContainer>

      <div className="space-y-2 mt-4">
        {byEnd.map(l => (
          <div key={l.id} className="flex items-center gap-3 text-sm">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[l.idx % COLORS.length] }} />
            <span className="flex-1 font-medium truncate">{l.label}</span>
            <span className="text-xs num whitespace-nowrap" style={{ color: 'var(--muted)' }}>נגמרת בעוד {tickFmt(l.remainingPayments)}</span>
            <span className="text-xs font-semibold num whitespace-nowrap" style={{ color: 'var(--primary)' }}>+{formatILS(l.pmt)}/ח׳ מתפנים</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
