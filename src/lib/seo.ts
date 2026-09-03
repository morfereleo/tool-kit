import type { Lang } from './i18n'
import seoData from './seo-data.json'

export const SITE_URL = seoData.siteUrl

type SeoEntry = {
  title: { es: string; en: string }
  desc: { es: string; en: string }
}

/** Título y descripción por ruta, pensados para búsqueda long-tail.
    La fuente de verdad es seo-data.json, compartida con scripts/prerender.mjs. */
const SEO = seoData.routes as Record<string, SeoEntry>

const setMeta = (selector: string, content: string) => {
  document.querySelector(selector)?.setAttribute('content', content)
}

/** Actualiza título, descripción, canonical y og:* según la ruta y el idioma */
export function applySeo(path: string, lang: Lang) {
  const entry = SEO[path] ?? SEO['/']
  const title = entry.title[lang]
  const desc = entry.desc[lang]
  const url = `${SITE_URL}${path === '/' ? '/' : path}`

  document.title = title
  setMeta('meta[name="description"]', desc)
  setMeta('meta[property="og:title"]', title)
  setMeta('meta[property="og:description"]', desc)
  setMeta('meta[property="og:url"]', url)
  setMeta('meta[name="twitter:title"]', title)
  setMeta('meta[name="twitter:description"]', desc)

  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.appendChild(canonical)
  }
  canonical.href = url
}
