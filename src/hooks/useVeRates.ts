import { useCallback, useEffect, useState } from 'react'

export type RateKey = 'USD_BCV' | 'EUR_BCV' | 'USD_PARALELO' | 'USDT'

export type Rates = Record<RateKey, number | null>

export type RatesStatus = 'loading' | 'ok' | 'error'

/** Variación porcentual de cada tasa vs. la consulta anterior (null = sin referencia) */
export type RateDeltas = Record<RateKey, number | null>

const PREV_KEY = 'adtools-rates-prev'

async function fetchJson(url: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(String(res.status))
  return res.json()
}

export function useVeRates() {
  const [rates, setRates] = useState<Rates>({
    USD_BCV: null,
    EUR_BCV: null,
    USD_PARALELO: null,
    USDT: null,
  })
  const [deltas, setDeltas] = useState<RateDeltas>({
    USD_BCV: null,
    EUR_BCV: null,
    USD_PARALELO: null,
    USDT: null,
  })
  const [prevAt, setPrevAt] = useState<string>('')
  const [status, setStatus] = useState<RatesStatus>('loading')
  const [updatedAt, setUpdatedAt] = useState<string>('')

  const reload = useCallback(async () => {
    setStatus('loading')
    try {
      const [usd, eur, par] = await Promise.all([
        fetchJson('https://ve.dolarapi.com/v1/dolares/oficial'),
        fetchJson('https://ve.dolarapi.com/v1/euros/oficial'),
        fetchJson('https://ve.dolarapi.com/v1/dolares/paralelo'),
      ])
      // USDT: el P2P bloquea CORS desde el navegador; se estima con el paralelo (editable).
      const next: Rates = {
        USD_BCV: typeof usd?.promedio === 'number' ? usd.promedio : null,
        EUR_BCV: typeof eur?.promedio === 'number' ? eur.promedio : null,
        USD_PARALELO: typeof par?.promedio === 'number' ? par.promedio : null,
        USDT: typeof par?.promedio === 'number' ? par.promedio : null,
      }
      // Comparar contra la consulta anterior guardada en este navegador
      try {
        const prev = JSON.parse(localStorage.getItem(PREV_KEY) || 'null') as {
          rates?: Rates
          at?: string
        } | null
        if (prev?.rates) {
          const d: RateDeltas = { USD_BCV: null, EUR_BCV: null, USD_PARALELO: null, USDT: null }
          ;(Object.keys(next) as RateKey[]).forEach((k) => {
            const before = prev.rates?.[k]
            const now = next[k]
            if (before && now && before > 0) d[k] = ((now - before) / before) * 100
          })
          setDeltas(d)
          if (prev.at) setPrevAt(prev.at)
        }
        localStorage.setItem(PREV_KEY, JSON.stringify({ rates: next, at: new Date().toISOString() }))
      } catch {
        /* navegación privada — sin referencia previa */
      }
      setRates(next)
      const dates = [usd?.fechaActualizacion, eur?.fechaActualizacion, par?.fechaActualizacion]
        .filter(Boolean)
        .sort()
      setUpdatedAt(dates[0] ?? new Date().toISOString())
      setStatus('ok')
    } catch {
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return { rates, deltas, prevAt, status, updatedAt, reload }
}
