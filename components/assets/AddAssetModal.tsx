'use client'
import { useState } from 'react'
import { Holding, HoldingType, TRADED_TYPES, PENSION_TYPES } from '@/lib/types'
import { X } from 'lucide-react'

interface Props {
  onClose: () => void
  onAdd: (h: Holding) => void
}

const CATEGORIES = [
  {
    label: 'השקעות',
    types: [
      { value: 'stock' as HoldingType, label: 'מניה' },
      { value: 'etf' as HoldingType, label: 'תעודת סל' },
      { value: 'israeli_fund' as HoldingType, label: 'קרן ישראלית' },
      { value: 'crypto' as HoldingType, label: 'קריפטו' },
      { value: 'bonds' as HoldingType, label: 'אג"ח' },
    ],
  },
  {
    label: 'נוזל / פיקדונות',
    types: [
      { value: 'cash' as HoldingType, label: 'מזומן' },
      { value: 'deposit' as HoldingType, label: 'פיקדון' },
      { value: 'savings' as HoldingType, label: 'חיסכון' },
    ],
  },
  {
    label: 'מוצרים ישראליים',
    types: [
      { value: 'pension' as HoldingType, label: 'קרן פנסיה' },
      { value: 'keren_hishtalmut' as HoldingType, label: 'קרן השתלמות' },
      { value: 'gemel' as HoldingType, label: 'גמל לפיצויים' },
      { value: 'gemel_investiga' as HoldingType, label: 'גמל להשקעה' },
    ],
  },
  {
    label: 'נדל"ן / אחר',
    types: [
      { value: 'property' as HoldingType, label: 'נדל"ן' },
      { value: 'other' as HoldingType, label: 'אחר' },
    ],
  },
]

