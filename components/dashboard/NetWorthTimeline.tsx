'use client'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { NetWorthSnapshot } from '@/lib/types'
import { formatILS, formatShortDate } from '@/lib/formatters'
import Card from '@/components/shared/Card'

interface Props { snapshots: NetWorthSnapshot[] }

export default function NetWorthTimeline({ snapshots }: Props) {
  if (snapshots.length < 2) {
    return (
      <Card>
        <div className="text-sm font-semibold mb-2" style={{ color: 'var(--muted)' }}>מסלול הון</div>
        <div className="flex items-center justify-center h-32 text-sm" style={{ color: 'var(--muted)' }}>
          גרף יופיע לאחר מספר ביקורים — נתון נשמר כל יום
        </div>
      </Card>
    )
  }

  const data = snapshots.map(s => ({ ...s, label: formatShortDate(s.date) }))

  return (
    <Card>
      <div className="text-sm font-semibold mb-4" style={{ color: 'var(--muted)' }}>מסלול הון ({snapshots.length} נק')</div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#818CF8" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#818CF8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#5B6470', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip
            formatter={(v) => [formatILS(Number(v)), 'שווי נקי']}
            contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
          />
          <Area type="monotone" dataKey="netWorth" stroke="#818CF8" strokeWidth={2} fill="url(#nwGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}
