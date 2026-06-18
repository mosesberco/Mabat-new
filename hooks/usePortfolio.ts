'use client'
import { useState, useEffect, useCallback } from 'react'
import { FinancialData, PriceMap, ComputedPortfolio } from '@/lib/types'
import { loadData, saveData, saveSnapshot, defaultData } from '@/lib/storage'
import { fetchPrices } from '@/lib/prices'
import { computePortfolio } from '@/lib/calculations'

export function usePortfolio() {
  const [data, setData] = useState<FinancialData>(defaultData)
  const [prices, setPrices] = useState<PriceMap>({})
  const [loading, setLoading] = useState(true)
  const [pricesLoading, setPricesLoading] = useState(false)
  const [portfolio, setPortfolio] = useState<ComputedPortfolio | null>(null)

  const usdRate = prices['__USD_ILS'] ?? 3.7

  useEffect(() => {
    const d = loadData()
    setData(d)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (loading) return
    setPricesLoading(true)
    fetchPrices(data.holdings).then(p => {
      setPrices(p)
      setPricesLoading(false)
    })
  }, [loading, data.holdings])

  // Keep prices and FX rates fresh: re-poll every 2 minutes in the background
  // (forced, bypassing the cache). Silent — no loading spinner on each tick.
  useEffect(() => {
    if (loading) return
    const REFRESH_MS = 2 * 60 * 1000
    const id = setInterval(() => {
      fetchPrices(data.holdings, { force: true }).then(setPrices)
    }, REFRESH_MS)
    return () => clearInterval(id)
  }, [loading, data.holdings])

  useEffect(() => {
    if (loading) return
    const computed = computePortfolio(data, prices, usdRate)
    setPortfolio(computed)
    if (!loading && !pricesLoading && computed.netWorth !== 0) {
      const updated = saveSnapshot(data, computed.netWorth, computed.totalAssets, computed.totalLiabilities)
      if (updated.snapshots.length !== data.snapshots.length) {
        setData(updated)
      }
    }
  }, [data, prices, usdRate, loading, pricesLoading])

  const update = useCallback((updater: (d: FinancialData) => FinancialData) => {
    setData(prev => {
      const next = updater(prev)
      saveData(next)
      return next
    })
  }, [])

  return { data, portfolio, prices, usdRate, loading, pricesLoading, update, setData }
}
