'use client'
import { ComputedPortfolio, NetWorthSnapshot } from '@/lib/types'
import { formatILS } from '@/lib/formatters'
import AnimatedNumber from '@/components/shared/AnimatedNumber'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface Props {
  portfolio: ComputedPortfolio
  snapshots: NetWorthSnapshot[]
  pricesLoading: boolean
}

export default function NetWorthHero({ portfolio, snapshots, pricesLoading }: Props) {
  const lastMonth = snapshots.length >= 2
    ? snapshots[snapshots.length - 2]
    : null
  const change = lastMonth ? portfolio.netWorth - lastMonth.netWorth : 0
  const changePct = lastMonth && lastMonth.netWorth ? (change / Math.abs(lastMonth.netWorth)) * 100 : 0
  const positive = change >= 0

  return (
    <div className="glass p-6 md:p-8 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #10101A, #14142A)' }}>
      <div className="absolute inset-0 opacity-20" style={{
        background: 'radial-gradient(ellipse 60% 80% at 80% 50%, rgba(129,140,248,0.2) 0%, transparent 60%)'
      }} />
      <div className="relative">
        <div className="text-sm font-medium mb-1" style={{ color: 'var(--muted)' }}>שווי נקי כולל</div>
        <div className="flex items-end gap-4 flex-wrap">
          <div className="text-4xl md:text-5xl font-black tracking-tight num" style={{ color: 'var(--primary)' }}>
            {pricesLoading
              ? <span className="opacity-50">מחשב...</span>
              : <AnimatedNumber
                  value={portfolio.netWorth}
                  formatter={v => formatILS(Math.round(v))}
                  duration={1000}
                />
            }
          </div>
          {lastMonth && !pricesLoading && (
            <div className={`flex items-center gap-1.5 mb-1 text-sm font-semibold ${positive ? 'text-[var(--primary)]' : 'text-[var(--danger)]'}`}>
              {positive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {positive ? '+' : ''}{formatILS(Math.round(change))} ({changePct.toFixed(1)}%)
              <span className="font-normal text-[var(--muted)]">מחודש קודם</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 md:gap-4 mt-5 md:mt-6">
          {[
            { label: 'סך נכסים', value: portfolio.totalAssets, color: 'var(--primary)' },
            { label: 'סך חובות', value: portfolio.totalLiabilities, color: 'var(--danger)' },
            { label: 'תזרים חודשי', value: portfolio.monthlySavings, color: 'var(--gold)' },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div className="text-xs mb-0.5" style={{ color: 'var(--muted)' }}>{label}</div>
              <div className="text-lg font-bold num" style={{ color }}>
                {formatILS(Math.round(value))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
