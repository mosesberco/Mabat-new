'use client'
import { useState } from 'react'
import { Liability } from '@/lib/types'
import { X } from 'lucide-react'

interface Props { onClose: () => void; onAdd: (l: Liability) => void }

export default function AddLiabilityModal({ onClose, onAdd }: Props) {
  const [label, setLabel] = useState('')
  const [principal, setPrincipal] = useState('')
  const [currentBalance, setCurrentBalance] = useState('')
  const [annualRate, setAnnualRate] = useState('')
  const [remainingPayments, setRemainingPayments] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const bal = parseFloat(currentBalance) || parseFloat(principal) || 0
    const p = parseFloat(principal) || bal
    onAdd({
      id: `l${Date.now()}`,
      label,
      principal: p,
      currentBalance: bal,
      annualRate: parseFloat(annualRate) / 100,
      termMonths: parseInt(remainingPayments),
      remainingPayments: parseInt(remainingPayments),
      startDate,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="glass w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">הוספת חוב / הלוואה</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface2)]">
            <X size={18} style={{ color: 'var(--muted)' }} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <F label="שם ההלוואה" value={label} onChange={setLabel} placeholder="משכנתא, הלוואה בנקאית..." required />
          <F label="קרן מקורית (₪)" value={principal} onChange={setPrincipal} placeholder="700000" type="number" required />
          <F label="יתרה נוכחית (₪)" value={currentBalance} onChange={setCurrentBalance} placeholder="555000" type="number" />
          <F label="ריבית שנתית (%)" value={annualRate} onChange={setAnnualRate} placeholder="4.5" type="number" required />
          <F label="תשלומים נותרים" value={remainingPayments} onChange={setRemainingPayments} placeholder="288" type="number" required />
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>תאריך התחלה</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          </div>
          <button type="submit" className="w-full py-2.5 rounded-xl font-bold text-sm" style={{ background: 'var(--danger)', color: '#fff' }}>
            הוסף חוב
          </button>
        </form>
      </div>
    </div>
  )
}

function F({ label, value, onChange, placeholder, type = 'text', required = false }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean
}) {
  return (
    <div>
      <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
        className="w-full px-3 py-2 rounded-xl text-sm outline-none"
        style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
        onFocus={e => e.target.style.borderColor = 'var(--danger)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  )
}
