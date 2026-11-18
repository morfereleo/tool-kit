import type { VercelRequest, VercelResponse } from '@vercel/node'
// la extensión .js es obligatoria: la función corre como ES module en Node
import { tasasSeo } from '../src/lib/tasasSeo.js'

/**
 * Sirve /tasas con la tasa BCV del día en <title>, description y og/twitter,
 * para que Google y las previsualizaciones sociales muestren el dato vigente
 * sin ejecutar JavaScript. El HTML base es el prerender de la ruta
 * (dist/_tpl/tasas.html); si la API de tasas falla, se sirve tal cual.
 */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

async function fetchJson(url: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(4000) })
  if (!res.ok) throw new Error(String(res.status))
  return res.json() as Promise<{ promedio?: number; fechaActualizacion?: string }>
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const host = req.headers['x-forwarded-host'] ?? req.headers.host
  const proto = req.headers['x-forwarded-proto'] ?? 'https'
  const origin = `${proto}://${host}`
  let tplRes = await fetch(`${origin}/_tpl/tasas.html`)
  if (!tplRes.ok) tplRes = await fetch(`${origin}/index.html`)
  let html = await tplRes.text()

  const [usd, eur] = await Promise.allSettled([
    fetchJson('https://ve.dolarapi.com/v1/dolares/oficial'),
    fetchJson('https://ve.dolarapi.com/v1/euros/oficial'),
  ])
  const usdVal = usd.status === 'fulfilled' ? usd.value.promedio : undefined

  if (typeof usdVal === 'number') {
    const eurVal = eur.status === 'fulfilled' && typeof eur.value.promedio === 'number' ? eur.value.promedio : null
    const date = (usd.status === 'fulfilled' && usd.value.fechaActualizacion) || new Date().toISOString()
    const { title, desc } = tasasSeo({ usd: usdVal, eur: eurVal, date, lang: 'es' })
    const t = esc(title)
    const d = esc(desc)
    html = html
      .replace(/<title>[^<]*<\/title>/, `<title>${t}</title>`)
      .replace(/(<meta name="description"\s+content=")[^"]*(")/, `$1${d}$2`)
      .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${t}$2`)
      .replace(/(<meta\s+property="og:description"\s+content=")[^"]*(")/s, `$1${d}$2`)
      .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${t}$2`)
      .replace(/(<meta\s+name="twitter:description"\s+content=")[^"]*(")/s, `$1${d}$2`)
  }

  res.setHeader('content-type', 'text/html; charset=utf-8')
  res.setHeader('cache-control', 'public, max-age=0, s-maxage=1800, stale-while-revalidate=86400')
  res.status(200).send(html)
}
