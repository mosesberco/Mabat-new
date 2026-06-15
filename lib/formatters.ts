export function formatILS(value: number, compact = false): string {
  if (compact) {
    if (Math.abs(value) >= 1_000_000) return `₪${(value / 1_000_000).toFixed(2)}M`
    if (Math.abs(value) >= 1_000) return `₪${(value / 1_000).toFixed(0)}K`
    return `₪${value.toFixed(0)}`
  }
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(value)
}

export function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

export function formatPct(value: number, decimals = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('he-IL').format(Math.round(value))
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('he-IL', { month: 'short', year: '2-digit' })
}

export function getAge(birthDate: string): number {
  const birth = new Date(birthDate)
  const now = new Date()
  return Math.floor((now.getTime() - birth.getTime()) / (365.25 * 24 * 3600 * 1000))
}
