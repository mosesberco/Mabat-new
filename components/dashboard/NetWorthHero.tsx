'use client'
import { useState } from 'react'
import { ComputedPortfolio, NetWorthSnapshot } from '@/lib/types'
import { formatILS } from '@/lib/formatters'
import AnimatedNumber from '@/components/shared/AnimatedNumber'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface Props {
  portfolio: ComputedPortfolio
  snapshots: NetWorthSnapshot[]
  pricesLoading: boolean
}

const PERIODS = [
  { key: 'month', label: 'חודש', days: 30 },
  { key: 'half', label: 'חצי שנה', days: 182 },
  { key: 'year', label: 'שנה', days: 365 },
]

export default function NetWorthHero({ portfolio, snapshots, pricesLoading }: Props) {
  // A period is only meaningful once a snapshot at least that old exists.
  const hasHistory = (days: number) => snapshots.some(s => new Date(s.date).getTime() <= Date.now() - days * 86_400_000)
  // Default to the longest period that actually has data, so it shows the most
  // meaningful comparison instead of clicks that appear to do nothing.
  const longestAvailable = [...PERIODS].reverse().find(p => hasHistory(p.days)) ?? PERIODS[0]
  const [period, setPeriod] = useState(longestAvailable)

  // Compare against the most recent snapshot that's at least `days` old; if there
  // isn't enough history yet, fall back to the earliest snapshot ("since you started").
  const targetMs = Date.now() - period.days * 86_400_000
  const older = snapshots.filter(s => new Date(s.date).getTime() <= targetMs)
  const enoughHistory = older.length > 0
  const baseline = enoughHistory ? older[older.length - 1] : (snapshots.length >= 2 ? snapshots[0] : null)

  const change = baseline ? portfolio.netWorth - baseline.netWorth : 0
  const changePct = baseline && baseline.netWorth ? (change / Math.abs(baseline.netWorth)) * 100 : 0
  const positive = change >= 0
  const periodLabel = enoughHistory ? `מ${period.label}` : 'מאז ההתחלה'

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
          {baseline && !pricesLoading && (
            <div className={`flex items-center gap-1.5 mb-1 text-sm font-semibold ${positive ? 'text-[var(--primary)]' : 'text-[var(--danger)]'}`}>
              {positive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {positive ? '+' : ''}{formatILS(Math.round(change))} ({changePct.toFixed(1)}%)
              <span className="font-normal text-[var(--muted)]">{periodLabel}</span>
            </div>
          )}
        </div>

        {snapshots.length >= 2 && !pricesLoading && (
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            {PERIODS.map(p => {
              const active = p.key === period.key
              const available = hasHistory(p.days)
              return (
                <button key={p.key} onClick={() => { if (available) setPeriod(p) }}
                  title={available ? undefined : 'יתעדכן ככל שתצבור היסטוריה'}
                  className="px-2.5 py-1 rounded-full text-xs font-bold transition-all"
                  style={{
                    background: active ? 'var(--primary)' : 'rgba(255,255,255,0.07)',
                    color: active ? '#0A0A0F' : '#A8AEC4',
                    opacity: available || active ? 1 : 0.35,
                    cursor: available ? 'pointer' : 'default',
                  }}>
                  {p.label}
                </button>
              )
            })}
            {!enoughHistory && (
              <span className="text-[11px]" style={{ color: 'var(--muted)' }}>ההשוואה תתרחב ככל שתצבור היסטוריה</span>
            )}
          </div>
        )}

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
