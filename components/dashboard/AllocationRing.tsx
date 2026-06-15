'use client'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { ComputedPortfolio } from '@/lib/types'
import { formatILS } from '@/lib/formatters'
import Card from '@/components/shared/Card'

interface Props { portfolio: ComputedPortfolio }

export default function AllocationRing({ portfolio }: Props) {
  const data = portfolio.allocationByType.filter(d => d.value > 0)

  return (
    <Card>
      <div className="text-sm font-semibold mb-4" style={{ color: 'var(--muted)' }}>פיזור נכסים</div>
      <div className="flex gap-4 items-center">
        <ResponsiveContainer width={140} height={140}>
          <PieChart>
            <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={44} outerRadius={66} paddingAngle={2} startAngle={90} endAngle={-270}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => [formatILS(Number(v)), '']}
              contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-1.5 min-w-0">
          {data.map(d => (
            <div key={d.name} className="flex items-center gap-2 text-xs">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
              <span className="truncate flex-1" style={{ color: 'var(--muted)' }}>{d.name}</span>
              <span className="font-semibold num" style={{ color: 'var(--text)' }}>
                {portfolio.totalAssets > 0 ? ((d.value / portfolio.totalAssets) * 100).toFixed(0) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
