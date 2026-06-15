'use client'
import { ComputedPortfolio, FinancialData } from '@/lib/types'
import { computeHealthScore } from '@/lib/calculations'
import Card from '@/components/shared/Card'

interface Props { portfolio: ComputedPortfolio; data: FinancialData }

export default function HealthScoreGauge({ portfolio, data }: Props) {
  const { score, breakdown } = computeHealthScore(portfolio, data)
  const angle = (score / 100) * 180 - 90

  const color = score >= 75 ? 'var(--primary)' : score >= 50 ? 'var(--gold)' : 'var(--danger)'
  const label = score >= 75 ? 'מצוין' : score >= 60 ? 'טוב' : score >= 40 ? 'בינוני' : 'דורש שיפור'

  return (
    <Card>
      <div className="text-sm font-semibold mb-4" style={{ color: 'var(--muted)' }}>ציון בריאות פיננסית</div>
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: 140, height: 75 }}>
          <svg viewBox="0 0 140 80" width="140" height="80">
            <path d="M 15 75 A 55 55 0 0 1 125 75" fill="none" stroke="var(--surface2)" strokeWidth="12" strokeLinecap="round" />
            <path d="M 15 75 A 55 55 0 0 1 125 75" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
              strokeDasharray="173" strokeDashoffset={173 - (score / 100) * 173}
              style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.5s ease' }}
            />
            <line
              x1="70" y1="75"
              x2={70 + 38 * Math.cos((angle - 90) * Math.PI / 180)}
              y2={75 + 38 * Math.sin((angle - 90) * Math.PI / 180)}
              stroke="var(--text)" strokeWidth="2" strokeLinecap="round"
            />
            <circle cx="70" cy="75" r="4" fill="var(--text)" />
          </svg>
          <div className="absolute bottom-0 left-0 right-0 text-center">
            <div className="text-2xl font-black num" style={{ color }}>{score}</div>
          </div>
        </div>
        <div className="text-sm font-semibold mt-1" style={{ color }}>{label}</div>
        <div className="w-full mt-4 space-y-1.5">
          {breakdown.map(b => (
            <div key={b.label} className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full" style={{ background: b.score === b.max ? 'var(--primary)' : b.score > b.max * 0.5 ? 'var(--gold)' : 'var(--danger)' }} />
              <span style={{ color: 'var(--muted)' }} className="flex-1">{b.label}</span>
              <span className="num font-semibold" style={{ color: 'var(--text)' }}>{b.score}/{b.max}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
