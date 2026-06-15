'use client'
import { useState, useMemo } from 'react'
import { usePortfolio } from '@/hooks/usePortfolio'
import { computeMillionairePath, computeFIRE } from '@/lib/calculations'
import { formatILS } from '@/lib/formatters'
import Card from '@/components/shared/Card'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts'
import { Target } from 'lucide-react'

function calcMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  if (principal <= 0 || termMonths <= 0) return 0
  if (annualRate === 0) return principal / termMonths
  const r = annualRate / 12
  return principal * (r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1)
}

function mortgageBalance(principal: number, annualRate: number, termMonths: number, kMonths: number): number {
  if (principal <= 0 || termMonths <= 0) return 0
  if (annualRate === 0) return Math.max(0, principal * (1 - kMonths / termMonths))
  const r = annualRate / 12
  const p = calcMonthlyPayment(principal, annualRate, termMonths)
  return Math.max(0, principal * Math.pow(1 + r, kMonths) - p * (Math.pow(1 + r, kMonths) - 1) / r)
}

export default function SimulatorsPage() {
  const { data, portfolio, loading } = usePortfolio()

  const [savingsBoost, setSavingsBoost] = useState(0)
  const [returnRate, setReturnRate] = useState(7)
  const [useCustomTarget, setUseCustomTarget] = useState(false)
  const [customTarget, setCustomTarget] = useState(2000000)
  const [downPayment, setDownPayment] = useState(500000)
  const [mortgage, setMortgage] = useState(1000000)
  const [mortgageRate, setMortgageRate] = useState(5)
  const [mortgageTerm, setMortgageTerm] = useState(25)
  const [aptRent, setAptRent] = useState(5000)
  const [aptAppreciation, setAptAppreciation] = useState(3)
  const [period, setPeriod] = useState(15)

  // ALL derived values and useMemo must be before any early return
  const aptPrice = downPayment + mortgage
  const monthlyPmt = calcMonthlyPayment(mortgage, mortgageRate / 100, mortgageTerm * 12)
  const buyingCosts = aptPrice * 0.05

  const aptData = useMemo(() => {
    return Array.from({ length: period + 1 }, (_, y) => {
      const aptValue = aptPrice * Math.pow(1 + aptAppreciation / 100, y)
      const remMortgage = mortgageBalance(mortgage, mortgageRate / 100, mortgageTerm * 12, y * 12)
      const propertyEquity = aptValue - remMortgage
      const netCashFlow = (aptRent - monthlyPmt) * 12 * y
      const aptWealth = propertyEquity + netCashFlow - buyingCosts
      const stockWealth = downPayment * Math.pow(1 + returnRate / 100, y)
      return { year: y, 'דירה': Math.round(aptWealth / 1000), 'בורסה': Math.round(stockWealth / 1000) }
    })
  }, [downPayment, mortgage, mortgageRate, mortgageTerm, aptRent, aptAppreciation, period, returnRate, aptPrice, monthlyPmt, buyingCosts])

  if (loading || !portfolio) {
    return <div className="flex items-center justify-center h-64 text-[var(--muted)]">טוען...</div>
  }

  const fireNumber = computeFIRE(portfolio, data.profile.monthlyExpenses).fireNumber
  const fireTarget = Math.round(fireNumber / 100000) * 100000
  const milTarget = useCustomTarget ? customTarget : 1_000_000
  const adjustedSavings = portfolio.monthlySavings + savingsBoost
  const milPath = computeMillionairePath(portfolio.netWorth, adjustedSavings, milTarget, returnRate / 100)
  const milYears = milPath.find(p => p.value >= milTarget)?.year ?? null

  const lastYear = aptData[aptData.length - 1]
  const aptWins = (lastYear?.['דירה'] ?? 0) > (lastYear?.['בורסה'] ?? 0)

  const TARGETS = [1_000_000, 2_000_000, 5_000_000]

  return (
    <div className="space-y-5 fade-up">
      <div>
        <h1 className="text-2xl font-black">סימולטורים</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>כלי "מה אם" לתכנון עתידי</p>
      </div>

      {/* === Millionaire / FIRE Timeline === */}
      <Card>
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="font-bold text-lg">מסלול היעד</div>
            <div className="text-sm" style={{ color: 'var(--muted)' }}>
              {milYears !== null
                ? `תגיע ל-${formatILS(milTarget, true)} בעוד ${milYears} שנים (${new Date().getFullYear() + milYears})`
                : 'לא יגיע ליעד — הגדל חיסכון'}
            </div>
          </div>
          <div className="text-3xl font-black num" style={{ color: 'var(--primary)' }}>
            {milYears !== null ? `${milYears} שנ'` : '∞'}
          </div>
        </div>

        {/* Target selector */}
        <div className="flex gap-2 flex-wrap mb-5 mt-3">
          {TARGETS.map(t => (
            <button key={t}
              onClick={() => { setUseCustomTarget(false); setCustomTarget(t) }}
              className="px-3 py-1 rounded-full text-xs font-bold transition-all"
              style={{
                background: !useCustomTarget && customTarget === t ? 'var(--primary)' : 'var(--surface2)',
                color: !useCustomTarget && customTarget === t ? '#0A0A0F' : 'var(--muted)',
                border: '1px solid var(--border)',
              }}
            >
              {formatILS(t, true)}
            </button>
          ))}
          <button
            onClick={() => { setUseCustomTarget(false); setCustomTarget(fireTarget) }}
            className="px-3 py-1 rounded-full text-xs font-bold transition-all"
            style={{
              background: !useCustomTarget && customTarget === fireTarget ? 'var(--gold)' : 'var(--surface2)',
              color: !useCustomTarget && customTarget === fireTarget ? '#0A0A0F' : 'var(--muted)',
              border: '1px solid var(--border)',
            }}
          >
            FIRE ({formatILS(fireNumber, true)})
          </button>
          <button
            onClick={() => setUseCustomTarget(true)}
            className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all"
            style={{
              background: useCustomTarget ? 'var(--primary)' : 'var(--surface2)',
              color: useCustomTarget ? '#0A0A0F' : 'var(--muted)',
              border: '1px solid var(--border)',
            }}
          >
            <Target size={11} /> מותאם
          </button>
        </div>

        {useCustomTarget && (
          <div className="mb-4">
            <SliderFull label="יעד מותאם" value={customTarget} onChange={setCustomTarget} min={500000} max={10_000_000} step={100000} format={v => formatILS(v, true)} color="primary" />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <SliderFull label="תוספת חיסכון חודשית" value={savingsBoost} onChange={setSavingsBoost} min={0} max={15000} step={500} format={v => `+${formatILS(v, true)}`} color="primary" />
          <SliderFull label="תשואה שנתית צפויה" value={returnRate} onChange={setReturnRate} min={3} max={15} step={0.5} format={v => `${v}%`} color="gold" />
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={milPath} margin={{ top: 8, right: 12, left: 12, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="year" tick={{ fill: '#5B6470', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}שנ'`} interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#5B6470', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => formatILS(Number(v), true)} width={55} />
            <Tooltip
              formatter={(v) => [formatILS(Number(v)), 'שווי נקי']}
              contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
            />
            <ReferenceLine y={milTarget} stroke="rgba(245,166,35,0.45)" strokeDasharray="5 4"
              label={{ value: formatILS(milTarget, true), fill: '#F5A623', fontSize: 11, position: 'insideTopRight' }} />
            <Line type="monotone" dataKey="value" stroke="#818CF8" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#818CF8' }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* === Apartment vs Market === */}
      <Card>
        <div className="font-bold text-lg mb-1">דירה מול בורסה</div>
        <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>
          הון עצמי {formatILS(downPayment, true)} + משכנתא {formatILS(mortgage, true)} | {period} שנ'
        </p>

        <div className="space-y-4 mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SliderFull label="הון עצמי (מקדמה)" value={downPayment} onChange={setDownPayment} min={100000} max={3000000} step={50000} format={v => formatILS(v, true)} color="info" />
            <SliderFull label="משכנתא" value={mortgage} onChange={setMortgage} min={0} max={5000000} step={50000} format={v => formatILS(v, true)} color="info" />
            <SliderFull label="ריבית משכנתא שנתית" value={mortgageRate} onChange={setMortgageRate} min={1} max={12} step={0.25} format={v => `${v}%`} color="danger" />
            <SliderFull label="תקופת משכנתא (שנים)" value={mortgageTerm} onChange={setMortgageTerm} min={10} max={30} step={1} format={v => `${v} שנ'`} color="danger" />
            <SliderFull label={'שכ"ד חודשי (הכנסה)'} value={aptRent} onChange={setAptRent} min={1000} max={20000} step={500} format={v => formatILS(v, true)} color="primary" />
            <SliderFull label="עליית ערך שנתית" value={aptAppreciation} onChange={setAptAppreciation} min={0} max={10} step={0.25} format={v => `${v}%`} color="primary" />
          </div>
          <SliderFull label="תקופת השוואה" value={period} onChange={setPeriod} min={5} max={30} step={1} format={v => `${v} שנ'`} color="gold" />
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mb-5 p-3 rounded-xl" style={{ background: 'var(--surface2)' }}>
          <div>
            <div className="text-xs mb-0.5" style={{ color: 'var(--muted)' }}>מחיר דירה</div>
            <div className="font-bold num text-sm">{formatILS(aptPrice, true)}</div>
          </div>
          <div>
            <div className="text-xs mb-0.5" style={{ color: 'var(--muted)' }}>החזר חודשי</div>
            <div className="font-bold num text-sm" style={{ color: 'var(--danger)' }}>{formatILS(Math.round(monthlyPmt), true)}</div>
          </div>
          <div>
            <div className="text-xs mb-0.5" style={{ color: 'var(--muted)' }}>דירה {period}שנ'</div>
            <div className="font-bold num text-sm" style={{ color: aptWins ? 'var(--primary)' : 'var(--muted)' }}>
              {formatILS((lastYear?.['דירה'] ?? 0) * 1000, true)}
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={aptData} margin={{ top: 8, right: 12, left: 12, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="year" tick={{ fill: '#5B6470', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}שנ'`} interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#5B6470', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₪${Number(v)}K`} width={55} />
            <Tooltip
              formatter={(v, name) => [formatILS(Number(v) * 1000, true), name === 'דירה' ? 'דירה' : `בורסה ${returnRate}%`]}
              contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
            />
            <Line type="monotone" dataKey="דירה" stroke="#FB923C" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="בורסה" stroke="#818CF8" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>

        <div className="flex gap-5 mt-3 text-xs" style={{ color: 'var(--muted)' }}>
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded-full bg-[#FB923C] inline-block" />דירה (הון עצמי + שכ"ד − החזרים)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded-full bg-[#818CF8] inline-block" />בורסה ({returnRate}% שנתי)</span>
        </div>
        <p className="text-xs mt-3" style={{ color: 'var(--muted)' }}>
          * לא כולל מס, תחזוקה ועמלות. השוואה גסה בלבד.
        </p>
      </Card>
    </div>
  )
}

interface SliderFullProps {
  label: string; value: number; onChange: (v: number) => void
  min: number; max: number; step: number; format: (v: number) => string
  color: 'primary' | 'gold' | 'danger' | 'info'
}

const SLIDER_COLORS: Record<string, string> = {
  primary: 'var(--primary)', gold: 'var(--gold)', danger: 'var(--danger)', info: 'var(--info)',
}

function SliderFull({ label, value, onChange, min, max, step, format, color }: SliderFullProps) {
  const pct = ((value - min) / (max - min)) * 100
  const c = SLIDER_COLORS[color]
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span style={{ color: 'var(--muted)' }}>{label}</span>
        <span className="font-bold num" style={{ color: c }}>{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full"
        style={{ background: `linear-gradient(to right, ${c} ${pct}%, var(--surface2) ${pct}%)` }}
      />
    </div>
  )
}
