import type { ReactNode } from 'react'
import { toolText, type Tool } from '@/lib/tools'
import { useLang, useT } from '@/lib/i18n'
import { useTheme } from '@/hooks/useTheme'

/**
 * BrandShell — envuelve cada herramienta con su identidad de color:
 * hero tintado con degradado del acento, barra lateral en escritorio,
 * secciones suavemente teñidas y la variable --facc lista para los campos.
 */
export default function BrandShell({
  tool,
  soft,
  children,
}: {
  tool: Tool
  soft?: string
  children: ReactNode
}) {
  const { theme } = useTheme()
  const { lang } = useLang()
  const t = useT()
  const tt = toolText(tool, lang)
  const isDark = theme === 'dark'
  const strong = tool.accentInk === '#FFFFFF'
  const softInk = soft ?? tool.accent

  return (
    <main
      className="pt-14"
      style={{ '--facc': tool.accent, '--acc-soft': softInk } as React.CSSProperties}
    >
      {/* Hero brandeado: degradado acento → fondo, con marca de agua del número */}
      <div
        className="relative overflow-hidden border-b border-line"
        style={{
          backgroundImage: `linear-gradient(180deg, color-mix(in srgb, var(--facc) ${isDark ? (strong ? '14%' : '24%') : strong ? '9%' : '18%'}, transparent), transparent)`,
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -top-16 right-0 select-none font-grotesk text-[12rem] font-bold leading-none tracking-tighter md:-top-24 md:text-[26rem]"
          style={{ color: `color-mix(in srgb, var(--facc) ${isDark ? '12%' : '7%'}, transparent)` }}
        >
          {tool.num}
        </span>
        <div className="relative mx-auto max-w-6xl px-5 pb-12 pt-10 md:px-8 md:pt-16">
          <a
            href="#/"
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-inkmuted transition-colors hover:text-ink"
          >
            {t('shell.back')}
          </a>
          <div className="mt-8 flex items-start gap-5 md:gap-7">
            <span
              className="mt-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-mono text-sm font-semibold shadow-lg md:h-16 md:w-16 md:text-base"
              style={{
                backgroundColor: tool.accent,
                color: tool.accentInk,
                boxShadow: `0 12px 32px color-mix(in srgb, var(--facc) 35%, transparent)`,
              }}
            >
              {tool.num}
            </span>
            <div>
              <h1 className="font-grotesk text-4xl font-bold tracking-tighter md:text-6xl">
                {tt.name}
              </h1>
              <p className="mt-2 max-w-xl text-balance text-base text-inksoft md:text-lg">
                {tt.tagline}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cuerpo con barra lateral de acento en escritorio */}
      <div className="relative">
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 hidden w-1 lg:block"
          style={{
            backgroundImage: `linear-gradient(180deg, var(--facc), transparent 70%)`,
            opacity: 0.85,
          }}
        />
        {children}
      </div>
    </main>
  )
}

export function TintedSection({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`border-b border-line ${className}`}
      style={{ backgroundColor: 'color-mix(in srgb, var(--facc) 4%, transparent)' }}
    >
      {children}
    </section>
  )
}
