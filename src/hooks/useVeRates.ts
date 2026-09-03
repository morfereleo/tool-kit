import { useCallback, useEffect, useRef, useState } from 'react'

export type RateKey = 'USD_BCV' | 'EUR_BCV' | 'USD_PARALELO' | 'USDT'

export type Rates = Record<RateKey, number | null>

export type RatesStatus = 'loading' | 'ok' | 'error'

/** Variación porcentual de cada tasa vs. el último día anterior con datos (null = sin referencia) */
export type RateDeltas = Record<RateKey, number | null>

const PREV_KEY = 'adtools-rates-prev'
const TODAY_KEY = 'adtools-rates-today'

const EMPTY: Rates = { USD_BCV: null, EUR_BCV: null, USD_PARALELO: null, USDT: null }

type Snapshot = { rates: Rates; at: string }

type FetchResult = { rates: Rates; updatedAt: string; anyOk: boolean }

async function fetchJson(url: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(String(res.status))
  return res.json()
}

/** Un endpoint caído no debe anular los demás: cada tasa se degrada por separado. */
async function fetchRates(): Promise<FetchResult> {
  const [usd, eur, par] = await Promise.allSettled([
    fetchJson('https://ve.dolarapi.com/v1/dolares/oficial'),
    fetchJson('https://ve.dolarapi.com/v1/euros/oficial'),
    fetchJson('https://ve.dolarapi.com/v1/dolares/paralelo'),
  ])
  const val = (r: PromiseSettledResult<{ promedio?: unknown }>) =>
    r.status === 'fulfilled' && typeof r.value?.promedio === 'number' ? r.value.promedio : null
  const parVal = val(par)
  const rates: Rates = {
    USD_BCV: val(usd),
    EUR_BCV: val(eur),
    USD_PARALELO: parVal,
    // USDT: el P2P bloquea CORS desde el navegador; se estima con el paralelo (editable).
    USDT: parVal,
  }
  const dates = [usd, eur, par]
    .map((r) => (r.status === 'fulfilled' ? r.value?.fechaActualizacion : null))
    .filter(Boolean)
    .sort()
  return {
    rates,
    updatedAt: dates[0] ?? new Date().toISOString(),
    anyOk: Object.values(rates).some((v) => v != null),
  }
}

/* Caché de módulo: las páginas comparten una sola consulta (evita el doble
   tráfico cuando IVA y Tasas montan el hook por separado, y el doble fetch
   de StrictMode). `reload` fuerza una consulta nueva. */
const CACHE_TTL = 60_000
let cached: { result: FetchResult; at: number } | null = null
let inflight: Promise<FetchResult> | null = null

async function getRates(force: boolean): Promise<FetchResult> {
  if (!force && cached && Date.now() - cached.at < CACHE_TTL) return cached.result
  if (!force && inflight) return inflight
  const p = fetchRates()
    .then((result) => {
      cached = { result, at: Date.now() }
      return result
    })
    .finally(() => {
      if (inflight === p) inflight = null
    })
  inflight = p
  return p
}

const dayOf = (iso: string) => iso.slice(0, 10)

const readSnapshot = (key: string): Snapshot | null => {
  try {
    const s = JSON.parse(localStorage.getItem(key) || 'null') as Snapshot | null
    return s?.rates && s?.at ? s : null
  } catch {
    return null
  }
}

/**
 * Deltas con significado: se comparan contra la última consulta de un día
 * ANTERIOR (no contra la carga previa de la misma sesión). El snapshot de hoy
 * se promueve a "previo" cuando cambia el día.
 */
function computeDeltas(next: Rates): { deltas: RateDeltas; prevAt: string } {
  const deltas: RateDeltas = { ...EMPTY }
  let prevAt = ''
  try {
    const today = readSnapshot(TODAY_KEY)
    let prev = readSnapshot(PREV_KEY)
    const nowIso = new Date().toISOString()
    if (today && dayOf(today.at) !== dayOf(nowIso)) {
      prev = today
      localStorage.setItem(PREV_KEY, JSON.stringify(today))
    }
    if (prev) {
      const base = prev
      ;(Object.keys(next) as RateKey[]).forEach((k) => {
        const before = base.rates[k]
        const now = next[k]
        if (before && now && before > 0) deltas[k] = ((now - before) / before) * 100
      })
      prevAt = prev.at
    }
    localStorage.setItem(TODAY_KEY, JSON.stringify({ rates: next, at: nowIso }))
  } catch {
    /* navegación privada — sin referencia previa */
  }
  return { deltas, prevAt }
}

export function useVeRates() {
  const [rates, setRates] = useState<Rates>(EMPTY)
  const [deltas, setDeltas] = useState<RateDeltas>(EMPTY)
  const [prevAt, setPrevAt] = useState<string>('')
  const [status, setStatus] = useState<RatesStatus>('loading')
  const [updatedAt, setUpdatedAt] = useState<string>('')
  const seq = useRef(0)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const load = useCallback(async (force: boolean) => {
    const mySeq = ++seq.current
    setStatus('loading')
    try {
      const result = await getRates(force)
      // ignora respuestas tardías de recargas anteriores y desmontajes
      if (!mounted.current || mySeq !== seq.current) return
      const { deltas: d, prevAt: p } = computeDeltas(result.rates)
      setRates(result.rates)
      setDeltas(d)
      setPrevAt(p)
      setUpdatedAt(result.updatedAt)
      setStatus(result.anyOk ? 'ok' : 'error')
    } catch {
      if (!mounted.current || mySeq !== seq.current) return
      setStatus('error')
    }
  }, [])

  const reload = useCallback(() => load(true), [load])

  useEffect(() => {
    load(false)
  }, [load])

  return { rates, deltas, prevAt, status, updatedAt, reload }
}
