'use client'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Holding, HoldingType, Currency, TRADED_TYPES, PENSION_TYPES, FIAT_CURRENCIES, CRYPTO_CURRENCIES, CURRENCY_LABELS, CURRENCY_SYMBOLS, isCryptoCurrency } from '@/lib/types'
import { X } from 'lucide-react'

interface Props {
  onClose: () => void
  onAdd: (h: Holding) => void
  initial?: Holding
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
    label: 'נוזלי / פיקדונות',
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

const numStr = (n?: number) => (n != null ? String(n) : '')

export default function AddAssetModal({ onClose, onAdd, initial }: Props) {
  const [type, setType] = useState<HoldingType>(initial?.type ?? 'stock')
  const [symbol, setSymbol] = useState(initial?.symbol ?? '')
  const [label, setLabel] = useState(initial?.label ?? '')
  const [qty, setQty] = useState(numStr(initial?.qty))
  const [value, setValue] = useState(numStr(initial?.value))
  const [costBasis, setCostBasis] = useState(numStr(initial?.costBasis))
  const [account, setAccount] = useState(initial?.account ?? '')
  const [rate, setRate] = useState(initial?.rate != null ? String(+(initial.rate * 100).toFixed(4)) : '')
  const [currency, setCurrency] = useState<Currency>(initial?.currency ?? 'ILS')
  const [monthlyContrib, setMonthlyContrib] = useState(numStr(initial?.monthlyContribution))
  const [employerContrib, setEmployerContrib] = useState(numStr(initial?.employerContribution))
  const [employeeContrib, setEmployeeContrib] = useState(numStr(initial?.employeeContribution))
  const [providerName, setProviderName] = useState(initial?.providerName ?? '')
  const [expectedPension, setExpectedPension] = useState(numStr(initial?.expectedMonthlyPension))
  const [track, setTrack] = useState<'equity' | 'bonds' | 'mixed' | 'money_market'>(initial?.track ?? 'equity')

  // Lock the page behind the modal so the bottom-sheet doesn't scroll-bleed on touch.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const isTraded = TRADED_TYPES.includes(type)
  const isPension = PENSION_TYPES.includes(type)
  const isCashLike = type === 'cash' || type === 'deposit' || type === 'savings'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const holding: Holding = {
      id: initial?.id ?? `h${Date.now()}`,
      type,
      // Preserve fields the form doesn't model (e.g. manualAppraisal from CSV import)
      // so editing a holding doesn't silently drop them.
      ...(initial?.manualAppraisal ? { manualAppraisal: initial.manualAppraisal } : {}),
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
      currency: isTraded || isCashLike ? currency : 'ILS',
    }
    onAdd(holding)
    onClose()
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="glass w-full flex flex-col md:flex-row rounded-t-[20px] md:rounded-[20px]"
        style={{ maxWidth: 720, maxHeight: '92vh', overflow: 'hidden' }}
      >
        {/* Type selector — compact chips on mobile, sidebar on desktop */}
        <div
          className="flex-shrink-0 p-4 md:p-5 md:w-56 md:overflow-y-auto md:max-h-none max-h-[32vh] overflow-y-auto"
          style={{
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface2)',
          }}
        >
          <div className="text-xs font-bold mb-3 md:mb-4" style={{ color: 'var(--muted)' }}>סוג נכס</div>
          <div className="space-y-3 md:space-y-4">
            {CATEGORIES.map(cat => (
              <div key={cat.label}>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-1.5 md:mb-2" style={{ color: 'var(--muted2)' }}>
                  {cat.label}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cat.types.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className="px-3 py-1.5 rounded-xl text-xs md:text-sm transition-all md:w-full md:text-right"
                      style={{
                        background: type === t.value ? 'var(--primary-dim)' : 'var(--surface)',
                        color: type === t.value ? 'var(--primary)' : 'var(--muted)',
                        border: type === t.value ? '1px solid rgba(129,140,248,0.25)' : '1px solid var(--border)',
                        fontWeight: type === t.value ? 600 : 400,
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between p-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-lg font-bold">{initial ? 'עריכת נכס' : 'הוספת נכס'}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface2)]">
              <X size={18} style={{ color: 'var(--muted)' }} />
            </button>
          </div>

          {/* Scrollable form body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">

            {/* Traded assets */}
            {isTraded ? (
              <>
                <Field label="סמל (Symbol)" value={symbol} onChange={setSymbol} placeholder="NVDA, BTC, 1168723" required />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="כמות" value={qty} onChange={setQty} placeholder="10" type="number" required />
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>מטבע</label>
                    <div className="flex gap-2">
                      {(['ILS', 'USD'] as const).map(c => (
                        <button key={c} type="button" onClick={() => setCurrency(c)}
                          className="flex-1 py-2 text-sm rounded-xl border transition-all font-medium"
                          style={{
                            background: currency === c ? 'var(--primary-dim)' : 'var(--surface2)',
                            color: currency === c ? 'var(--primary)' : 'var(--muted)',
                            border: currency === c ? '1px solid rgba(129,140,248,0.3)' : '1px solid var(--border)',
                          }}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <Field label="מחיר קנייה ליחידה (אופציונלי)" value={costBasis} onChange={setCostBasis} placeholder="מחיר ממוצע ליחידה" type="number" />
              </>
            ) : isCashLike ? (
              <div className="grid grid-cols-1 gap-3">
                <Field label="שם" value={label} onChange={setLabel} placeholder="מזומן, פיקדון דולרי, ארנק קריפטו..." required />
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>מטבע / נכס</label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value as Currency)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  >
                    <optgroup label="מטבעות">
                      {FIAT_CURRENCIES.map(c => <option key={c} value={c}>{CURRENCY_LABELS[c]}</option>)}
                    </optgroup>
                    <optgroup label="קריפטו">
                      {CRYPTO_CURRENCIES.map(c => <option key={c} value={c}>{CURRENCY_LABELS[c]}</option>)}
                    </optgroup>
                  </select>
                </div>
                <Field
                  label={isCryptoCurrency(currency) ? `כמות (${currency})` : `סכום (${CURRENCY_SYMBOLS[currency] ?? currency})`}
                  value={value} onChange={setValue}
                  placeholder={isCryptoCurrency(currency) ? '0.5' : '5000'} type="number" required
                />
                {currency !== 'ILS' && (
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>הסכום יומר לשקלים לפי שער/מחיר חי.</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                <Field
                  label="שם"
                  value={label}
                  onChange={setLabel}
                  placeholder={type === 'pension' ? 'פנסיה כללית מגדל' : type === 'keren_hishtalmut' ? 'קרן השתלמות מיטב' : 'שם הנכס'}
                  required
                />
                <Field label="שווי נוכחי (₪)" value={value} onChange={setValue} placeholder="280000" type="number" required />
              </div>
            )}

            {/* Pension / gemel fields */}
            {isPension && (
              <>
                <div className="h-px" style={{ background: 'var(--border)' }} />
                <div className="text-xs font-semibold" style={{ color: 'var(--purple)' }}>פרטי הפקדות (אופציונלי)</div>
                <Field label="חברה מנהלת" value={providerName} onChange={setProviderName} placeholder="מגדל, מיטב, הראל..." />
                <div className="grid grid-cols-3 gap-2">
                  <Field label="הפקדה חודשית" value={monthlyContrib} onChange={setMonthlyContrib} placeholder="3300" type="number" />
                  <Field label="חלק מעסיק" value={employerContrib} onChange={setEmployerContrib} placeholder="1430" type="number" />
                  <Field label="חלק עובד" value={employeeContrib} onChange={setEmployeeContrib} placeholder="1870" type="number" />
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>מסלול השקעה</label>
                  <div className="flex flex-wrap gap-2">
                    {([['equity', 'מניות'], ['bonds', 'אג"ח'], ['mixed', 'מעורב'], ['money_market', 'כספי']] as const).map(([v, l]) => (
                      <button key={v} type="button" onClick={() => setTrack(v)}
                        className="py-1.5 px-3 text-xs rounded-xl border transition-all"
                        style={{
                          background: track === v ? 'rgba(167,139,250,0.12)' : 'var(--surface2)',
                          color: track === v ? 'var(--purple)' : 'var(--muted)',
                          border: track === v ? '1px solid rgba(167,139,250,0.3)' : '1px solid var(--border)',
                        }}>
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

            {/* Rate for cash/deposit */}
            {(type === 'cash' || type === 'deposit' || type === 'savings') && (
              <Field label="ריבית שנתית (%)" value={rate} onChange={setRate} placeholder="3.7" type="number" />
            )}

            <Field label="חשבון / ברוקר (אופציונלי)" value={account} onChange={setAccount} placeholder="אקסלנס, מיטב, אינטראקטיב..." />

            <button
              type="submit"
              className="w-full py-3 rounded-xl font-bold text-sm transition-all"
              style={{ background: 'var(--primary)', color: '#0A0A0F' }}
            >
              {initial ? 'שמור שינויים' : 'הוסף נכס'}
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', required = false }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean
}) {
  return (
    <div>
      <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={required}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
        style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
        onFocus={e => e.target.style.borderColor = 'var(--primary)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  )
}
