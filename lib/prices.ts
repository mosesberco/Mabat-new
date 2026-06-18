import { PriceMap, Holding } from './types'

let cache: { prices: PriceMap; ts: number } | null = null
const CACHE_MS = 2 * 60 * 1000

export async function fetchPrices(
  holdings: Holding[],
  opts: { force?: boolean } = {},
): Promise<PriceMap> {
  const symbols = [...new Set(holdings.filter(h => h.symbol).map(h => h.symbol!))]
  if (symbols.length === 0) return {}

  // Use the cache only while it's fresh AND already covers every requested
  // symbol. A newly added holding won't be in it yet, so we must fetch right
  // away instead of waiting for the cache to expire (otherwise it reads as 0).
  // A forced refresh (the periodic poll) skips the cache entirely so prices
  // and FX rates stay current.
  const fresh = !opts.force && cache && Date.now() - cache.ts < CACHE_MS ? cache : null
  const missing = fresh ? symbols.filter(s => !(s in fresh.prices)) : symbols
  if (fresh && missing.length === 0) return fresh.prices

  try {
    const res = await fetch('/api/prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbols: missing }),
    })
    const data = await res.json() as PriceMap
    if (fresh) {
      // Merge the just-fetched symbol(s) into the still-fresh cache, keeping
      // the original timestamp so the regular refresh cycle stays intact.
      cache = { prices: { ...fresh.prices, ...data }, ts: fresh.ts }
    } else {
      cache = { prices: data, ts: Date.now() }
    }
    return cache.prices
  } catch {
    return cache?.prices ?? {}
  }
}
