import { useEffect, useState, type ComponentType } from 'react'
import { createPortal } from 'react-dom'
import { BRAND, TOOLS } from '@/lib/tools'
import { useTheme } from '@/hooks/useTheme'
import { IconDoc, IconImage, IconQr, IconReceipt, IconTag, IconTrend } from '@/components/icons'

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1 rounded-full border border-line bg-paper p-1 transition-colors hover:border-inkmuted"
      aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={dark ? 'Modo claro' : 'Modo oscuro'}
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
          dark ? 'text-inkmuted' : 'bg-ink text-paper'
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" strokeLinecap="round" />
        </svg>
      </span>
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
          dark ? 'bg-ink text-paper' : 'text-inkmuted'
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <path d="M20 13.5A8.5 8.5 0 0110.5 4 8.5 8.5 0 1020 13.5z" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  )
}

function ArrowUpRight({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M7 17L17 7M7 7h10v10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export { ArrowUpRight }

/** Marca personal de alejandrodanieles.com — variante clara/oscura según el tema */
export function BrandMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <>
      <img src="/logo-mark-light.svg" alt="Alejandro Danieles" className={`${className} dark:hidden`} />
      <img src="/logo-mark-dark.svg" alt="" aria-hidden className={`${className} hidden dark:block`} />
    </>
  )
}

const MENU_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  iva: IconReceipt,
  tasas: IconTrend,
  imagenes: IconImage,
  qr: IconQr,
  servicios: IconTag,
  acuerdo: IconDoc,
}

