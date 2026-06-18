import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

const CACHE_SECONDS = 120

// Crypto symbols → CoinGecko ids (mirrors the map in /api/prices).
const CRYPTO_IDS: Record<string, string> = {
  BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', BNB: 'binancecoin',
  ADA: 'cardano', XRP: 'ripple', DOGE: 'dogecoin', AVAX: 'avalanche-2',
}

type Range = '1W' | '1M' | '3M' | '1Y'

interface CandleResponse {
  points: { t: number; c: number }[]   // t = ms epoch, c = close (native currency)
  currency: string
  current: number | null
  prevClose: number | null
  high52: number | null
  low52: number | null
}

const EMPTY: CandleResponse = {
  points: [], currency: 'USD', current: null, prevClose: null, high52: null, low52: null,
}

const YAHOO_RANGE: Record<Range, { range: string; interval: string }> = {
  '1W': { range: '5d', interval: '30m' },
  '1M': { range: '1mo', interval: '1d' },
  '3M': { range: '3mo', interval: '1d' },
  '1Y': { range: '1y', interval: '1d' },
}

const COINGECKO_DAYS: Record<Range, number> = { '1W': 7, '1M': 30, '3M': 90, '1Y': 365 }

export async function POST(req: NextRequest) {
  try {
    const { symbol, range = '1M' } = await req.json() as { symbol?: string; range?: Range }
    if (!symbol) return NextResponse.json(EMPTY)

    const r: Range = (['1W', '1M', '3M', '1Y'] as Range[]).includes(range) ? range : '1M'
    const data = CRYPTO_IDS[symbol]
      ? await fetchCrypto(CRYPTO_IDS[symbol], r)
      : await fetchStock(symbol, r)
    return NextResponse.json(data, {
      headers: { 'Cache-Control': `s-maxage=${CACHE_SECONDS}, stale-while-revalidate` },
    })
  } catch {
    return NextResponse.json(EMPTY)
  }
}

async function fetchStock(symbol: string, range: Range): Promise<CandleResponse> {
  const { range: rng, interval } = YAHOO_RANGE[range]
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${rng}&interval=${interval}`,
    { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: CACHE_SECONDS } },
  )
  const json = await res.json() as {
    chart?: { result?: [{
      meta?: { currency?: string; regularMarketPrice?: number; chartPreviousClose?: number; fiftyTwoWeekHigh?: number; fiftyTwoWeekLow?: number }
      timestamp?: number[]
      indicators?: { quote?: [{ close?: (number | null)[] }] }
    }] }
  }
  const result = json.chart?.result?.[0]
  if (!result) return EMPTY
  const ts = result.timestamp ?? []
  const closes = result.indicators?.quote?.[0]?.close ?? []
  const points = ts
    .map((t, i) => (closes[i] != null ? { t: t * 1000, c: closes[i] as number } : null))
    .filter((p): p is { t: number; c: number } => p !== null)
  const meta = result.meta ?? {}
  return {
    points,
    // '' (not 'USD') when Yahoo omits it, so the client can fall back to the
    // holding's own currency rather than mislabelling a non-USD price as $.
    currency: meta.currency ?? '',
    current: meta.regularMarketPrice ?? (points.at(-1)?.c ?? null),
    prevClose: meta.chartPreviousClose ?? null,
    high52: meta.fiftyTwoWeekHigh ?? null,
    low52: meta.fiftyTwoWeekLow ?? null,
  }
}

async function fetchCrypto(id: string, range: Range): Promise<CandleResponse> {
  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${COINGECKO_DAYS[range]}`,
    { next: { revalidate: CACHE_SECONDS } },
  )
  const json = await res.json() as { prices?: [number, number][] }
  const prices = json.prices ?? []
  const points = prices.map(([t, c]) => ({ t, c }))
  // CoinGecko returns hourly points for 2–90 days, so .at(-2) would be ~1h ago,
  // not yesterday. Anchor the "day change" to a true 24h-ago point instead, so
  // it's correct and independent of the selected chart range.
  const last = points.at(-1)
  const cutoff = last ? last.t - 86_400_000 : 0
  const prev = [...points].reverse().find(p => p.t <= cutoff) ?? points[0]
  return {
    points,
    currency: 'USD',
    current: last?.c ?? null,
    prevClose: prev?.c ?? null,
    high52: null,
    low52: null,
  }
}
