export type Currency = 'ILS' | 'USD' | 'EUR' | 'GBP' | 'CHF' | 'BTC' | 'ETH' | 'SOL' | 'USDT'
export type Frequency = 'monthly' | 'quarterly' | 'annual' | 'one_time'

// Denominations a cash/manual holding can be held in (converted live to ₪).
export const FIAT_CURRENCIES: Currency[] = ['ILS', 'USD', 'EUR', 'GBP', 'CHF']
export const CRYPTO_CURRENCIES: Currency[] = ['BTC', 'ETH', 'SOL', 'USDT']
export const CURRENCY_LABELS: Record<string, string> = {
  ILS: '₪ שקל', USD: '$ דולר', EUR: '€ יורו', GBP: '£ ליש"ט', CHF: 'CHF פרנק שוויצרי',
  BTC: '₿ ביטקוין', ETH: 'Ξ את׳ריום', SOL: 'סולנה (SOL)', USDT: '₮ טת׳ר',
}
export const CURRENCY_SYMBOLS: Record<string, string> = {
  ILS: '₪', USD: '$', EUR: '€', GBP: '£', CHF: 'CHF', BTC: '₿', ETH: 'Ξ', SOL: 'SOL', USDT: '₮',
}
export function isCryptoCurrency(c?: string): boolean {
  return c != null && (CRYPTO_CURRENCIES as string[]).includes(c)
}
export type HoldingType =
  | 'stock' | 'etf' | 'israeli_fund' | 'crypto'
  | 'cash' | 'deposit' | 'savings'
  | 'keren_hishtalmut'
  | 'pension' | 'gemel' | 'gemel_investiga'
  | 'property'
  | 'bonds' | 'other'

export interface Profile {
  birthDate: string
  retirementAge: number
  monthlyCushionTarget: number
  currency: Currency
  monthlyExpenses: number
  fireTarget?: number
}

export interface IncomeSource {
  id: string
  label: string
  gross: number
  net: number
  frequency: Frequency
  inputMode?: 'net' | 'gross'   // ברירת מחדל net; ב-gross הנטו נגזר מהברוטו
  hasPension?: boolean          // מקזז הפרשות פנסיה (במצב ברוטו)
  hasKeren?: boolean            // מקזז הפרשות קרן השתלמות (במצב ברוטו)
  creditPoints?: number         // נקודות זיכוי (במצב ברוטו)
  employerPensionPct?: number   // % שמעסיק מפקיד לפנסיה
  employerGemelPct?: number     // % שמעסיק מפקיד לגמל/השתלמות
  taxBracket?: number           // מדרגת מס בפועל (לחישוב חיסכון פנסיוני)
}

export interface FixedExpense {
  id: string
  label: string                 // רכב, דיור, ביטוחים...
  amount: number                // הוצאה חודשית (₪)
}

export interface Holding {
  id: string
  type: HoldingType
  label?: string
  symbol?: string
  qty?: number
  value?: number
  costBasis?: number
  rate?: number
  account?: string
  manualAppraisal?: boolean
  track?: 'equity' | 'bonds' | 'mixed' | 'money_market'
  currency?: Currency
  // Israeli pension/gemel specific
  monthlyContribution?: number  // הפקדה חודשית (עובד + מעסיק)
  employerContribution?: number // חלק מעסיק
  employeeContribution?: number // חלק עובד
  yearsToRetirement?: number    // שנים לפרישה
  expectedMonthlyPension?: number // קצבה חודשית צפויה
  taxExempt?: boolean           // פטור ממס (קה"ש, פנסיה)
  providerName?: string         // שם קרן/חברה מנהלת
}

export interface Liability {
  id: string
  label: string
  principal: number
  currentBalance: number
  annualRate: number
  termMonths: number
  remainingPayments: number
  startDate: string
  currency?: Currency
}

export interface NetWorthSnapshot {
  date: string
  netWorth: number
  assets: number
  liabilities: number
}

export interface FinancialData {
  profile: Profile
  income: IncomeSource[]
  expenses: FixedExpense[]
  holdings: Holding[]
  liabilities: Liability[]
  snapshots: NetWorthSnapshot[]
}

export interface PriceMap {
  [symbol: string]: number
}

export interface ComputedPortfolio {
  totalAssets: number
  totalLiabilities: number
  netWorth: number
  monthlyIncome: number
  monthlyDebtPayments: number
  monthlySavings: number
  savingsRate: number
  liquidAssets: number
  illiquidAssets: number
  emergencyMonths: number
  monthlyPensionContributions: number
  pensionAssets: number
  allocationByType: { name: string; value: number; color: string }[]
  holdings: (Holding & { liveValue: number; gain?: number; gainPct?: number })[]
  liabilities: (Liability & { monthlyPayment: number })[]
}

export const SECTOR_MAP: Record<string, string> = {
  NVDA: 'Tech', AAPL: 'Tech', MSFT: 'Tech', GOOGL: 'Tech', META: 'Tech',
  AMZN: 'Tech', TSLA: 'Tech', AMD: 'Tech', INTC: 'Tech', AVGO: 'Tech',
  JPM: 'Finance', GS: 'Finance', BAC: 'Finance', V: 'Finance', MA: 'Finance',
  JNJ: 'Healthcare', PFE: 'Healthcare', UNH: 'Healthcare',
  XOM: 'Energy', CVX: 'Energy',
  BTC: 'Crypto', ETH: 'Crypto', SOL: 'Crypto',
}

export const TYPE_COLORS: Record<string, string> = {
  stock:              '#00E5A0',
  etf:                '#00C8D4',
  israeli_fund:       '#4DB8FF',
  crypto:             '#F5A623',
  cash:               '#8B95A1',
  deposit:            '#9BA8B5',
  savings:            '#6E7B8A',
  keren_hishtalmut:   '#A78BFA',
  pension:            '#C084FC',
  gemel:              '#818CF8',
  gemel_investiga:    '#6366F1',
  property:           '#FB923C',
  bonds:              '#34D399',
  other:              '#6B7280',
}

export const TYPE_LABELS: Record<string, string> = {
  stock:             'מניה',
  etf:               'תעודת סל',
  israeli_fund:      'קרן ישראלית',
  crypto:            'קריפטו',
  cash:              'מזומן',
  deposit:           'פיקדון',
  savings:           'חיסכון',
  keren_hishtalmut:  'קרן השתלמות',
  pension:           'פנסיה',
  gemel:             'גמל לפיצויים',
  gemel_investiga:   'גמל להשקעה',
  property:          'נדל"ן',
  bonds:             'אג"ח',
  other:             'אחר',
}

export const LIQUID_TYPES: HoldingType[] = ['stock', 'etf', 'israeli_fund', 'crypto', 'cash', 'deposit', 'savings', 'bonds']
export const PENSION_TYPES: HoldingType[] = ['pension', 'gemel', 'gemel_investiga', 'keren_hishtalmut']
export const TRADED_TYPES: HoldingType[] = ['stock', 'etf', 'israeli_fund', 'crypto']
