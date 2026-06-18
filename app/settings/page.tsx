'use client'
import { useState, useEffect } from 'react'
import { usePortfolio } from '@/hooks/usePortfolio'
import { exportToExcel, importFromExcel } from '@/lib/storage'
import { FixedExpense } from '@/lib/types'
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
    update(d => ({
      ...d,
      // Keep profile.monthlyExpenses in sync with the itemized total (always — an
      // empty list means 0, so emptying it can't leave a stale figure that the
      // effectiveMonthlyExpenses fallback or the soft-migration would resurrect).
      profile: { ...profile, monthlyExpenses: total },
      income,
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
        <div className="font-semibold mb-4">הכנסות</div>
        <div className="space-y-3">
          {income.map((inc, i) => (
            <div key={inc.id} className="flex gap-3 items-center">
              <input value={inc.label} onChange={e => setIncome(arr => arr.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                className="flex-1 px-3 py-2 rounded-xl text-sm outline-none" placeholder="תיאור"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }} />
              <input type="number" value={inc.net} onChange={e => setIncome(arr => arr.map((x, j) => j === i ? { ...x, net: parseFloat(e.target.value) || 0 } : x))}
                className="w-28 px-3 py-2 rounded-xl text-sm outline-none num" placeholder="₪ נטו"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }} />
              <button onClick={() => setIncome(arr => arr.filter((_, j) => j !== i))}
                className="p-2 rounded-lg hover:bg-[var(--danger-dim)] transition-colors" style={{ color: 'var(--muted)' }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button onClick={() => setIncome(arr => [...arr, { id: `i${Date.now()}`, label: '', gross: 0, net: 0, frequency: 'monthly' }])}
            className="text-xs px-3 py-1.5 rounded-lg" style={{ color: 'var(--primary)', background: 'var(--primary-dim)' }}>
            + הוסף הכנסה
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