export function Header({ current }: { current: string }) {
  const [open, setOpen] = useState(false)

  // Bloquea el scroll de la página y permite cerrar con Escape mientras el menú está abierto
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-paper/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 md:px-8">
        <a href="#/" className="group flex items-center gap-2.5">
          <BrandMark className="h-8 w-8 transition-transform group-hover:scale-105" />
          <span className="font-grotesk text-lg font-bold tracking-tight">Tool Kit</span>
        </a>

        <nav className="hidden items-center gap-6 md:flex">
          {TOOLS.map((t) => (
            <a
              key={t.id}
              href={t.path}
              className={`group flex items-center gap-1.5 text-[13px] font-medium transition-colors ${
                current === t.path ? 'text-ink' : 'text-inksoft hover:text-ink'
              }`}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full transition-transform group-hover:scale-150"
                style={{ backgroundColor: t.accent }}
              />
              {t.shortName}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => setOpen(!open)}
            className="flex h-9 w-9 items-center justify-center md:hidden"
            aria-label="Menú"
          >
          <div className="space-y-1.5">
            <span className={`block h-0.5 w-5 bg-ink transition-transform ${open ? 'translate-y-2 rotate-45' : ''}`} />
            <span className={`block h-0.5 w-5 bg-ink transition-opacity ${open ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-5 bg-ink transition-transform ${open ? '-translate-y-2 -rotate-45' : ''}`} />
          </div>
          </button>
        </div>
      </div>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[999] flex flex-col overflow-hidden md:hidden"
            style={{
              animation: 'menu-fade 0.25s ease-out both',
              background: 'radial-gradient(130% 100% at 100% 0%, #2b2317 0%, #16120c 60%)',
            }}
          >
            {/* Marca de agua del iso */}
            <img
              src="/logo-mark-dark.svg"
              alt=""
              aria-hidden
              className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 select-none opacity-[0.07]"
            />

            {/* Barra superior del menú */}
            <div
              className="relative flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-5"
              style={{ animation: 'menu-item-in 0.35s ease-out both' }}
            >
              <span className="flex items-center gap-2.5">
                <img src="/logo-mark-dark.svg" alt="" className="h-8 w-8" />
                <span className="font-grotesk text-lg font-bold tracking-tight text-[#F3EBDC]">Tool Kit</span>
              </span>
              <button
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center text-[#F3EBDC]"
                aria-label="Cerrar menú"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Herramientas con entrada escalonada */}
            <nav className="relative flex-1 overflow-y-auto">
              {TOOLS.map((t, i) => {
                const ItemIcon = MENU_ICONS[t.id]
                const active = current === t.path
                return (
                  <a
                    key={t.id}
                    href={t.path}
                    onClick={() => setOpen(false)}
                    className="group flex items-center gap-4 border-b border-white/10 px-5 py-5"
                    style={{
                      animation: 'menu-item-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
                      animationDelay: `${100 + i * 70}ms`,
                    }}
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: `${t.accent}24`,
                        border: `1px solid ${t.accent}59`,
                        color: t.accent,
                      }}
                    >
                      {ItemIcon && <ItemIcon className="h-5 w-5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-medium" style={{ color: t.accent }}>
                          /{t.num}
                        </span>
                        <span
                          className={`font-grotesk text-xl font-bold tracking-tight ${
                            active ? 'text-[#F3EBDC]' : 'text-[#F3EBDC]/85'
                          }`}
                        >
                          {t.name}
                        </span>
                        {active && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: t.accent }} />
                        )}
                      </span>
                      <span className="mt-0.5 block truncate text-[13px] text-[#F3EBDC]/45">{t.tagline}</span>
                    </span>
                    <span className="shrink-0 text-[#F3EBDC]/30 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#F3EBDC]/70">
                      <ArrowUpRight className="h-5 w-5" />
                    </span>
                  </a>
                )
              })}
            </nav>

            {/* Firma */}
            <div
              className="relative shrink-0 px-5 py-6"
              style={{ animation: 'menu-item-in 0.5s ease-out both', animationDelay: `${100 + TOOLS.length * 70}ms` }}
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#F3EBDC]/40">
                Diseñado por {BRAND.author} — 2026
              </p>
            </div>
          </div>,
          document.body
        )}
    </header>
  )
}

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line">
      {/* Marca de agua: el iso a gran escala — arriba a la derecha en mobile, abajo en desktop */}
      <img
        src="/logo-mark-light.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-12 h-52 w-52 select-none opacity-[0.05] dark:hidden md:-bottom-24 md:-right-16 md:top-auto md:h-[26rem] md:w-[26rem]"
      />
      <img
        src="/logo-mark-dark.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-12 hidden h-52 w-52 select-none opacity-[0.07] dark:block md:-bottom-24 md:-right-16 md:top-auto md:h-[26rem] md:w-[26rem]"
      />

      {/* Fila superior: iso + nombre, y firma */}
      <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-5 pt-12 md:flex-row md:items-center md:justify-between md:px-8">
        <a href="#/" className="group flex items-center gap-4">
          <BrandMark className="h-12 w-12 transition-transform duration-300 group-hover:rotate-[8deg]" />
          <span className="font-grotesk text-3xl font-bold tracking-tighter">Tool Kit</span>
        </a>
        <div className="text-sm text-inksoft md:text-right">
          <p>
            Diseñado por{' '}
            <a
              href={BRAND.url}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-ink"
            >
              {BRAND.author}
            </a>
          </p>
          <p className="mt-1 font-mono text-xs text-inkmuted">Portfolio — 2026 · Venezuela</p>
        </div>
      </div>

      {/* Wordmark gigante: completo y con aire en mobile, cortado por el borde inferior en desktop */}
      <div className="relative mx-auto max-w-6xl px-5 md:px-8" aria-hidden>
        <p className="translate-y-0 select-none pb-10 font-grotesk text-[18vw] font-bold leading-none tracking-tighter text-ink/[0.06] md:translate-y-[22%] md:pb-0 md:text-[13rem]">
          Tool Kit
        </p>
      </div>

      {/* Línea final */}
      <div className="relative border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-5 font-mono text-[11px] uppercase tracking-[0.18em] text-inkmuted md:flex-row md:items-center md:justify-between md:px-8">
          <span>© 2026 · {BRAND.author}</span>
          <span>Herramientas gratuitas — sin registro, sin letra pequeña</span>
        </div>
      </div>
    </footer>
  )
}
