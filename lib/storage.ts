import { FinancialData, NetWorthSnapshot, Holding, Liability, IncomeSource, Profile, HoldingType, Currency, Frequency } from './types'
import * as XLSX from 'xlsx'

const KEY = 'kamah_v1'

export const defaultData: FinancialData = {
  profile: {
    birthDate: '1990-01-01',
    retirementAge: 67,
    monthlyCushionTarget: 6,
    currency: 'ILS',
    monthlyExpenses: 10000,
  },
  income: [],
  holdings: [],
  liabilities: [],
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

export function exportToExcel(data: FinancialData): void {
  const wb = XLSX.utils.book_new()

  // Sheet 1: Holdings (נכסים)
  const holdingsRows = data.holdings.map(h => ({
    'סוג': h.type,
    'תיאור': h.label ?? '',
    'סימבול': h.symbol ?? '',
    'כמות': h.qty ?? '',
    'שווי ידני (₪)': h.value ?? '',
    'עלות בסיס': h.costBasis ?? '',
    'ריבית (%)': h.rate != null ? +(h.rate * 100).toFixed(4) : '',
    'חשבון': h.account ?? '',
    'מטבע': h.currency ?? 'ILS',
    'הפקדה חודשית': h.monthlyContribution ?? '',
    'הפקדת מעסיק': h.employerContribution ?? '',
    'הפקדת עובד': h.employeeContribution ?? '',
    'ספק': h.providerName ?? '',
    'מסלול': h.track ?? '',
    'פטור ממס': h.taxExempt ? 'כן' : '',
    'קצבה צפויה חודשית': h.expectedMonthlyPension ?? '',
    'הערכה ידנית': h.manualAppraisal ? 'כן' : '',
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(holdingsRows.length ? holdingsRows : [{}]), 'נכסים')

  // Sheet 2: Liabilities (חובות)
  const liabRows = data.liabilities.map(l => ({
    'תיאור': l.label,
    'קרן מקורית (₪)': l.principal,
    'יתרה נוכחית (₪)': l.currentBalance,
    'ריבית שנתית (%)': +(l.annualRate * 100).toFixed(4),
    'תקופה (חודשים)': l.termMonths,
    'תשלומים שנותרו': l.remainingPayments,
    'תאריך התחלה': l.startDate,
    'מטבע': l.currency ?? 'ILS',
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(liabRows.length ? liabRows : [{}]), 'חובות')

  // Sheet 3: Income (הכנסות)
  const incRows = data.income.map(i => ({
    'תיאור': i.label,
    'ברוטו (₪)': i.gross,
    'נטו (₪)': i.net,
    'תדירות': i.frequency,
    'פנסיית מעסיק (%)': i.employerPensionPct ?? '',
    'גמל מעסיק (%)': i.employerGemelPct ?? '',
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(incRows.length ? incRows : [{}]), 'הכנסות')

  // Sheet 4: Profile (פרופיל)
  const profileRows = [
    { 'שדה': 'תאריך לידה', 'ערך': data.profile.birthDate },
    { 'שדה': 'גיל פרישה', 'ערך': data.profile.retirementAge },
    { 'שדה': 'כרית ביטחון (חודשים)', 'ערך': data.profile.monthlyCushionTarget },
    { 'שדה': 'הוצאות חודשיות (₪)', 'ערך': data.profile.monthlyExpenses },
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(profileRows), 'פרופיל')

  XLSX.writeFile(wb, `kamah-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

export function importFromExcel(file: File): Promise<FinancialData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer
        const wb = XLSX.read(buffer, { type: 'array' })

        // Holdings
        const ws1 = wb.Sheets['נכסים']
        const rawHoldings = ws1 ? XLSX.utils.sheet_to_json(ws1) as Record<string, unknown>[] : []
        const holdings: Holding[] = rawHoldings
          .filter(r => r['סוג'])
          .map((row, i) => ({
            id: `h${Date.now()}_${i}`,
            type: String(row['סוג'] || 'other') as HoldingType,
            label: str(row['תיאור']) || undefined,
            symbol: str(row['סימבול']) || undefined,
            qty: num(row['כמות']),
            value: num(row['שווי ידני (₪)']),
            costBasis: num(row['עלות בסיס']),
            rate: num(row['ריבית (%)']) != null ? (num(row['ריבית (%)'])! / 100) : undefined,
            account: str(row['חשבון']) || undefined,
            currency: (str(row['מטבע']) as Currency) || 'ILS',
            monthlyContribution: num(row['הפקדה חודשית']),
            employerContribution: num(row['הפקדת מעסיק']),
            employeeContribution: num(row['הפקדת עובד']),
            providerName: str(row['ספק']) || undefined,
            track: (str(row['מסלול']) as 'equity' | 'bonds' | 'mixed' | 'money_market') || undefined,
            taxExempt: row['פטור ממס'] === 'כן' ? true : undefined,
            expectedMonthlyPension: num(row['קצבה צפויה חודשית']),
            manualAppraisal: row['הערכה ידנית'] === 'כן' ? true : undefined,
          }))

        // Liabilities
        const ws2 = wb.Sheets['חובות']
        const rawLiab = ws2 ? XLSX.utils.sheet_to_json(ws2) as Record<string, unknown>[] : []
        const liabilities: Liability[] = rawLiab
          .filter(r => r['תיאור'])
          .map((row, i) => ({
            id: `l${Date.now()}_${i}`,
            label: str(row['תיאור']) || '',
            principal: num(row['קרן מקורית (₪)']) ?? 0,
            currentBalance: num(row['יתרה נוכחית (₪)']) ?? 0,
            annualRate: (num(row['ריבית שנתית (%)']) ?? 0) / 100,
            termMonths: num(row['תקופה (חודשים)']) ?? 0,
            remainingPayments: num(row['תשלומים שנותרו']) ?? 0,
            startDate: str(row['תאריך התחלה']) || new Date().toISOString().slice(0, 10),
            currency: (str(row['מטבע']) as Currency) || 'ILS',
          }))

        // Income
        const ws3 = wb.Sheets['הכנסות']
        const rawInc = ws3 ? XLSX.utils.sheet_to_json(ws3) as Record<string, unknown>[] : []
        const income: IncomeSource[] = rawInc
          .filter(r => r['תיאור'])
          .map((row, i) => ({
            id: `i${Date.now()}_${i}`,
            label: str(row['תיאור']) || '',
            gross: num(row['ברוטו (₪)']) ?? 0,
            net: num(row['נטו (₪)']) ?? 0,
            frequency: (str(row['תדירות']) as Frequency) || 'monthly',
            employerPensionPct: num(row['פנסיית מעסיק (%)']) ?? undefined,
            employerGemelPct: num(row['גמל מעסיק (%)']) ?? undefined,
          }))

        // Profile
        const ws4 = wb.Sheets['פרופיל']
        const rawProfile = ws4 ? XLSX.utils.sheet_to_json(ws4) as { שדה: string; ערך: string | number }[] : []
        const pm: Record<string, string | number> = {}
        rawProfile.forEach(r => { if (r['שדה']) pm[r['שדה']] = r['ערך'] })

        const profile: Profile = {
          birthDate: str(pm['תאריך לידה']) || '1990-01-01',
          retirementAge: num(pm['גיל פרישה']) ?? 67,
          monthlyCushionTarget: num(pm['כרית ביטחון (חודשים)']) ?? 6,
          monthlyExpenses: num(pm['הוצאות חודשיות (₪)']) ?? 10000,
          currency: 'ILS',
        }

        resolve({ profile, income, holdings, liabilities, snapshots: [] })
      } catch {
        reject(new Error('קובץ Excel לא תקין'))
      }
    }
    reader.onerror = () => reject(new Error('שגיאה בקריאת הקובץ'))
    reader.readAsArrayBuffer(file)
  })
}

function str(v: unknown): string {
  if (v == null || v === '') return ''
  return String(v)
}

function num(v: unknown): number | undefined {
  if (v == null || v === '') return undefined
  const n = Number(v)
  return isNaN(n) ? undefined : n
}
