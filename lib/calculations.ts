import { FinancialData, Holding, Liability, PriceMap, ComputedPortfolio, TYPE_COLORS, SECTOR_MAP, LIQUID_TYPES, PENSION_TYPES, isCryptoCurrency } from './types'
import { incomeNet, monthlyPensionContributions as salaryPensionContributions } from './israeliSalary'

export function monthlyPayment(balance: number, annualRate: number, remainingPayments: number): number {
  if (remainingPayments <= 0) return 0
  if (annualRate === 0) return balance / remainingPayments
  const r = annualRate / 12
  return (balance * r * Math.pow(1 + r, remainingPayments)) / (Math.pow(1 + r, remainingPayments) - 1)
}

export function totalInterestRemaining(balance: number, annualRate: number, remainingPayments: number): number {
  const pmt = monthlyPayment(balance, annualRate, remainingPayments)
  return pmt * remainingPayments - balance
}

// ₪ value of one unit of a denomination: ILS=1, USD via the FX rate, other fiat
// via the server-provided __CUR_ILS rate, crypto via its USD price × USD/ILS.
function rateToIls(cur: string | undefined, prices: PriceMap, usdRate: number): number {
  if (!cur || cur === 'ILS') return 1
  if (isCryptoCurrency(cur)) return (prices[cur] ?? 0) * usdRate
  if (cur === 'USD') return usdRate
  return prices[`__${cur}_ILS`] ?? 0
}

export function holdingValue(h: Holding, prices: PriceMap, usdRate: number): number {
  if (h.symbol && h.qty !== undefined) {
    const priceUSD = prices[h.symbol] ?? 0
    const valueUSD = priceUSD * h.qty
    if (h.currency === 'USD' || !h.currency) return valueUSD * usdRate
    return valueUSD
  }
  // Manual holding: `value` is the amount in its denomination (₪ / fiat / crypto).
  return (h.value ?? 0) * rateToIls(h.currency, prices, usdRate)
}

// Effective monthly expenses: the sum of itemized fixed expenses when present,
// otherwise the legacy single profile.monthlyExpenses figure (back-compat).
export function effectiveMonthlyExpenses(data: FinancialData): number {
  if (data.expenses && data.expenses.length > 0) {
    return data.expenses.reduce((s, e) => s + (e.amount || 0), 0)
  }
  return data.profile.monthlyExpenses
}

