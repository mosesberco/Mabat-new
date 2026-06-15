'use client'
import { useState } from 'react'
import { usePortfolio } from '@/hooks/usePortfolio'
import { computeMillionairePath, computeFIRE } from '@/lib/calculations'
import { formatILS } from '@/lib/formatters'
import Card from '@/components/shared/Card'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts'

export default function SimulatorsPage() {
  const { data, portfolio, loading } = usePortfolio()

  const [savingsBoost, setSavingsBoost] = useState(0)
  const [returnRate, setReturnRate] = useState(7)
  const [aptPrice, setAptPrice] = useState(1500000)
  const [aptRent, setAptRent] = useState(5000)
  const [aptAppreciation, setAptAppreciation] = useState(3)

  if (loading || !portfolio) {
    return <div className="flex items-center justify-center h-64 text-[var(--muted)]">טוען...</div>
  }

  const adjustedSavings = portfolio.monthlySavings + savingsBoost
  const milPath = computeMillionairePath(portfolio.netWorth, adjustedSavings, 1_000_000, returnRate / 100)
  const milPathFIRE = computeMillionairePath(portfolio.netWorth, adjustedSavings, computeFIRE(portfolio, data.profile.monthlyExpenses).fireNumber, returnRate / 100)

  const milYears = milPath.find(p => p.value >= 1_000_000)?.year ?? null

  // Apt vs market comparison (10yr)
  const aptData = Array.from({ length: 11 }, (_, y) => {
    const aptValue = aptPrice * Math.pow(1 + aptAppreciation / 100, y) - aptPrice
    const rentIncome = aptRent * 12 * y
    const aptTotal = aptValue + rentIncome - aptPrice * 0.05 // buying costs
    const marketValue = aptPrice * Math.pow(1 + returnRate / 100, y) - aptPrice
    return { year: y, דירה: Math.round(aptTotal / 1000), בורסה: Math.round(marketValue / 1000) }
  })

  return (
    <div className="space-y-5 fade-up">
      <div>
        <h1 className="text-2xl font-black">סימולטורים</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>כלי "מה אם" לתכנון עתידי</p>
      </div>

      {/* Millionaire timeline */}
      <Card>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="font-bold text-lg">מסלול המיליון</div>
            <div className="text-sm" style={{ color: 'var(--muted)' }}>
              {milYears !== null
                ? `תגיע למיליון ₪ בעוד ${milYears} שנים (ב-${new Date().getFullYear() + milYears})`
                : 'לא יגיע למיליון — הגדל חיסכון'
              }
            </div>
          </div>
          <div className="text-3xl font-black num" style={{ color: 'var(--primary)' }}>
            {milYears !== null ? `${milYears} שנ'` : '∞'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <Slider label="תוספת חיסכון חודשית" value={savingsBoost} onChange={setSavingsBoost} min={0} max={10000} step={500} format={v => `+${formatILS(v)}`} color="primary" />
          <Slider label="תשואה שנתית צפויה" value={returnRate} onChange={setReturnRate} min={3} max={15} step={0.5} format={v => `${v}%`} color="gold" />
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={milPath} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="year" tick={{ fill: '#5B6470', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v} שנ'`} />
            <YAxis hide />
            <Tooltip
              formatter={(v) => [formatILS(Number(v)), 'שווי נקי']}
              contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
            />
            <ReferenceLine y={1000000} stroke="rgba(245,166,35,0.4)" strokeDasharray="4 4" label={{ value: '₪1M', fill: '#F5A623', fontSize: 11 }} />
            <Line type="monotone" dataKey="value" stroke="#818CF8" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Apartment vs Market */}
      <Card>
        <div className="font-bold text-lg mb-1">דירה מול בורסה</div>
        <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
          אם תשקיע {formatILS(aptPrice)} — מה עדיף? (10 שנה, רווח נקי באלפי ₪)
        </p>
        <div className="grid grid-cols-3 gap-4 mb-5">
          <Slider label="מחיר דירה" value={aptPrice} onChange={setAptPrice} min={500000} max={5000000} step={100000} format={v => formatILS(v, true)} color="info" />
          <Slider label={'שכ"ד חודשי'} value={aptRent} onChange={setAptRent} min={2000} max={15000} step={500} format={v => formatILS(v, true)} color="info" />
          <Slider label="עליית ערך שנתית" value={aptAppreciation} onChange={setAptAppreciation} min={0} max={10} step={0.5} format={v => `${v}%`} color="info" />
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={aptData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="year" tick={{ fill: '#5B6470', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v} שנ'`} />
            <YAxis hide />
            <Tooltip
              formatter={(v) => [`${Number(v)}K ₪`, '']}
              contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
            />
            <Line type="monotone" dataKey="דירה" stroke="#FB923C" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="בורסה" stroke="#818CF8" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-xs" style={{ color: 'var(--muted)' }}>
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#FB923C] inline-block" />דירה (כולל שכ"ד ועליית ערך)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#818CF8] inline-block" />בורסה ({returnRate}% שנתי)</span>
        </div>
        <p className="text-xs mt-3" style={{ color: 'var(--muted)' }}>* הדירה כוללת 5% עלויות רכישה. לא כולל ריבית משכנתא, תחזוקה, ומס שבח. השוואה גסה בלבד.</p>
      </Card>
    </div>
  )
}

interface SliderProps {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; format: (v: number) => string
  color: 'primary' | 'gold' | 'danger' | 'info'
}

const SLIDER_COLORS = { primary: 'var(--primary)', gold: 'var(--gold)', danger: 'var(--danger)', info: 'var(--info)' }

function Slider({ label, value, onChange, min, max, step, format, color }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div className="flex justify-between text-xs mb-2">
        <span style={{ color: 'var(--muted)' }}>{label}</span>
        <span className="font-bold num" style={{ color: SLIDER_COLORS[color] }}>{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{ background: `linear-gradient(to right, ${SLIDER_COLORS[color]} ${pct}%, var(--surface2) ${pct}%)` }}
      />
    </div>
  )
}
