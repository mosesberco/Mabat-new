import { PriceMap, Holding } from './types'

let cache: { prices: PriceMap; ts: number } | null = null
const CACHE_MS = 10 * 60 * 1000

export async function fetchPrices(holdings: Holding[]): Promise<PriceMap> {
  const symbols = [...new Set(holdings.filter(h => h.symbol).map(h => h.symbol!))]
  if (symbols.length === 0) return {}

  if (cache && Date.now() - cache.ts < CACHE_MS) return cache.prices

  try {
    const res = await fetch('/api/prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbols }),
    })
    const data = await res.json() as PriceMap
    cache = { prices: data, ts: Date.now() }
    return data
  } catch {
    return cache?.prices ?? {}
  }
}
