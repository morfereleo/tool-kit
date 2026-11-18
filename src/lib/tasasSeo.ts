/**
 * Título y descripción de /tasas con la tasa BCV del día. Sin dependencias del
 * DOM: lo usan la función api/tasas-page (HTML servido a crawlers y scrapers)
 * y TasasPage en el navegador, así ambos muestran exactamente lo mismo.
 */
export type TasasSeoInput = {
  usd: number
  eur: number | null
  /** Fecha ISO de actualización de la tasa */
  date: string
  lang: 'es' | 'en'
}

const fmtBs = (n: number, lang: 'es' | 'en') =>
  new Intl.NumberFormat(lang === 'es' ? 'es-VE' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)

// Se arma a mano desde las partes: el formato "short" varía entre Node y los
// navegadores ("18-nov." vs "18 nov"), y servidor y cliente deben coincidir.
const fmtDay = (iso: string, lang: 'es' | 'en') => {
  const parts = new Intl.DateTimeFormat(lang === 'es' ? 'es-VE' : 'en-US', {
    day: 'numeric',
    month: 'short',
    timeZone: 'America/Caracas',
  }).formatToParts(new Date(iso))
  const day = parts.find((p) => p.type === 'day')?.value ?? ''
  const month = (parts.find((p) => p.type === 'month')?.value ?? '').replace('.', '')
  return lang === 'es' ? `${day} ${month}` : `${month} ${day}`
}

export function tasasSeo({ usd, eur, date, lang }: TasasSeoInput) {
  const day = fmtDay(date, lang)
  const u = fmtBs(usd, lang)
  const e = eur ? fmtBs(eur, lang) : null
  if (lang === 'es') {
    return {
      title: `Dólar BCV hoy ${day}: Bs ${u}${e ? ` · Euro Bs ${e}` : ''} | AD·Tools`,
      desc: `Tasa oficial del BCV (${day}): dólar Bs ${u}${e ? `, euro Bs ${e}` : ''}. Dólar paralelo, USDT estimado, variación diaria y conversor Bs ⇄ $. Gratis y sin registro.`,
    }
  }
  return {
    title: `BCV dollar today ${day}: Bs ${u}${e ? ` · Euro Bs ${e}` : ''} | AD·Tools`,
    desc: `Official BCV rate (${day}): dollar Bs ${u}${e ? `, euro Bs ${e}` : ''}. Parallel dollar, estimated USDT, daily change and a Bs ⇄ $ converter. Free, no sign-up.`,
  }
}
