import { useCallback, useEffect, useRef, useState } from 'react'
import { fmtBytes } from '@/lib/format'

/**
 * Comparador antes/después con slider arrastrable (mouse + touch).
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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setPos((p) => Math.max(2, p - 4))
      if (e.key === 'ArrowRight') setPos((p) => Math.min(98, p + 4))
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('keydown', onKey)
    }
  }, [move, onClose])

  const saving = Math.round((1 - webpSize / originalSize) * 100)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-paper shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div className="min-w-0">
            <h3 className="truncate font-grotesk text-lg font-bold">{name}</h3>
            <p className="font-mono text-xs text-inkmuted">
              {fmtBytes(originalSize)} → <span className="font-semibold" style={{ color: accent }}>{fmtBytes(webpSize)}</span>
              {' '}· −{saving}%
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-inkmuted transition-colors hover:bg-line hover:text-ink"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          <div
            ref={trackRef}
            className="relative w-full cursor-ew-resize select-none overflow-hidden rounded-xl border border-line"
            style={{ touchAction: 'none' }}
            onPointerDown={(e) => {
              draggingRef.current = true
              move(e.clientX)
            }}
          >
            {/* optimizada (fondo completo) */}
            <img src={webpUrl} alt="Optimizada WebP" className="block h-auto w-full" draggable={false} />
            {/* original recortada */}
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
              <img
                src={originalUrl}
                alt="Original"
                className="block h-auto max-w-none"
                style={{ width: trackRef.current?.clientWidth ?? '100%' }}
                draggable={false}
              />
            </div>
            {/* etiquetas */}
            <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-paper">
              Original
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
            Arrastra el divisor (o usa ← →) para comparar la original con la optimizada
          </p>
        </div>
      </div>
    </div>
  )
}
