'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePortfolio } from '@/hooks/usePortfolio'
import { exportToExcel, importFromExcel } from '@/lib/storage'
import Card from '@/components/shared/Card'
import { Upload, Trash2, Save, FileSpreadsheet, Coins } from 'lucide-react'

export default function SettingsPage() {
  const { data, loading, update } = usePortfolio()
  const [saved, setSaved] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [profile, setProfile] = useState(data.profile)

  // usePortfolio loads from localStorage asynchronously, so re-sync once real data
  // arrives (and after an import). Editing only touches local state.
  useEffect(() => { setProfile(data.profile) }, [data.profile])

  if (loading) return <div className="flex items-center justify-center h-64 text-[var(--muted)]">טוען...</div>

  const handleSaveProfile = () => {
    // Only write the fields this page owns, so the cash-flow page's monthlyExpenses
    // (and other profile fields) aren't clobbered.
    update(d => ({
      ...d,
      profile: {
        ...d.profile,
        birthDate: profile.birthDate,
        retirementAge: profile.retirementAge,
        monthlyCushionTarget: profile.monthlyCushionTarget,
      },
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
        <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>פרופיל וניהול נתונים</p>
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

      <button onClick={handleSaveProfile}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
        style={{ background: saved ? 'var(--primary)' : 'var(--surface2)', color: saved ? '#0A0A0F' : 'var(--text)', border: '1px solid var(--border)' }}>
        <Save size={16} />
        {saved ? 'נשמר!' : 'שמור שינויים'}
      </button>

      <Link href="/cashflow"
        className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl transition-colors hover:bg-[var(--surface2)]"
        style={{ color: 'var(--muted)' }}>
        <Coins size={15} style={{ color: 'var(--primary)' }} />
        הכנסות והוצאות עברו לעמוד <span style={{ color: 'var(--primary)' }}>תזרים</span> ←
      </Link>

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
