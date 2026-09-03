/**
 * Prerender de <head> por ruta: genera dist/<ruta>/index.html con el título,
 * la descripción, el canonical y las etiquetas og/twitter de cada herramienta,
 * para que los scrapers de redes sociales (que no ejecutan JS) y los crawlers
 * reciban los metadatos correctos al pedir /iva, /qr, etc.
 *
 * La fuente de verdad de los textos es src/lib/seo-data.json (compartida con
 * la app, que sigue actualizando el head en cliente al navegar o cambiar de
 * idioma). Se ejecuta tras `vite build` (ver script "build" en package.json).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const { siteUrl, routes } = JSON.parse(
  readFileSync(join(root, 'src/lib/seo-data.json'), 'utf8'),
)

const base = readFileSync(join(dist, 'index.html'), 'utf8')

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

const setTag = (html, pattern, replacement, label, route) => {
  if (!pattern.test(html)) {
    throw new Error(`prerender: no se encontró ${label} en index.html (ruta ${route})`)
  }
  return html.replace(pattern, replacement)
}

for (const [route, { title, desc, image }] of Object.entries(routes)) {
  const t = esc(title.es)
  const d = esc(desc.es)
  const url = `${siteUrl}${route === '/' ? '/' : route}`
  const img = `${siteUrl}${image}`

  let html = base
  html = setTag(html, /<title>[^<]*<\/title>/, `<title>${t}</title>`, '<title>', route)
  html = setTag(
    html,
    /(<meta name="description"\s+content=")[^"]*(")/,
    `$1${d}$2`,
    'meta description',
    route,
  )
  html = setTag(
    html,
    /(<link rel="canonical" href=")[^"]*(")/,
    `$1${url}$2`,
    'canonical',
    route,
  )
  html = setTag(html, /(<meta property="og:title" content=")[^"]*(")/, `$1${t}$2`, 'og:title', route)
  html = setTag(html, /(<meta\s+property="og:description"\s+content=")[^"]*(")/s, `$1${d}$2`, 'og:description', route)
  html = setTag(html, /(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`, 'og:url', route)
  html = setTag(html, /(<meta name="twitter:title" content=")[^"]*(")/, `$1${t}$2`, 'twitter:title', route)
  html = setTag(html, /(<meta\s+name="twitter:description"\s+content=")[^"]*(")/s, `$1${d}$2`, 'twitter:description', route)
  html = setTag(html, /(<meta property="og:image" content=")[^"]*(")/, `$1${img}$2`, 'og:image', route)
  html = setTag(html, /(<meta name="twitter:image" content=")[^"]*(")/, `$1${img}$2`, 'twitter:image', route)

  const outDir = route === '/' ? dist : join(dist, route.slice(1))
  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, 'index.html'), html)
  console.log(`prerender: ${route.padEnd(11)} -> ${route === '/' ? 'index.html' : route.slice(1) + '/index.html'}`)
}
