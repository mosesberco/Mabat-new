import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

const FINNHUB_KEY = process.env.FINNHUB_API_KEY ?? ''
const CACHE_SECONDS = 120

const CRYPTO_IDS: Record<string, string> = {
  BTC: 'bitcoin', ETH: 'ethereum', USDT: 'tether', USDC: 'usd-coin',
  BNB: 'binancecoin', SOL: 'solana', XRP: 'ripple', ADA: 'cardano',
  DOGE: 'dogecoin', AVAX: 'avalanche-2', DOT: 'polkadot', LINK: 'chainlink',
  LTC: 'litecoin', TRX: 'tron', SHIB: 'shiba-inu',
}

export async function POST(req: NextRequest) {
  const { symbols } = await req.json() as { symbols: string[] }

  const cryptoSymbols = symbols.filter(s => CRYPTO_IDS[s])
  const stockSymbols = symbols.filter(s => !CRYPTO_IDS[s])

  const results: Record<string, number> = {}

  // Crypto via CoinGecko (no key needed)
  if (cryptoSymbols.length > 0) {
    const ids = cryptoSymbols.map(s => CRYPTO_IDS[s]).join(',')
    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`, {
        next: { revalidate: CACHE_SECONDS },
      })
      const data = await res.json() as Record<string, { usd: number }>
      cryptoSymbols.forEach(s => {
        const id = CRYPTO_IDS[s]
        if (data[id]) results[s] = data[id].usd
      })
    } catch {
      // leave as undefined — UI will show N/A
    }
  }

  // Stocks/ETFs via Finnhub
  if (stockSymbols.length > 0 && FINNHUB_KEY) {
    await Promise.all(
      stockSymbols.map(async (sym) => {
        try {
          const res = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${sym}&token=${FINNHUB_KEY}`,
            { next: { revalidate: CACHE_SECONDS } }
          )
          const data = await res.json() as { c: number }
          if (data.c > 0) results[sym] = data.c
        } catch {
          // skip
        }
      })
    )
  } else if (stockSymbols.length > 0) {
    // Fallback: mock prices for dev/demo
    const MOCK: Record<string, number> = {
      NVDA: 137, AAPL: 213, MSFT: 420, GOOGL: 178, META: 580,
      AMZN: 200, TSLA: 175, AMD: 160, SPY: 548, QQQ: 470,
      'CSPX.L': 510, VT: 110, VOO: 510,
    }
    stockSymbols.forEach(s => { if (MOCK[s]) results[s] = MOCK[s] })
  }

  // FX rates → ₪. Seed static fallbacks first so a transient FX outage (or a
  // malformed response) can't zero out non-ILS cash; live values overwrite them.
  results['__USD_ILS'] = 3.7
  results['__EUR_ILS'] = 4.0
  results['__GBP_ILS'] = 4.7
  results['__CHF_ILS'] = 4.2
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: CACHE_SECONDS },
    })
    const data = await res.json() as { rates: Record<string, number> }
    const rates = data.rates ?? {}
    const ilsPerUsd = rates['ILS'] ?? 3.7
    results['__USD_ILS'] = ilsPerUsd
    // rates are "X per USD", so 1 CUR = (ILS per USD) / (CUR per USD) ILS. Return
    // a rate for every currency the API knows so any fiat denomination works.
    for (const cur of Object.keys(rates)) {
      if (cur !== 'ILS' && cur !== 'USD' && rates[cur]) results[`__${cur}_ILS`] = ilsPerUsd / rates[cur]
    }
  } catch {
    // keep the static fallbacks set above
  }

  return NextResponse.json(results, {
    headers: { 'Cache-Control': `s-maxage=${CACHE_SECONDS}, stale-while-revalidate` },
  })
}