export function computePortfolio(data: FinancialData, prices: PriceMap, usdRate: number): ComputedPortfolio {
  const holdingsComputed = data.holdings.map(h => {
    const liveValue = holdingValue(h, prices, usdRate)
    // costBasis is the purchase PRICE PER UNIT (in the holding's currency) for a
    // traded asset, so total cost = price/unit × qty — converted to ₪ the same way
    // liveValue is, making gainPct = (current − buy) / buy. Manual assets (no qty)
    // treat costBasis as a total in the holding's denomination, converted to ₪ to
    // match liveValue (ILS/undefined → ×1, so legacy holdings are unchanged).
    const costTotal = h.costBasis != null
      ? (h.symbol && h.qty != null
          ? h.costBasis * h.qty * (h.currency === 'USD' || !h.currency ? usdRate : 1)
          : h.costBasis * rateToIls(h.currency, prices, usdRate))
      : undefined
    const gain = costTotal !== undefined ? liveValue - costTotal : undefined
    const gainPct = costTotal && costTotal > 0 ? ((liveValue - costTotal) / costTotal) * 100 : undefined
    return { ...h, liveValue, gain, gainPct }
  })

  const totalAssets = holdingsComputed.reduce((s, h) => s + h.liveValue, 0)

  const liabilitiesComputed = data.liabilities.map(l => ({
    ...l,
    monthlyPayment: monthlyPayment(l.currentBalance, l.annualRate, l.remainingPayments),
  }))

  const totalLiabilities = data.liabilities.reduce((s, l) => s + l.currentBalance, 0)
  const netWorth = totalAssets - totalLiabilities

  // incomeNet already returns a monthly figure (it normalizes by frequency).
  const monthlyIncome = data.income.reduce((s, inc) => s + incomeNet(inc), 0)

  const monthlyDebtPayments = liabilitiesComputed.reduce((s, l) => s + l.monthlyPayment, 0)
  const monthlyExpenses = effectiveMonthlyExpenses(data)
  const monthlySavings = monthlyIncome - monthlyDebtPayments - monthlyExpenses
  const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0

  const liquidAssets = holdingsComputed
    .filter(h => LIQUID_TYPES.includes(h.type as typeof LIQUID_TYPES[number]))
    .reduce((s, h) => s + h.liveValue, 0)

  const illiquidAssets = holdingsComputed
    .filter(h => !LIQUID_TYPES.includes(h.type as typeof LIQUID_TYPES[number]))
    .reduce((s, h) => s + h.liveValue, 0)

  const pensionAssets = holdingsComputed
    .filter(h => PENSION_TYPES.includes(h.type as typeof PENSION_TYPES[number]))
    .reduce((s, h) => s + h.liveValue, 0)

  const holdingsPensionContributions = holdingsComputed
    .filter(h => PENSION_TYPES.includes(h.type as typeof PENSION_TYPES[number]))
    .reduce((s, h) => s + (h.monthlyContribution ?? 0), 0)
  // When a gross salary is entered, the statutory ~18.5% pension contribution is
  // already known — use it when it exceeds the manually-entered per-fund deposits,
  // so the pension deposit isn't shown as ₪0 just because it wasn't typed in.
  const monthlyPensionContributions = Math.max(holdingsPensionContributions, salaryPensionContributions(data.income))

  const totalMonthlyExpenses = monthlyExpenses + monthlyDebtPayments
  const emergencyMonths = totalMonthlyExpenses > 0 ? liquidAssets / totalMonthlyExpenses : 0

  const TYPE_GROUP_LABELS: Record<string, string> = {
    stock: 'מניות', etf: 'תעודות סל', israeli_fund: 'קרנות ישראליות',
    crypto: 'קריפטו', cash: 'מזומן', deposit: 'פיקדון', savings: 'חיסכון',
    keren_hishtalmut: 'קרן השתלמות', pension: 'פנסיה',
    gemel: 'גמל לפיצויים', gemel_investiga: 'גמל להשקעה',
    property: 'נדל"ן', bonds: "אג\"ח", other: 'אחר',
  }

  const typeGroups: Record<string, number> = {}
  holdingsComputed.forEach(h => {
    typeGroups[h.type] = (typeGroups[h.type] ?? 0) + h.liveValue
  })

  const allocationByType = Object.entries(typeGroups).map(([type, value]) => ({
    name: TYPE_GROUP_LABELS[type] ?? type,
    value,
    color: TYPE_COLORS[type] ?? '#6B7280',
  }))

  return {
    totalAssets,
    totalLiabilities,
    netWorth,
    monthlyIncome,
    monthlyDebtPayments,
    monthlySavings,
    savingsRate,
    liquidAssets,
    illiquidAssets,
    emergencyMonths,
    monthlyPensionContributions,
    pensionAssets,
    allocationByType,
    holdings: holdingsComputed,
    liabilities: liabilitiesComputed,
  }
}

export function computeHealthScore(portfolio: ComputedPortfolio, data: FinancialData): { score: number; breakdown: { label: string; score: number; max: number; note: string }[] } {
  const breakdown = []

  // Debt-to-income ratio (25 pts)
  const dti = portfolio.monthlyIncome > 0 ? (portfolio.monthlyDebtPayments / portfolio.monthlyIncome) * 100 : 100
  const dtiScore = dti < 20 ? 25 : dti < 30 ? 20 : dti < 40 ? 12 : dti < 50 ? 6 : 0
  breakdown.push({ label: 'יחס חוב/הכנסה', score: dtiScore, max: 25, note: `${dti.toFixed(0)}% מהכנסה לחובות` })

  // Emergency fund (20 pts)
  const em = portfolio.emergencyMonths
  const emScore = em >= 6 ? 20 : em >= 3 ? 14 : em >= 1 ? 7 : 0
  breakdown.push({ label: 'כרית ביטחון', score: emScore, max: 20, note: `${em.toFixed(1)} חודשים` })

  // Savings rate (20 pts)
  const sr = portfolio.savingsRate
  const srScore = sr >= 30 ? 20 : sr >= 20 ? 15 : sr >= 10 ? 9 : sr >= 0 ? 4 : 0
  breakdown.push({ label: '% חיסכון', score: srScore, max: 20, note: `${sr.toFixed(0)}% מהכנסה` })

  // Concentration (20 pts)
  const maxPct = portfolio.totalAssets > 0
    ? Math.max(...portfolio.holdings.map(h => (h.liveValue / portfolio.totalAssets) * 100))
    : 0
  const concScore = maxPct < 25 ? 20 : maxPct < 40 ? 14 : maxPct < 60 ? 7 : 0
  breakdown.push({ label: 'פיזור תיק', score: concScore, max: 20, note: `מקסימום ${maxPct.toFixed(0)}% בנכס` })

  // Net worth positive (15 pts)
  const nwScore = portfolio.netWorth > 500000 ? 15 : portfolio.netWorth > 100000 ? 10 : portfolio.netWorth > 0 ? 6 : 0
  breakdown.push({ label: 'הון נקי', score: nwScore, max: 15, note: `₪${Math.round(portfolio.netWorth / 1000)}K` })

  const score = breakdown.reduce((s, b) => s + b.score, 0)
  return { score, breakdown }
}

