'use client'
import { usePortfolio } from '@/hooks/usePortfolio'
import { sectorBreakdown, computeHealthScore } from '@/lib/calculations'
import { formatILS, formatPct } from '@/lib/formatters'
import Card from '@/components/shared/Card'
import Badge from '@/components/shared/Badge'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { AlertTriangle, CheckCircle, TrendingUp, Info } from 'lucide-react'

export default function AnalysisPage() {
  const { data, portfolio, loading } = usePortfolio()

  if (loading || !portfolio) {
    return <div className="flex items-center justify-center h-64 text-[var(--muted)]">טוען...</div>
  }

  const { score, breakdown } = computeHealthScore(portfolio, data)
  const sectors = sectorBreakdown(portfolio.holdings)

  // Auto-generated insights
  const insights: { type: 'warn' | 'ok' | 'info'; text: string }[] = []

  // Concentration warnings
  portfolio.holdings.forEach(h => {
    const pct = portfolio.totalAssets > 0 ? (h.liveValue / portfolio.totalAssets) * 100 : 0
    if (pct > 40) {
      insights.push({ type: 'warn', text: `${h.symbol ?? h.label} מהווה ${pct.toFixed(0)}% מהתיק — ריכוז גבוה מומלץ לא לעלות על 25%` })
    }
  })

  // Sector concentration
  const techSector = sectors.find(s => s.sector === 'Tech')
  if (techSector && techSector.pct > 50) {
    insights.push({ type: 'warn', text: `${techSector.pct.toFixed(0)}% מהתיק בטכנולוגיה — שקול פיזור לסקטורים נוספים` })
  }

  // Cash drag
  const cashHoldings = portfolio.holdings.filter(h => h.type === 'cash')
  const totalCash = cashHoldings.reduce((s, h) => s + h.liveValue, 0)
  const cashPct = portfolio.totalAssets > 0 ? (totalCash / portfolio.totalAssets) * 100 : 0
  if (cashPct > 30) {
    const annualOpportunityCost = totalCash * (0.10 - 0.037)
    insights.push({ type: 'warn', text: `${cashPct.toFixed(0)}% מהתיק במזומן/פיקדון — עלות הזדמנות: ${formatILS(Math.round(annualOpportunityCost))} לשנה` })
  }

  // Debt vs return
  data.liabilities.forEach(l => {
    const cashRate = cashHoldings.find(h => h.rate)?.rate ?? 0
    if (l.annualRate < (cashRate ?? 0) && totalCash > l.currentBalance) {
      insights.push({ type: 'info', text: `ההלוואה "${l.label}" ב-${(l.annualRate * 100).toFixed(1)}% זולה מהפיקדון (${((cashRate ?? 0) * 100).toFixed(1)}%) — אין טעם לסגור אותה מוקדם` })
    }
  })

  // Tax exposure
  const totalGain = portfolio.holdings.reduce((s, h) => s + (h.gain && h.gain > 0 ? h.gain : 0), 0)
  const taxExposure = totalGain * 0.25
  if (taxExposure > 5000) {
    insights.push({ type: 'info', text: `חשיפת מס רווחי הון משוערת: ${formatILS(Math.round(taxExposure))} (25% על רווחים לא ממומשים של ${formatILS(Math.round(totalGain))})` })
  }

  // Savings rate
  if (portfolio.savingsRate >= 30) {
    insights.push({ type: 'ok', text: `שיעור חיסכון מצוין: ${portfolio.savingsRate.toFixed(0)}% — אתה בנתיב מהיר לעצמאות פיננסית` })
  } else if (portfolio.savingsRate < 10) {
    insights.push({ type: 'warn', text: `שיעור חיסכון נמוך: ${portfolio.savingsRate.toFixed(0)}% — יעד מומלץ: לפחות 20%` })
  }

  const COLORS_SECTOR = ['#818CF8', '#F5A623', '#4DB8FF', '#A78BFA', '#FF6B6B', '#FB923C']

  return (
    <div className="space-y-5 fade-up">
      <div>
        <h1 className="text-2xl font-black">ניתוח</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>תובנות אוטומטיות מבוססות על הנתונים שלך</p>
      </div>

      {/* Insights */}
      <div className="space-y-3">
        {insights.length === 0 && (
          <Card>
            <div className="text-center py-4 text-[var(--muted)]">הוסף נכסים כדי לקבל תובנות</div>
          </Card>
        )}
        {insights.map((ins, i) => (
          <Card key={i} className={ins.type === 'warn' ? 'border-[rgba(255,107,107,0.25)]' : ins.type === 'ok' ? 'border-[rgba(129,140,248,0.25)]' : 'border-[rgba(77,184,255,0.25)]'}>
            <div className="flex gap-3 items-start">
              {ins.type === 'warn' && <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--danger)' }} />}
              {ins.type === 'ok' && <CheckCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--primary)' }} />}
              {ins.type === 'info' && <Info size={16} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--info)' }} />}
              <p className="text-sm leading-relaxed">{ins.text}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        {/* Health Score Breakdown */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-sm" style={{ color: 'var(--muted)' }}>ציון בריאות: {score}/100</span>
            <Badge label={score >= 75 ? 'מצוין' : score >= 50 ? 'טוב' : 'דורש שיפור'} color={score >= 75 ? 'primary' : score >= 50 ? 'gold' : 'danger'} />
          </div>
          <div className="space-y-3">
            {breakdown.map(b => (
              <div key={b.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: 'var(--muted)' }}>{b.label}</span>
                  <span className="num">{b.score}/{b.max} · {b.note}</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: 'var(--surface2)' }}>
                  <div className="h-2 rounded-full transition-all duration-700"
                    style={{ width: `${(b.score / b.max) * 100}%`, background: b.score === b.max ? 'var(--primary)' : b.score > b.max * 0.5 ? 'var(--gold)' : 'var(--danger)' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Sector Breakdown */}
        <Card>
          <div className="font-semibold text-sm mb-4" style={{ color: 'var(--muted)' }}>פיזור סקטורים</div>
          {sectors.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sectors} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="sector" width={80} tick={{ fill: '#5B6470', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v) => [`${Number(v).toFixed(1)}%`, 'אחוז']}
                  contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="pct" radius={4}>
                  {sectors.map((_, i) => <Cell key={i} fill={COLORS_SECTOR[i % COLORS_SECTOR.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-32 text-[var(--muted)] text-sm">הוסף נכסים נסחרים לניתוח סקטורים</div>
          )}
        </Card>
      </div>

      {/* Tax & P&L summary */}
      <Card>
        <div className="font-semibold text-sm mb-4" style={{ color: 'var(--muted)' }}>רווח/הפסד לא ממומש</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {[
            { label: 'רווחים לא ממומשים', value: portfolio.holdings.reduce((s, h) => s + (h.gain && h.gain > 0 ? h.gain : 0), 0), color: 'var(--primary)' },
            { label: 'הפסדים לא ממומשים', value: portfolio.holdings.reduce((s, h) => s + (h.gain && h.gain < 0 ? Math.abs(h.gain) : 0), 0), color: 'var(--danger)' },
            { label: 'מס רווחי הון משוער (25%)', value: taxExposure, color: 'var(--gold)' },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>{label}</div>
              <div className="text-xl font-black num" style={{ color }}>{formatILS(Math.round(value))}</div>
            </div>
          ))}
        </div>
        <p className="text-xs mt-4" style={{ color: 'var(--muted)' }}>
          * חישוב לפי עלות בסיס שהוזנה ידנית. המס בפועל תלוי בסוג הנכס, סוג החשבון ותזמון המכירה. אין כאן ייעוץ מס.
        </p>
      </Card>
    </div>
  )
}
