/**
 * Prerender del <head> por ruta tras `vite build` (ver script "build"):
 *
 * - dist/<ruta>/index.html con título, descripción, canonical, og/twitter y
 *   datos estructurados (JSON-LD) propios de cada herramienta, para que los
 *   scrapers sociales (sin JS) y los crawlers reciban los metadatos correctos.
 * - /tasas no se escribe en su ruta: va a dist/_tpl/tasas.html y lo sirve
 *   api/tasas-page con la tasa BCV del día inyectada (ver vercel.json).
 * - dist/404.html (noindex) para URLs inexistentes: sin él, el hosting
 *   devolvería la home con 200 y Google lo trataría como contenido duplicado.
 * - dist/sitemap.xml generado desde la misma fuente, con lastmod del build.
 *
 * La fuente de verdad de los textos es src/lib/seo-data.json (compartida con
 * la app, que actualiza el head en cliente al navegar o cambiar de idioma).
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
const today = new Date().toISOString().slice(0, 10)

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

const setTag = (html, pattern, replacement, label, route) => {
  if (!pattern.test(html)) {
    throw new Error(`prerender: no se encontró ${label} en index.html (ruta ${route})`)
  }
  return html.replace(pattern, replacement)
}

const urlOf = (route) => `${siteUrl}${route === '/' ? '/' : route}`

/** JSON-LD por ruta: la home declara el sitio; cada herramienta, la app y sus migas de pan */
function jsonLd(route, entry) {
  const author = { '@type': 'Person', name: 'Alejandro Danieles', url: 'https://alejandrodanieles.com' }
  const app = {
    '@type': 'WebApplication',
    name: entry.name.es,
    alternateName: entry.name.en,
    url: urlOf(route),
    description: entry.desc.es,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    inLanguage: ['es', 'en'],
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    author,
  }
  if (route === '/') {
    return {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebSite', name: 'AD·Tools', url: urlOf('/'), inLanguage: ['es', 'en'], author },
        app,
      ],
    }
  }
  return {
    '@context': 'https://schema.org',
    '@graph': [
      app,
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'AD·Tools', item: urlOf('/') },
          { '@type': 'ListItem', position: 2, name: entry.name.es, item: urlOf(route) },
        ],
      },
    ],
  }
}

const LD_RE = /<script type="application\/ld\+json">[\s\S]*?<\/script>/

for (const [route, entry] of Object.entries(routes)) {
  const t = esc(entry.title.es)
  const d = esc(entry.desc.es)
  const url = urlOf(route)
  const img = `${siteUrl}${entry.image}`

  let html = base
  html = setTag(html, /<title>[^<]*<\/title>/, `<title>${t}</title>`, '<title>', route)
  html = setTag(html, /(<meta name="description"\s+content=")[^"]*(")/, `$1${d}$2`, 'meta description', route)
  html = setTag(html, /(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`, 'canonical', route)
  html = setTag(html, /(<meta property="og:title" content=")[^"]*(")/, `$1${t}$2`, 'og:title', route)
  html = setTag(html, /(<meta\s+property="og:description"\s+content=")[^"]*(")/s, `$1${d}$2`, 'og:description', route)
  html = setTag(html, /(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`, 'og:url', route)
  html = setTag(html, /(<meta name="twitter:title" content=")[^"]*(")/, `$1${t}$2`, 'twitter:title', route)
  html = setTag(html, /(<meta\s+name="twitter:description"\s+content=")[^"]*(")/s, `$1${d}$2`, 'twitter:description', route)
  html = setTag(html, /(<meta property="og:image" content=")[^"]*(")/, `$1${img}$2`, 'og:image', route)
  html = setTag(html, /(<meta name="twitter:image" content=")[^"]*(")/, `$1${img}$2`, 'twitter:image', route)
  html = setTag(
    html,
    LD_RE,
    `<script type="application/ld+json">${JSON.stringify(jsonLd(route, entry))}</script>`,
    'JSON-LD',
    route,
  )

  const target =
    route === '/' ? 'index.html' : route === '/tasas' ? '_tpl/tasas.html' : `${route.slice(1)}/index.html`
  mkdirSync(dirname(join(dist, target)), { recursive: true })
  writeFileSync(join(dist, target), html)
  console.log(`prerender: ${route.padEnd(11)} -> ${target}`)
}

/* 404 real: misma app (que muestra su página de "no encontrado"), sin canonical y noindex */
let notFound = base
notFound = setTag(notFound, /<title>[^<]*<\/title>/, '<title>Página no encontrada | AD·Tools</title>', '<title>', '404')
notFound = setTag(notFound, /\s*<link rel="canonical" href="[^"]*" \/>/, '', 'canonical', '404')
notFound = notFound.replace('</head>', '    <meta name="robots" content="noindex" />\n  </head>')
writeFileSync(join(dist, '404.html'), notFound)
console.log('prerender: 404         -> 404.html')

/* sitemap con la fecha de este build */
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...Object.keys(routes).map(
    (route) =>
      `  <url><loc>${urlOf(route)}</loc><lastmod>${today}</lastmod><changefreq>${
        route === '/tasas' ? 'daily' : 'monthly'
      }</changefreq><priority>${route === '/' ? '1.0' : route === '/iva' || route === '/tasas' ? '0.9' : '0.8'}</priority></url>`,
  ),
  '</urlset>',
  '',
].join('\n')
writeFileSync(join(dist, 'sitemap.xml'), sitemap)
console.log(`prerender: sitemap     -> sitemap.xml (${Object.keys(routes).length} URLs, lastmod ${today})`)