export default function AddAssetModal({ onClose, onAdd }: Props) {
  const [type, setType] = useState<HoldingType>('stock')
  const [symbol, setSymbol] = useState('')
  const [label, setLabel] = useState('')
  const [qty, setQty] = useState('')
  const [value, setValue] = useState('')
  const [costBasis, setCostBasis] = useState('')
  const [account, setAccount] = useState('')
  const [rate, setRate] = useState('')
  const [currency, setCurrency] = useState<'ILS' | 'USD'>('ILS')
  const [monthlyContrib, setMonthlyContrib] = useState('')
  const [employerContrib, setEmployerContrib] = useState('')
  const [employeeContrib, setEmployeeContrib] = useState('')
  const [providerName, setProviderName] = useState('')
  const [expectedPension, setExpectedPension] = useState('')
  const [track, setTrack] = useState<'equity' | 'bonds' | 'mixed' | 'money_market'>('equity')

  const isTraded = TRADED_TYPES.includes(type)
  const isPension = PENSION_TYPES.includes(type)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const holding: Holding = {
      id: `h${Date.now()}`,
      type,
      ...(isTraded
        ? { symbol: symbol.toUpperCase(), qty: parseFloat(qty) || 0, currency }
        : { label: label || type, value: parseFloat(value) || 0 }
      ),
      ...(costBasis ? { costBasis: parseFloat(costBasis) } : {}),
      ...(account ? { account } : {}),
      ...(rate ? { rate: parseFloat(rate) / 100 } : {}),
      ...(isPension ? {
        track,
        taxExempt: true,
        ...(monthlyContrib ? { monthlyContribution: parseFloat(monthlyContrib) } : {}),
        ...(employerContrib ? { employerContribution: parseFloat(employerContrib) } : {}),
        ...(employeeContrib ? { employeeContribution: parseFloat(employeeContrib) } : {}),
        ...(providerName ? { providerName } : {}),
        ...(expectedPension ? { expectedMonthlyPension: parseFloat(expectedPension) } : {}),
      } : {}),
      currency: isTraded ? currency : 'ILS',
    }
    onAdd(holding)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="glass w-full max-w-lg p-6" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">הוספת נכס</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface2)]">
            <X size={18} style={{ color: 'var(--muted)' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type selector */}
          <div>
            <label className="block text-xs mb-2" style={{ color: 'var(--muted)' }}>סוג נכס</label>
            <div className="space-y-3">
              {CATEGORIES.map(cat => (
                <div key={cat.label}>
                  <div className="text-[11px] mb-1.5 font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{cat.label}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.types.map(t => (
                      <button key={t.value} type="button"
                        onClick={() => setType(t.value)}
                        className={`py-1.5 px-3 text-xs rounded-xl border transition-all ${type === t.value ? 'border-[var(--primary)] text-[var(--primary)] bg-[var(--primary-dim)]' : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--border-strong)]'}`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="h-px" style={{ background: 'var(--border)' }} />

          {/* Traded assets */}
          {isTraded ? (
            <>
              <Field label="סמל (Symbol)" value={symbol} onChange={setSymbol} placeholder="NVDA, BTC, 1168723" required />
              <Field label="כמות" value={qty} onChange={setQty} placeholder="10" type="number" required />
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>מטבע</label>
                <div className="flex gap-2">
                  {(['USD', 'ILS'] as const).map(c => (
                    <button key={c} type="button" onClick={() => setCurrency(c)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${currency === c ? 'border-[var(--primary)] text-[var(--primary)] bg-[var(--primary-dim)]' : 'border-[var(--border)] text-[var(--muted)]'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <Field label="עלות בסיס (₪ אופציונלי)" value={costBasis} onChange={setCostBasis} placeholder="שווי קנייה" type="number" />
            </>
          ) : (
            <>
              <Field label="שם" value={label} onChange={setLabel} placeholder={type === 'pension' ? 'פנסיה כללית מגדל' : type === 'keren_hishtalmut' ? 'קרן השתלמות מיטב' : 'שם הנכס'} required />
              <Field label="שווי נוכחי (₪)" value={value} onChange={setValue} placeholder="280000" type="number" required />
            </>
          )}

          {/* Pension/gemel specific fields */}
          {isPension && (
            <>
              <div className="h-px" style={{ background: 'var(--border)' }} />
              <div className="text-xs font-semibold" style={{ color: 'var(--purple)' }}>פרטי הפקדות (אופציונלי)</div>
              <Field label="חברה מנהלת" value={providerName} onChange={setProviderName} placeholder="מגדל, מיטב, הראל..." />
              <div className="grid grid-cols-3 gap-2">
                <Field label="הפקדה חודשית כוללת" value={monthlyContrib} onChange={setMonthlyContrib} placeholder="3300" type="number" />
                <Field label="חלק מעסיק" value={employerContrib} onChange={setEmployerContrib} placeholder="1430" type="number" />
                <Field label="חלק עובד" value={employeeContrib} onChange={setEmployeeContrib} placeholder="1870" type="number" />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>מסלול השקעה</label>
                <div className="flex flex-wrap gap-1.5">
                  {([['equity', 'מניות'], ['bonds', "אג\"ח"], ['mixed', 'מעורב'], ['money_market', 'כספי']] as const).map(([v, l]) => (
                    <button key={v} type="button" onClick={() => setTrack(v)}
                      className={`py-1 px-2.5 text-xs rounded-lg border transition-all ${track === v ? 'border-[var(--purple)] text-[var(--purple)] bg-[rgba(167,139,250,0.12)]' : 'border-[var(--border)] text-[var(--muted)]'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              {type === 'pension' && (
                <Field label="קצבה חודשית צפויה לפרישה (₪)" value={expectedPension} onChange={setExpectedPension} placeholder="7500" type="number" />
              )}
            </>
          )}

          {/* Cash/deposit rate */}
          {(type === 'cash' || type === 'deposit' || type === 'savings') && (
            <Field label="ריבית שנתית (%)" value={rate} onChange={setRate} placeholder="3.7" type="number" />
          )}

          <Field label="חשבון / ברוקר (אופציונלי)" value={account} onChange={setAccount} placeholder="אקסלנס, מיטב, אינטראקטיב..." />

          <button type="submit"
            className="w-full py-2.5 rounded-xl font-bold text-sm transition-all"
            style={{ background: 'var(--primary)', color: '#0A0A0F' }}>
            הוסף נכס
          </button>
        </form>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', required = false }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean
}) {
  return (
    <div>
      <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
        className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all num"
        style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
        onFocus={e => e.target.style.borderColor = 'var(--primary)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  )
}
