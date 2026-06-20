'use client'
import { useState, useEffect } from 'react'
import { usePortfolio } from '@/hooks/usePortfolio'
import { FixedExpense, IncomeSource } from '@/lib/types'
import { grossToNet, incomeNet, DEFAULT_CREDIT_POINTS } from '@/lib/israeliSalary'
import { formatILS } from '@/lib/formatters'
import Card from '@/components/shared/Card'
import { Trash2, Save, Plus } from 'lucide-react'

export default function CashflowPage() {
  const { data, portfolio, loading, update } = usePortfolio()
  const [saved, setSaved] = useState(false)
  const [income, setIncome] = useState(data.income)
  const [expenses, setExpenses] = useState<FixedExpense[]>(data.expenses)

  // usePortfolio loads from localStorage asynchronously, so re-sync the form once
  // real data arrives (and after an import). Editing only touches local state, so
  // this never clobbers in-progress edits.
  useEffect(() => {
    setIncome(data.income)
    if (data.expenses.length > 0) setExpenses(data.expenses)
    // Soft-migrate a legacy single "monthly expenses" figure into one editable row.
    else if (data.profile.monthlyExpenses > 0) setExpenses([{ id: `e${Date.now()}`, label: 'הוצאות כלליות', amount: data.profile.monthlyExpenses }])
    else setExpenses([])
  }, [data.income, data.expenses, data.profile.monthlyExpenses])

  if (loading || !portfolio) return <div className="flex items-center justify-center h-64 text-[var(--muted)]">טוען...</div>

  const handleSave = () => {
    const total = expenses.reduce((s, e) => s + (e.amount || 0), 0)
    // Persist the derived net for gross-mode incomes so the stored `net` (and its
    // Excel cell) stays consistent with the gross→net engine.
    const syncedIncome = income.map(inc => inc.inputMode === 'gross'
      ? { ...inc, net: grossToNet(inc.gross, { hasPension: inc.hasPension, hasKeren: inc.hasKeren, creditPoints: inc.creditPoints }).net }
      : inc)
    update(d => ({
      ...d,
      // Keep the legacy profile.monthlyExpenses synced to the itemized total.
      profile: { ...d.profile, monthlyExpenses: total },
      income: syncedIncome,
      expenses,
    }))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Live summary from the in-progress edits (debt payments come from liabilities).
  const liveIncome = income.reduce((s, inc) => s + incomeNet(inc), 0)
  const liveExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0)
  const liveOut = liveExpenses + portfolio.monthlyDebtPayments
  const liveSavings = liveIncome - liveOut
  const liveRate = liveIncome > 0 ? (liveSavings / liveIncome) * 100 : 0

  return (
    <div className="space-y-5 fade-up max-w-xl">
      <div>
        <h1 className="text-2xl font-black">תזרים חודשי</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>הכנסות והוצאות — הבסיס לחיסכון, FIRE וכרית הביטחון</p>
      </div>

      <Card>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>הכנסה (נטו)</div>
            <div className="font-black num">{formatILS(Math.round(liveIncome))}</div>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>הוצאות + חוב</div>
            <div className="font-black num" style={{ color: 'var(--danger)' }}>{formatILS(Math.round(liveOut))}</div>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>חיסכון חודשי</div>
            <div className="font-black num" style={{ color: liveSavings >= 0 ? 'var(--primary)' : 'var(--danger)' }}>{formatILS(Math.round(liveSavings))}</div>
            <div className="text-[11px] num" style={{ color: 'var(--muted)' }}>{liveRate.toFixed(0)}% מההכנסה</div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="font-semibold mb-1">הכנסות</div>
        <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>הזן נטו, או ברוטו — והמערכת תקזז מס הכנסה, ביטוח לאומי, פנסיה וקה"ש (הערכה לפי 2026).</p>
        <div className="space-y-3">
          {income.map((inc, i) => (
            <IncomeRow key={inc.id}
              inc={inc}
              onChange={next => setIncome(arr => arr.map((x, j) => j === i ? next : x))}
              onRemove={() => setIncome(arr => arr.filter((_, j) => j !== i))} />
          ))}
          <button onClick={() => setIncome(arr => [...arr, { id: `i${Date.now()}`, label: '', gross: 0, net: 0, frequency: 'monthly' }])}
            className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1" style={{ color: 'var(--primary)', background: 'var(--primary-dim)' }}>
            <Plus size={12} /> הוסף הכנסה
          </button>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-1">
          <div className="font-semibold">הוצאות קבועות</div>
          <div className="text-sm num" style={{ color: 'var(--muted)' }}>
            סה"כ {formatILS(liveExpenses)}/חודש
          </div>
        </div>
        <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>רכב, דיור, ביטוחים, מנויים… משמש לחישוב תזרים, שיעור חיסכון ו-FIRE.</p>
        <div className="space-y-3">
          {expenses.map((exp, i) => (
            <div key={exp.id} className="flex gap-3 items-center">
              <input value={exp.label} onChange={e => setExpenses(arr => arr.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                className="flex-1 px-3 py-2 rounded-xl text-sm outline-none" placeholder="רכב, דיור, ביטוחים..."
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }} />
              <input type="number" value={exp.amount || ''} onChange={e => setExpenses(arr => arr.map((x, j) => j === i ? { ...x, amount: parseFloat(e.target.value) || 0 } : x))}
                className="w-28 px-3 py-2 rounded-xl text-sm outline-none num" placeholder="₪ לחודש"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }} />
              <button onClick={() => setExpenses(arr => arr.filter((_, j) => j !== i))}
                className="p-2 rounded-lg hover:bg-[var(--danger-dim)] transition-colors" style={{ color: 'var(--muted)' }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button onClick={() => setExpenses(arr => [...arr, { id: `e${Date.now()}`, label: '', amount: 0 }])}
            className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1" style={{ color: 'var(--primary)', background: 'var(--primary-dim)' }}>
            <Plus size={12} /> הוסף הוצאה
          </button>
        </div>
      </Card>

      <button onClick={handleSave}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
        style={{ background: saved ? 'var(--primary)' : 'var(--surface2)', color: saved ? '#0A0A0F' : 'var(--text)', border: '1px solid var(--border)' }}>
        <Save size={16} />
        {saved ? 'נשמר!' : 'שמור שינויים'}
      </button>
    </div>
  )
}

function IncomeRow({ inc, onChange, onRemove }: {
  inc: IncomeSource; onChange: (next: IncomeSource) => void; onRemove: () => void
}) {
  const gross = inc.inputMode === 'gross'
  const bd = gross ? grossToNet(inc.gross, { hasPension: inc.hasPension, hasKeren: inc.hasKeren, creditPoints: inc.creditPoints }) : null
  return (
    <div className="rounded-xl p-3 space-y-3" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
      <div className="flex gap-2 items-center">
        <input value={inc.label} onChange={e => onChange({ ...inc, label: e.target.value })}
          className="flex-1 min-w-0 px-3 py-2 rounded-lg text-sm outline-none" placeholder="משכורת, פרילנס..."
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} />
        <div className="flex rounded-lg overflow-hidden flex-shrink-0" style={{ border: '1px solid var(--border)' }}>
          {(['net', 'gross'] as const).map(m => {
            const active = gross === (m === 'gross')
            return (
              <button key={m} type="button"
                onClick={() => onChange({ ...inc, inputMode: m === 'gross' ? 'gross' : undefined })}
                className="px-2.5 py-2 text-xs font-medium transition-all"
                style={{ background: active ? 'var(--primary-dim)' : 'transparent', color: active ? 'var(--primary)' : 'var(--muted)' }}>
                {m === 'net' ? 'נטו' : 'ברוטו'}
              </button>
            )
          })}
        </div>
        <button onClick={onRemove} className="p-2 rounded-lg hover:bg-[var(--danger-dim)] transition-colors flex-shrink-0" style={{ color: 'var(--muted)' }}>
          <Trash2 size={14} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs flex-shrink-0 w-16" style={{ color: 'var(--muted)' }}>{gross ? 'ברוטו ₪' : 'נטו ₪'}</span>
        <input type="number" value={(gross ? inc.gross : inc.net) || ''} placeholder="0"
          onChange={e => { const v = parseFloat(e.target.value) || 0; onChange(gross ? { ...inc, gross: v } : { ...inc, net: v }) }}
          className="flex-1 px-3 py-2 rounded-lg text-sm outline-none num"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} />
      </div>

      {gross && (
        <>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs" style={{ color: 'var(--muted)' }}>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={inc.hasPension ?? true} onChange={e => onChange({ ...inc, hasPension: e.target.checked })} />
              פנסיה
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={inc.hasKeren ?? false} onChange={e => onChange({ ...inc, hasKeren: e.target.checked })} />
              קרן השתלמות
            </label>
            <span className="flex items-center gap-1.5">
              נק' זיכוי
              <input type="number" step="0.25" value={inc.creditPoints ?? DEFAULT_CREDIT_POINTS}
                onChange={e => onChange({ ...inc, creditPoints: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                className="w-14 px-2 py-1 rounded-md outline-none num"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            </span>
          </div>
          {bd && inc.gross > 0 && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <BkLine label="מס הכנסה" value={-bd.incomeTax} />
              <BkLine label="ביטוח לאומי" value={-bd.nationalInsurance} />
              {(inc.hasPension ?? true) && <BkLine label="פנסיה (עובד)" value={-bd.employeePension} />}
              {inc.hasKeren && <BkLine label="קה״ש (עובד)" value={-bd.employeeKeren} />}
              <BkLine label="נטו ביד" value={bd.net} color="var(--text)" strong />
              {inc.hasKeren && <BkLine label="קה״ש לחיסכון" value={bd.kerenTotal} color="var(--primary)" />}
              {(inc.hasPension ?? true) && <BkLine label={'פנסיה (לא נזיל)'} value={bd.pensionTotal} color="var(--purple)" />}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function BkLine({ label, value, color, strong }: { label: string; value: number; color?: string; strong?: boolean }) {
  return (
    <div className="flex justify-between">
      <span style={{ color: 'var(--muted)' }}>{label}</span>
      <span className={`num ${strong ? 'font-bold' : ''}`} style={{ color: color ?? 'var(--muted)' }}>
        {value < 0 ? '−' : ''}{formatILS(Math.abs(Math.round(value)))}
      </span>
    </div>
  )
}
