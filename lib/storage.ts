import { FinancialData, NetWorthSnapshot } from './types'

const KEY = 'kamah_v1'

export const defaultData: FinancialData = {
  profile: {
    birthDate: '1990-01-01',
    retirementAge: 67,
    monthlyCushionTarget: 6,
    currency: 'ILS',
    monthlyExpenses: 12000,
  },
  income: [
    {
      id: 'i1', label: 'משכורת ברוטו', gross: 22000, net: 16000, frequency: 'monthly',
      employerPensionPct: 6.5, employerGemelPct: 7.5, taxBracket: 31,
    },
    { id: 'i2', label: 'שכר דירה', gross: 4500, net: 4500, frequency: 'monthly' },
  ],
  holdings: [
    { id: 'h1', type: 'stock', symbol: 'NVDA', qty: 10, account: 'אקסלנס', costBasis: 6500, currency: 'USD' },
    { id: 'h2', type: 'etf', symbol: 'SPY', qty: 5, costBasis: 2500, currency: 'USD' },
    { id: 'h3', type: 'crypto', symbol: 'BTC', qty: 0.05, costBasis: 8000, currency: 'USD' },
    { id: 'h4', type: 'deposit', label: 'פיקדון 3.7%', value: 164800, rate: 0.037, currency: 'ILS' },
    { id: 'h5', type: 'keren_hishtalmut', label: 'קרן השתלמות מיטב', value: 93000, track: 'equity', currency: 'ILS', monthlyContribution: 1650, employerContribution: 1100, employeeContribution: 550, providerName: 'מיטב', taxExempt: true },
    { id: 'h6', type: 'pension', label: 'פנסיה כללית מגדל', value: 280000, track: 'mixed', currency: 'ILS', monthlyContribution: 3300, employerContribution: 1430, employeeContribution: 1870, providerName: 'מגדל', taxExempt: true, expectedMonthlyPension: 7500 },
    { id: 'h7', type: 'gemel', label: 'גמל לפיצויים', value: 45000, track: 'equity', currency: 'ILS', providerName: 'הראל', taxExempt: true },
    { id: 'h8', type: 'property', label: 'דירה', value: 1340000, manualAppraisal: true, currency: 'ILS' },
  ],
  liabilities: [
    { id: 'l1', label: 'משכנתא', principal: 700000, currentBalance: 555000, annualRate: 0.05, termMonths: 360, remainingPayments: 288, startDate: '2020-01-01', currency: 'ILS' },
    { id: 'l2', label: 'הלוואה 2%', principal: 50000, currentBalance: 33570, annualRate: 0.02, termMonths: 60, remainingPayments: 40, startDate: '2022-06-01', currency: 'ILS' },
  ],
  snapshots: [],
}

export function loadData(): FinancialData {
  if (typeof window === 'undefined') return defaultData
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultData
    return JSON.parse(raw) as FinancialData
  } catch {
    return defaultData
  }
}

export function saveData(data: FinancialData): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function saveSnapshot(data: FinancialData, netWorth: number, assets: number, liabilities: number): FinancialData {
  const today = new Date().toISOString().slice(0, 10)
  const snapshot: NetWorthSnapshot = { date: today, netWorth, assets, liabilities }
  const existing = data.snapshots.filter(s => s.date !== today)
  const updated = { ...data, snapshots: [...existing, snapshot].slice(-365) }
  saveData(updated)
  return updated
}

export function exportData(data: FinancialData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `kamah-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importData(file: File): Promise<FinancialData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as FinancialData
        resolve(data)
      } catch {
        reject(new Error('קובץ לא תקין'))
      }
    }
    reader.onerror = () => reject(new Error('שגיאה בקריאת הקובץ'))
    reader.readAsText(file)
  })
}
