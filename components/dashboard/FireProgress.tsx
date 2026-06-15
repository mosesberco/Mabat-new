'use client'
import { ComputedPortfolio } from '@/lib/types'
import { computeFIRE } from '@/lib/calculations'
import { formatILS } from '@/lib/formatters'
import Card from '@/components/shared/Card'
import { Flame } from 'lucide-react'

interface Props { portfolio: ComputedPortfolio; monthlyExpenses: number }

export default function FireProgress({ portfolio, monthlyExpenses }: Props) {
  const { pct, yearsLeft, fireNumber } = computeFIRE(portfolio, monthlyExpenses)
  const color = pct >= 75 ? 'var(--primary)' : pct >= 40 ? 'var(--gold)' : 'var(--danger)'

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Flame size={15} style={{ color: 'var(--gold)' }} />
        <span className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>FIRE — עצמאות פיננסית</span>
      </div>
      <div className="text-3xl font-black num mb-1" style={{ color }}>
        {pct.toFixed(1)}%
      </div>
      <div className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
        יעד: {formatILS(Math.round(fireNumber))} · כלל ה-4%
      </div>
      <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--surface2)' }}>
        <div
          className="h-3 rounded-full transition-all duration-1000"
          style={{ width: `${Math.min(pct, 100)}%`, background: `linear-gradient(90deg, ${color}, rgba(129,140,248,0.5))` }}
        />
      </div>
      <div className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>
        {pct >= 100
          ? '🎉 הגעת לעצמאות פיננסית!'
          : yearsLeft < 999
          ? `עוד כ-${yearsLeft} שנים בקצב הנוכחי (7% תשואה)`
          : 'הגדל את החיסכון החודשי כדי להגיע ל-FIRE'
        }
      </div>
    </Card>
  )
}
