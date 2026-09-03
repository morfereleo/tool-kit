import { useEffect, useState } from 'react'

const normalize = (p: string) => (p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p) || '/'

/**
 * Router mínimo sobre la History API: rutas reales (/iva, /qr…) en vez de
 * hash routing. Intercepta los clics en enlaces internos (href que empieza
 * por "/"), hace pushState y escucha popstate. Los enlaces antiguos con
 * hash (#/qr) se redirigen al cargar para no romper URLs compartidas.
 */
export function useRoute() {
  const [path, setPath] = useState(() => {
    const legacy = window.location.hash.match(/^#(\/.+)$/)
    if (legacy) {
      window.history.replaceState(null, '', legacy[1])
      return normalize(legacy[1])
    }
    return normalize(window.location.pathname)
  })

  useEffect(() => {
    const onNavigate = () => {
      setPath(normalize(window.location.pathname))
      window.scrollTo({ top: 0 })
    }
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element | null)?.closest?.('a')
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return
      const href = a.getAttribute('href')
      if (!href || !href.startsWith('/')) return
      e.preventDefault()
      if (normalize(href) !== normalize(window.location.pathname)) {
        window.history.pushState(null, '', href)
      }
      onNavigate()
    }
    window.addEventListener('popstate', onNavigate)
    document.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('popstate', onNavigate)
      document.removeEventListener('click', onClick)
    }
  }, [])

  return path
}