export function computeFIRE(portfolio: ComputedPortfolio, monthlyExpenses: number): { pct: number; yearsLeft: number; fireNumber: number } {
  const annualExpenses = monthlyExpenses * 12
  const fireNumber = annualExpenses * 25
  const pct = fireNumber > 0 ? Math.min((portfolio.netWorth / fireNumber) * 100, 100) : 0

  const annualSavings = portfolio.monthlySavings * 12
  const gap = fireNumber - portfolio.netWorth
  const avgReturn = 0.07

  let yearsLeft = 0
  if (gap <= 0) {
    yearsLeft = 0
  } else if (annualSavings <= 0) {
    yearsLeft = 999
  } else {
    let balance = portfolio.netWorth
    while (balance < fireNumber && yearsLeft < 100) {
      balance = balance * (1 + avgReturn) + annualSavings
      yearsLeft++
    }
  }

  return { pct, yearsLeft, fireNumber }
}

export function sectorBreakdown(holdings: ComputedPortfolio['holdings']): { sector: string; value: number; pct: number }[] {
  const groups: Record<string, number> = {}
  const total = holdings.reduce((s, h) => s + h.liveValue, 0)

  holdings.forEach(h => {
    const sector = h.symbol ? (SECTOR_MAP[h.symbol] ?? 'אחר') : typeToSector(h.type)
    groups[sector] = (groups[sector] ?? 0) + h.liveValue
  })

  return Object.entries(groups)
    .map(([sector, value]) => ({ sector, value, pct: total > 0 ? (value / total) * 100 : 0 }))
    .sort((a, b) => b.value - a.value)
}

function typeToSector(type: string): string {
  if (type === 'property') return 'נדל"ן'
  if (type === 'cash') return 'מזומן'
  if (type === 'pension' || type === 'keren_hishtalmut') return 'חסכונות מוסדיים'
  return 'אחר'
}

export function computeMillionairePath(
  currentNetWorth: number,
  monthlySavings: number,
  targetAmount = 1_000_000,
  annualReturn = 0.07
): { year: number; value: number }[] {
  const points: { year: number; value: number }[] = []
  let balance = currentNetWorth
  const maxYears = 50
  const monthly = annualReturn / 12

  for (let m = 0; m <= maxYears * 12; m++) {
    if (m % 12 === 0) {
      points.push({ year: m / 12, value: Math.round(balance) })
      if (balance >= targetAmount * 1.5 && m > 0) break
    }
    // Investment returns only apply to the invested (positive) balance — a
    // negative net worth is debt, which shouldn't compound at the market rate.
    // Monthly savings still pay it down each month.
    balance = balance + Math.max(balance, 0) * monthly + monthlySavings
  }
  return points
}

export function debtAvalanche(
  liabilities: Liability[],
  extraMonthly: number
): { id: string; label: string; monthsToPayoff: number; interestSaved: number }[] {
  const sorted = [...liabilities].sort((a, b) => b.annualRate - a.annualRate)
  return sorted.map((l, i) => {
    const extra = i === 0 ? extraMonthly : 0
    const pmt = monthlyPayment(l.currentBalance, l.annualRate, l.remainingPayments) + extra
    const r = l.annualRate / 12
    let balance = l.currentBalance
    let months = 0
    let totalPaid = 0
    while (balance > 0.01 && months < 1000) {
      const interest = balance * r
      const principal = Math.min(pmt - interest, balance)
      totalPaid += pmt
      balance -= principal
      months++
    }
    const originalTotal = monthlyPayment(l.currentBalance, l.annualRate, l.remainingPayments) * l.remainingPayments
    const interestSaved = originalTotal - totalPaid
    return { id: l.id, label: l.label, monthsToPayoff: months, interestSaved }
  })
}
