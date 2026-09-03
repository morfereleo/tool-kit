import { useEffect, useId, useRef, type ReactNode } from 'react'
import { useT } from '@/lib/i18n'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

/**
 * Shell accesible compartido por todos los modales:
 * role="dialog" + aria-modal, foco inicial y trampa de Tab, cierre con
 * Escape o clic en el fondo, bloqueo del scroll del body y devolución
 * del foco al elemento que abrió el modal.
 */
export default function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
  maxWidth = 'max-w-xl',
}: {
  title: ReactNode
  subtitle?: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  maxWidth?: string
}) {
  const t = useT()
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    closeRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || !panel.contains(active))) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      opener?.focus?.()
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      {/* el fondo es un atajo de puntero; Escape y ✕ cubren el teclado */}
      <div
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
        onClick={onClose}
        role="presentation"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative flex max-h-[92vh] w-full ${maxWidth} flex-col overflow-hidden rounded-3xl bg-paper shadow-2xl`}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="truncate font-grotesk text-lg font-bold tracking-tight">
              {title}
            </h2>
            {subtitle && <div className="text-xs text-inkmuted">{subtitle}</div>}
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            className="ml-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-inkmuted transition-colors hover:bg-line hover:text-ink"
            aria-label={t('ui.close')}
          >
            ✕
          </button>
        </div>
        {children}
        {footer && <div className="border-t border-line p-4">{footer}</div>}
      </div>
    </div>
  )
}
