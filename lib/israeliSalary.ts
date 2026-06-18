import { IncomeSource } from './types'

// Israeli gross→net salary model (2026 figures). All statutory numbers are
// grouped here so they can be refreshed once a year. This is a planning estimate,
// not an official payslip — it ignores edge cases (extra credit points, special
// deductions, employer keren above the ceiling becoming taxable, etc.).

export interface SalaryBreakdown {
  gross: number
  incomeTax: number
  nationalInsurance: number   // ביטוח לאומי + מס בריאות (חלק העובד)
  employeePension: number     // 6%
  employeeKeren: number       // 2.5% (יורד מהנטו)
  employerPension: number     // 6.5% תגמולים
  employerSeverance: number   // 6% פיצויים
  employerKeren: number       // 7.5%
  net: number                 // נטו ביד
  pensionTotal: number        // עובד + מעסיק + פיצויים — לא נזיל עד פרישה
  kerenTotal: number          // עובד + מעסיק — נזיל יחסית (אחרי 6 שנים)
}

// 2026 monthly income-tax brackets (₪). Update yearly.
const TAX_BRACKETS: { upTo: number; rate: number }[] = [
  { upTo: 7010, rate: 0.10 },
  { upTo: 10060, rate: 0.14 },
  { upTo: 19000, rate: 0.20 },
  { upTo: 25100, rate: 0.31 },
  { upTo: 46690, rate: 0.35 },
  { upTo: 60130, rate: 0.47 },
  { upTo: Infinity, rate: 0.50 },
]
const CREDIT_POINT_VALUE = 242        // ₪ לחודש (2026)
export const DEFAULT_CREDIT_POINTS = 2.25

// Bituach Leumi + health (employee), monthly
const NI_REDUCED_CEIL = 7522          // 60% מהשכר הממוצע
const NI_MAX = 50695                  // הכנסה מרבית לתשלום דמי ביטוח
const NI_REDUCED_RATE = 0.0104 + 0.0323   // ב"ל 1.04% + בריאות 3.23%
const NI_FULL_RATE = 0.07 + 0.0517        // ב"ל 7% + בריאות 5.17%

// Pension (mandatory) + keren hishtalmut contribution rates
const PENSION_EMPLOYEE = 0.06
const PENSION_EMPLOYER = 0.065
const PENSION_SEVERANCE = 0.06
const KEREN_EMPLOYEE = 0.025
const KEREN_EMPLOYER = 0.075
const KEREN_SALARY_CEIL = 15712       // תקרת שכר חודשית להפקדה פטורה לקה"ש

function bracketTax(taxable: number): number {
  let tax = 0
  let prev = 0
  for (const b of TAX_BRACKETS) {
    if (taxable <= prev) break
    tax += (Math.min(taxable, b.upTo) - prev) * b.rate
    prev = b.upTo
  }
  return tax
}

export function grossToNet(
  gross: number,
  opts: { hasPension?: boolean; hasKeren?: boolean; creditPoints?: number } = {},
): SalaryBreakdown {
  const g = Math.max(0, gross)
  const hasPension = opts.hasPension ?? true
  const hasKeren = opts.hasKeren ?? false
  const creditPoints = opts.creditPoints ?? DEFAULT_CREDIT_POINTS

  const employeePension = hasPension ? g * PENSION_EMPLOYEE : 0
  const employerPension = hasPension ? g * PENSION_EMPLOYER : 0
  const employerSeverance = hasPension ? g * PENSION_SEVERANCE : 0

  const kerenBase = Math.min(g, KEREN_SALARY_CEIL)
  const employeeKeren = hasKeren ? kerenBase * KEREN_EMPLOYEE : 0
  const employerKeren = hasKeren ? kerenBase * KEREN_EMPLOYER : 0

  // Income tax: brackets on the gross, minus credit points and a 35% credit on
  // the employee pension contribution (up to 7% of salary).
  const pensionCredit = Math.min(employeePension, g * 0.07) * 0.35
  const incomeTax = Math.max(0, bracketTax(g) - creditPoints * CREDIT_POINT_VALUE - pensionCredit)

  // National insurance + health on the gross, capped, with a reduced first step.
  const niBase = Math.min(g, NI_MAX)
  const nationalInsurance =
    Math.min(niBase, NI_REDUCED_CEIL) * NI_REDUCED_RATE +
    Math.max(0, niBase - NI_REDUCED_CEIL) * NI_FULL_RATE

  const net = g - incomeTax - nationalInsurance - employeePension - employeeKeren

  return {
    gross: g,
    incomeTax: Math.round(incomeTax),
    nationalInsurance: Math.round(nationalInsurance),
    employeePension: Math.round(employeePension),
    employeeKeren: Math.round(employeeKeren),
    employerPension: Math.round(employerPension),
    employerSeverance: Math.round(employerSeverance),
    employerKeren: Math.round(employerKeren),
    net: Math.round(net),
    pensionTotal: Math.round(employeePension + employerPension + employerSeverance),
    kerenTotal: Math.round(employeeKeren + employerKeren),
  }
}

// A non-monthly row's gross is per-period, but grossToNet assumes a MONTHLY gross
// (its brackets, NI caps and keren ceiling are all monthly). Normalize the gross
// to a monthly figure BEFORE running the engine — dividing the result afterwards
// would misapply the monthly brackets/ceilings. monthly /1, quarterly /3, else /12.
function monthlyDivisor(inc: IncomeSource): number {
  if (inc.frequency === 'monthly') return 1
  if (inc.frequency === 'quarterly') return 3
  return 12
}

// Engine breakdown on the row's MONTHLY gross — null for net-mode rows.
function grossMonthly(inc: IncomeSource): SalaryBreakdown | null {
  if (inc.inputMode !== 'gross') return null
  return grossToNet(inc.gross / monthlyDivisor(inc), {
    hasPension: inc.hasPension, hasKeren: inc.hasKeren, creditPoints: inc.creditPoints,
  })
}

// Monthly net take-home for one income row. Gross-mode rows are derived from the
// engine; net-mode rows use the entered net, normalized to a monthly figure.
export function incomeNet(inc: IncomeSource): number {
  const bd = grossMonthly(inc)
  return bd ? bd.net : inc.net / monthlyDivisor(inc)
}

// Monthly keren hishtalmut contributions across all gross-mode incomes — counted
// as (relatively liquid) savings in the projection.
export function monthlyKerenContributions(income: IncomeSource[]): number {
  return income.reduce((s, inc) => { const bd = grossMonthly(inc); return s + (bd ? bd.kerenTotal : 0) }, 0)
}

// Monthly pension+severance contributions across gross-mode incomes — shown
// separately because they're locked until retirement (not liquid).
export function monthlyPensionContributions(income: IncomeSource[]): number {
  return income.reduce((s, inc) => { const bd = grossMonthly(inc); return s + (bd ? bd.pensionTotal : 0) }, 0)
}
