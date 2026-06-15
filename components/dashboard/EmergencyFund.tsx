'use client'
import { ComputedPortfolio } from '@/lib/types'
import { formatILS } from '@/lib/formatters'
import Card from '@/components/shared/Card'
import { Shield } from 'lucide-react'

interface Props { portfolio: ComputedPortfolio; target: number }

export default function EmergencyFund({ portfolio, target }: Props) {
  const months = portfolio.emergencyMonths
  const color = months >= 6 ? 'var(--primary)' : months >= 3 ? 'var(--gold)' : 'var(--danger)'
  const label = months >= 6 ? 'מצוין' : months >= 3 ? 'בסיסי' : 'סיכון גבוה'
  const pct = Math.min((months / target) * 100, 100)

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Shield size={15} style={{ color }} />
        <span className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>כרית ביטחון</span>
      </div>
      <div className="text-3xl font-black num mb-0.5" style={{ color }}>
        {months.toFixed(1)}
      </div>
      <div className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
        חודשים | יעד: {target} חודשים
      </div>
      <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--surface2)' }}>
        <div className="h-3 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="mt-3 flex justify-between text-xs">
        <span style={{ color: 'var(--muted)' }}>{label}</span>
        <span style={{ color: 'var(--muted)' }}>נזיל: {formatILS(Math.round(portfolio.liquidAssets))}</span>
      </div>
    </Card>
  )
}
