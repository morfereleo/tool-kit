import type { Lang } from './i18n'
import seoData from './seo-data.json'

export const SITE_URL = seoData.siteUrl

type SeoEntry = {
  title: { es: string; en: string }
  desc: { es: string; en: string }
  name: { es: string; en: string }
  image: string
}

/** Título y descripción por ruta, pensados para búsqueda long-tail.
    La fuente de verdad es seo-data.json, compartida con scripts/prerender.mjs. */
const SEO = seoData.routes as Record<string, SeoEntry>

type Override = (lang: Lang) => { title: string; desc: string }

/** Textos calculados en vivo (p. ej. la tasa del día en /tasas) que
    reemplazan a los estáticos mientras la página los registre. */
const overrides = new Map<string, Override>()

export function setSeoOverride(path: string, fn: Override | null) {
  if (fn) overrides.set(path, fn)
  else overrides.delete(path)
}

const setMeta = (selector: string, content: string) => {
  document.querySelector(selector)?.setAttribute('content', content)
}

/** Actualiza título, descripción, canonical y og:* según la ruta y el idioma */
export function applySeo(path: string, lang: Lang) {
  const entry = SEO[path]
  if (!entry) {
    document.title = lang === 'es' ? 'Página no encontrada | AD·Tools' : 'Page not found | AD·Tools'
    return
  }
  const { title, desc } = overrides.get(path)?.(lang) ?? {
    title: entry.title[lang],
    desc: entry.desc[lang],
  }
  const url = `${SITE_URL}${path === '/' ? '/' : path}`

  document.title = title
  setMeta('meta[name="description"]', desc)
  setMeta('meta[property="og:title"]', title)
  setMeta('meta[property="og:description"]', desc)
  setMeta('meta[property="og:url"]', url)
  setMeta('meta[name="twitter:title"]', title)
  setMeta('meta[name="twitter:description"]', desc)
  setMeta('meta[property="og:image"]', `${SITE_URL}${entry.image}`)
  setMeta('meta[name="twitter:image"]', `${SITE_URL}${entry.image}`)

  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.appendChild(canonical)
  }
  canonical.href = url
}
