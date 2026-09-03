import { useCallback, useEffect, useRef, useState } from 'react'
import Modal from '@/components/Modal'
import { fmtBytes } from '@/lib/format'
import { useT } from '@/lib/i18n'

/**
 * Comparador antes/después con slider arrastrable (mouse + touch + teclado).
 * Izquierda: original · Derecha: WebP optimizada.
 */
export default function BeforeAfterModal({
  originalUrl,
  webpUrl,
  name,
  originalSize,
  webpSize,
  accent,
  onClose,
}: {
  originalUrl: string
  webpUrl: string
  name: string
  originalSize: number
  webpSize: number
  accent: string
  onClose: () => void
}) {
  const [pos, setPos] = useState(50)
  const t = useT()
  const trackRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)

  const move = useCallback((clientX: number) => {
    const el = trackRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const pct = ((clientX - rect.left) / rect.width) * 100
    setPos(Math.min(98, Math.max(2, pct)))
  }, [])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (draggingRef.current) move(e.clientX)
    }
    const stop = () => (draggingRef.current = false)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', stop)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', stop)
    }
  }, [move])

  const saving = Math.round((1 - webpSize / originalSize) * 100)

  return (
    <Modal
      title={name}
      subtitle={
        <span className="font-mono">
          {fmtBytes(originalSize)} →{' '}
          <span className="font-semibold" style={{ color: accent }}>{fmtBytes(webpSize)}</span>
          {' '}· −{saving}%
        </span>
      }
      onClose={onClose}
      maxWidth="max-w-3xl"
    >
      <div className="overflow-y-auto p-5">
        <div
          ref={trackRef}
          role="slider"
          tabIndex={0}
          aria-label={t('compare.hint')}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          className="relative w-full cursor-ew-resize select-none overflow-hidden rounded-xl border border-line outline-none focus-visible:ring-2 focus-visible:ring-inkmuted"
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => {
            draggingRef.current = true
            move(e.clientX)
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') setPos((p) => Math.max(2, p - 4))
            if (e.key === 'ArrowRight') setPos((p) => Math.min(98, p + 4))
          }}
        >
          {/* optimizada (fondo completo) */}
          <img src={webpUrl} alt={t('compare.webp')} className="block h-auto w-full" draggable={false} />
          {/* original recortada */}
          <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
            {/* el ancho compensa el recorte para que ambas imágenes queden alineadas */}
            <img
              src={originalUrl}
              alt={t('compare.original')}
              className="block h-auto max-w-none"
              style={{ width: `${10000 / pos}%` }}
              draggable={false}
            />
          </div>
          {/* etiquetas */}
          <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-paper">
            {t('compare.original')}
          </span>
          <span
            className="absolute right-3 top-3 rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-white"
            style={{ backgroundColor: accent }}
          >
            WebP −{saving}%
          </span>
          {/* manija */}
          <div className="absolute inset-y-0" style={{ left: `${pos}%` }}>
            <div className="absolute inset-y-0 -left-px w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.5)]" />
            <div className="absolute top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4 text-ink">
                <path d="M8 7l-4 5 4 5M16 7l4 5-4 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
        <p className="mt-3 text-center font-mono text-[11px] text-inkmuted">
          {t('compare.hint')}
        </p>
      </div>
    </Modal>
  )
}
