'use client'
import { useState, useEffect } from 'react'
import { usePortfolio } from '@/hooks/usePortfolio'
import { exportToExcel, importFromExcel } from '@/lib/storage'
import { FixedExpense, IncomeSource } from '@/lib/types'
import { grossToNet, DEFAULT_CREDIT_POINTS } from '@/lib/israeliSalary'
import { formatILS } from '@/lib/formatters'
import Card from '@/components/shared/Card'
import { Upload, Trash2, Save, FileSpreadsheet, Plus } from 'lucide-react'

export default function SettingsPage() {
  const { data, loading, update } = usePortfolio()
  const [saved, setSaved] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  const [profile, setProfile] = useState(data.profile)
  const [income, setIncome] = useState(data.income)
  const [expenses, setExpenses] = useState<FixedExpense[]>(data.expenses)

  // usePortfolio loads from localStorage asynchronously, so the initial useState
  // values are the defaults — that's why edits looked like they never saved.
  // Re-sync the form once real data arrives (and after an import). Editing only
  // touches local state (data refs are unchanged), so this never clobbers edits.
  useEffect(() => {
    setProfile(data.profile)
    setIncome(data.income)
    if (data.expenses.length > 0) setExpenses(data.expenses)
    // Soft-migrate a legacy single "monthly expenses" figure into one editable row.
    else if (data.profile.monthlyExpenses > 0) setExpenses([{ id: `e${Date.now()}`, label: 'הוצאות כלליות', amount: data.profile.monthlyExpenses }])
    else setExpenses([])
  }, [data.profile, data.income, data.expenses])

  if (loading) return <div className="flex items-center justify-center h-64 text-[var(--muted)]">טוען...</div>

  const handleSaveProfile = () => {
    const total = expenses.reduce((s, e) => s + (e.amount || 0), 0)
    // Persist the derived net for gross-mode incomes so the stored `net` (and its
    // Excel cell) stays consistent with the gross→net engine.
    const syncedIncome = income.map(inc => inc.inputMode === 'gross'
      ? { ...inc, net: grossToNet(inc.gross, { hasPension: inc.hasPension, hasKeren: inc.hasKeren, creditPoints: inc.creditPoints }).net }
      : inc)
    update(d => ({
      ...d,
      // Keep profile.monthlyExpenses in sync with the itemized total (always — an
      // empty list means 0, so emptying it can't leave a stale figure that the
      // effectiveMonthlyExpenses fallback or the soft-migration would resurrect).
      profile: { ...profile, monthlyExpenses: total },
      income: syncedIncome,
      expenses,
    }))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError(null)
    try {
      const imported = await importFromExcel(file)
      // Keep the locally-accumulated net-worth history — the Excel file doesn't
      // carry snapshots, so importing must not wipe the existing chart history.
      update(d => ({ ...imported, snapshots: d.snapshots }))
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'שגיאה בייבוא')
    }
    e.target.value = ''
  }

  const handleReset = () => {
    if (confirm('למחוק את כל הנתונים? פעולה זו בלתי הפיכה.')) {
      localStorage.clear()
      window.location.reload()
    }
  }

  return (
    <div className="space-y-5 fade-up max-w-xl">
      <div>
        <h1 className="text-2xl font-black">הגדרות</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>פרופיל אישי ונתונים</p>
      </div>

      <Card>
        <div className="font-semibold mb-4">פרופיל</div>
        <div className="space-y-4">
          <Field label="יעד כרית ביטחון (חודשים)" type="number"
            value={String(profile.monthlyCushionTarget)}
            onChange={v => setProfile(p => ({ ...p, monthlyCushionTarget: parseInt(v) || 6 }))} />
          <Field label="תאריך לידה" type="date"
            value={profile.birthDate}
            onChange={v => setProfile(p => ({ ...p, birthDate: v }))} />
          <Field label="גיל פרישה" type="number"
            value={String(profile.retirementAge ?? 67)}
            onChange={v => setProfile(p => ({ ...p, retirementAge: parseInt(v) || 67 }))} />
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
            סה"כ {formatILS(expenses.reduce((s, e) => s + (e.amount || 0), 0))}/חודש
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

      <button onClick={handleSaveProfile}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
        style={{ background: saved ? 'var(--primary)' : 'var(--surface2)', color: saved ? '#0A0A0F' : 'var(--text)', border: '1px solid var(--border)' }}>
        <Save size={16} />
        {saved ? 'נשמר!' : 'שמור שינויים'}
      </button>

      {/* Excel backup */}
      <Card>
        <div className="font-semibold mb-2">ייצוא / ייבוא Excel</div>
        <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
          כל הנתונים נשמרים אצלך במחשב — ייצא לקובץ Excel, ערוך בכל עת, והעלה חזרה להמשיך.
        </p>
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => exportToExcel(data)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
            style={{ background: 'var(--primary-dim)', color: 'var(--primary)', border: '1px solid rgba(129,140,248,0.2)' }}>
            <FileSpreadsheet size={15} /> ייצא Excel
          </button>
          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all hover:opacity-80"
            style={{ background: 'var(--gold-dim)', color: 'var(--gold)', border: '1px solid rgba(245,166,35,0.2)' }}>
            <Upload size={15} /> ייבא Excel
            <input type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
          </label>
        </div>
        {importError && (
          <p className="text-sm mt-3" style={{ color: 'var(--danger)' }}>{importError}</p>
        )}
        <p className="text-xs mt-3" style={{ color: 'var(--muted)' }}>
          הקובץ מכיל גיליונות: נכסים · חובות · הכנסות · הוצאות קבועות · פרופיל
        </p>
      </Card>

      <Card>
        <div className="font-semibold mb-2 text-[var(--danger)]">איפוס נתונים</div>
        <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>מוחק את כל הנתונים המקומיים. פעולה בלתי הפיכה.</p>
        <button onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--danger-dim)', color: 'var(--danger)', border: '1px solid rgba(255,107,107,0.2)' }}>
          <Trash2 size={15} /> מחק הכל
        </button>
      </Card>

      <p className="text-xs text-center py-2" style={{ color: 'var(--muted)' }}>
        כל הנתונים נשמרים ב-localStorage בדפדפן שלך בלבד · לא עוברים לשום שרת
      </p>
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

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl text-sm outline-none num"
        style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
        onFocus={e => e.target.style.borderColor = 'var(--primary)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  )
}
