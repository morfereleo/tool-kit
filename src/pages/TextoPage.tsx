import { useRef, useState } from 'react'
import BrandShell from '@/components/BrandShell'
import { TOOLS } from '@/lib/tools'
import { EMOJI_GROUPS, TEXT_STYLES, charCount, unstyle, type TextStyle } from '@/lib/textStyles'
import { IconCheck, IconSpark } from '@/components/icons'

const LIMITS = [
  { id: 'x', label: 'X / Twitter', max: 280 },
  { id: 'ig', label: 'Instagram', max: 2200 },
  { id: 'li', label: 'LinkedIn', max: 3000 },
]

const GENERATIONS = [
  {
    name: 'Baby Boomers',
    years: '1946–1964',
    tip: 'Buscan claridad y confianza: frases completas, buena ortografía y beneficios concretos. Evita la jerga, los memes y el exceso de emojis.',
  },
  {
    name: 'Generación X',
    years: '1965–1980',
    tip: 'Prácticos y escépticos: sé directo, honesto y sin exageraciones. Funcionan los datos, las comparaciones y el humor sutil.',
  },
  {
    name: 'Millennials',
    years: '1981–1996',
    tip: 'Conectan con la autenticidad y el propósito: cuenta historias, muestra el por qué de tu marca y usa un tono cercano pero profesional.',
  },
  {
    name: 'Generación Z · Centennials',
    years: '1997–2012',
    tip: 'Ultra-directos y visuales: frases cortas, humor, emojis y lenguaje inclusivo. Huyen de todo lo que suena a publicidad tradicional.',
  },
  {
    name: 'Generación Alpha',
    years: '2013 en adelante',
    tip: 'Nativos digitales: contenido breve, visual e interactivo. Ten en cuenta que la compra suele decidirla un adulto de la casa.',
  },
]

function LimitChip({ label, max, len }: { label: string; max: number; len: number }) {
  const pct = len / max
  const state = pct > 1 ? 'over' : pct >= 0.9 ? 'warn' : 'ok'
  const color =
    state === 'over' ? '#DC2626' : state === 'warn' ? '#D97706' : undefined
  return (
    <span
      className="flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 font-mono text-[11px] font-medium dark:bg-paper"
      style={color ? { color, borderColor: `${color}55` } : { color: 'var(--tw-text-opacity,inherit)' }}
    >
      <span className="text-inkmuted">{label}</span>
      <span style={color ? { color } : undefined} className={color ? '' : 'text-inksoft'}>
        {len}/{max}
      </span>
    </span>
  )
}

/**
 * Evita que el botón robe el foco del textarea (así se conserva la selección).
 * Solo se aplica al ratón: en táctil no se previene para no bloquear el scroll.
 */
const keepFocus = (e: React.MouseEvent) => e.preventDefault()

export default function TextoPage() {
  const tool = TOOLS.find((t) => t.id === 'texto')!
  const [text, setText] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [emojiTab, setEmojiTab] = useState(EMOJI_GROUPS[0].id)
  const [copied, setCopied] = useState(false)
  const [lastStyle, setLastStyle] = useState<string | null>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const selRef = useRef({ start: 0, end: 0 })
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const styleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const len = charCount(text)
  const hasText = text.trim().length > 0

  const syncSelection = () => {
    const el = taRef.current
    if (el) selRef.current = { start: el.selectionStart, end: el.selectionEnd }
  }

  /** Aplica el estilo SOLO al texto seleccionado (o a todo si no hay selección) */
  const applyStyle = (s: TextStyle) => {
    if (!hasText) return
    const el = taRef.current
    let start = el?.selectionStart ?? selRef.current.start
    let end = el?.selectionEnd ?? selRef.current.end
    if (start > text.length || end > text.length) {
      start = 0
      end = text.length
    }
    const whole = start === end
    if (whole) {
      start = 0
      end = text.length
    }
    const slice = text.slice(start, end)
    // unstyle() revierte cualquier estilo previo para que el nuevo se aplique limpio
    const styled = s.apply(unstyle(slice))
    if (styled === slice && !whole) return
    const next = text.slice(0, start) + styled + text.slice(end)
    setText(next)
    requestAnimationFrame(() => {
      if (el) {
        el.focus()
        if (whole) {
          el.setSelectionRange(next.length, next.length)
        } else {
          el.setSelectionRange(start, start + styled.length)
        }
      }
    })
    if (styleTimer.current) clearTimeout(styleTimer.current)
    setLastStyle(s.id)
    styleTimer.current = setTimeout(() => setLastStyle(null), 1200)
  }

  const insertEmoji = (emoji: string) => {
    const el = taRef.current
    const start = el?.selectionStart ?? selRef.current.start ?? text.length
    const end = el?.selectionEnd ?? selRef.current.end ?? text.length
    const next = text.slice(0, start) + emoji + text.slice(end)
    const caret = start + emoji.length
    setText(next)
    requestAnimationFrame(() => {
      if (el) {
        el.focus()
        el.setSelectionRange(caret, caret)
      }
    })
  }

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    if (copyTimer.current) clearTimeout(copyTimer.current)
    setCopied(true)
    copyTimer.current = setTimeout(() => setCopied(false), 1600)
  }

  const activeGroup = EMOJI_GROUPS.find((g) => g.id === emojiTab)!

  return (
    <BrandShell tool={tool}>
      <section>
        <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Editor */}
            <div className="min-w-0 lg:col-span-7">
              <label htmlFor="copy-input" className="field-label">
                Tu copy
              </label>

              {/* Barra de herramientas */}
              <div className="no-scrollbar flex touch-pan-x items-center gap-1 overflow-x-auto rounded-2xl border border-line bg-white p-2 shadow-sm dark:bg-paper">
                {TEXT_STYLES.map((s) => {
                  const active = lastStyle === s.id
                  return (
                    <button
                      key={s.id}
                      onMouseDown={keepFocus}
                      onClick={() => applyStyle(s)}
                      disabled={!hasText}
                      title={s.hint}
                      className={`shrink-0 whitespace-nowrap rounded-xl px-3 py-2 text-[13px] leading-none transition-all ${
                        active
                          ? 'text-white'
                          : hasText
                            ? 'text-ink hover:bg-paper dark:hover:bg-white/5'
                            : 'text-inkmuted/50'
                      }`}
                      style={active ? { backgroundColor: tool.accent } : undefined}
                    >
                      {s.apply(s.label)}
                    </button>
                  )
                })}
                <span aria-hidden className="mx-1 h-6 w-px shrink-0 bg-line" />
                <button
                  onMouseDown={keepFocus}
                  onClick={() => setShowEmoji(!showEmoji)}
                  className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-[13px] font-medium leading-none transition-all ${
                    showEmoji
                      ? 'text-white'
                      : 'text-inksoft hover:bg-paper dark:hover:bg-white/5'
                  }`}
                  style={showEmoji ? { backgroundColor: tool.accent } : undefined}
                >
                  <IconSpark className="h-4 w-4" />
                  Emojis
                </button>
              </div>

              <textarea
                id="copy-input"
                ref={taRef}
                value={text}
                onChange={(e) => {
                  setText(e.target.value)
                  syncSelection()
                }}
                onSelect={syncSelection}
                onKeyUp={syncSelection}
                onMouseUp={syncSelection}
                rows={9}
                placeholder="Escribe o pega aquí el texto de tu publicación…"
                className="field-box mt-2.5 resize-y leading-relaxed"
              />
              <p className="mt-2 text-[12px] leading-relaxed text-inkmuted">
                Selecciona un fragmento y toca un estilo de la barra: solo esa parte cambia. Para
                cambiarlo, vuelve a seleccionarlo y toca el nuevo estilo.
              </p>

              {/* Panel de emojis */}
              {showEmoji && (
                <div
                  className="mt-4 rounded-2xl border border-line bg-white p-4 shadow-sm dark:bg-paper"
                  style={{ animation: 'menu-item-in 0.3s ease-out both' }}
                >
                  <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-3">
                    {EMOJI_GROUPS.map((g) => (
                      <button
                        key={g.id}
                        onMouseDown={keepFocus}
                        onClick={() => setEmojiTab(g.id)}
                        className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-all ${
                          emojiTab === g.id
                            ? 'text-white'
                            : 'bg-paper text-inksoft hover:text-ink'
                        }`}
                        style={emojiTab === g.id ? { backgroundColor: tool.accent } : undefined}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid max-h-56 grid-cols-8 gap-1 overflow-y-auto pr-1">
                    {activeGroup.items.map((e) => (
                      <button
                        key={e}
                        onMouseDown={keepFocus}
                        onClick={() => insertEmoji(e)}
                        className="flex h-10 items-center justify-center rounded-lg text-[22px] transition-transform hover:scale-125 hover:bg-paper active:scale-110"
                        aria-label={`Insertar ${e}`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.15em] text-inkmuted">
                    Toca un emoji para insertarlo en el cursor
                  </p>
                </div>
              )}

              {/* Contadores + acciones */}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {LIMITS.map((l) => (
                  <LimitChip key={l.id} label={l.label} max={l.max} len={len} />
                ))}
                <span className="flex-1" />
                {hasText && (
                  <>
                    <button
                      onClick={copyAll}
                      className="flex items-center gap-2 rounded-full border border-transparent px-4 py-1.5 text-[13px] font-medium text-white transition-all"
                      style={{ backgroundColor: tool.accent }}
                    >
                      {copied ? (
                        <>
                          <IconCheck className="h-4 w-4" /> ¡Copiado!
                        </>
                      ) : (
                        'Copiar texto'
                      )}
                    </button>
                    <button
                      onClick={() => setText('')}
                      className="rounded-full border border-line bg-white px-4 py-1.5 text-[13px] font-medium text-inksoft transition-colors hover:border-inkmuted hover:text-ink dark:bg-paper"
                    >
                      Limpiar
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Consejos */}
            <aside className="min-w-0 lg:col-span-5">
              <div className="rounded-2xl border border-line bg-white p-6 dark:bg-paper">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-inksoft">
                  Cómo funciona
                </p>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-inksoft">
                  <li className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: tool.accent }} />
                    Usa la barra de herramientas: selecciona un fragmento del texto y toca un estilo — solo esa parte cambia, el resto queda igual.
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: tool.accent }} />
                    ¿Quieres otro estilo en el mismo fragmento? Vuelve a seleccionarlo y toca el nuevo: se reemplaza sin problema. Combina varios estilos en un mismo copy.
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: tool.accent }} />
                    Cuando esté listo, toca «Copiar texto» y pégalo en Instagram, X, TikTok, LinkedIn o WhatsApp — el formato se conserva.
                  </li>
                </ul>
                <div
                  className="mt-5 rounded-xl p-4 text-[13px] leading-relaxed"
                  style={{ backgroundColor: `${tool.accent}0F`, color: 'inherit' }}
                >
                  <span className="font-medium">Tip de accesibilidad:</span>{' '}
                  <span className="text-inksoft">
                    úsalos con moderación — los lectores de pantalla no siempre interpretan bien estos caracteres. Ideal para titulares y frases cortas.
                  </span>
                </div>
              </div>

              {/* Guía por generación */}
              <div className="mt-4 rounded-2xl border border-line bg-white p-6 dark:bg-paper">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-inksoft">
                  Escribe para cada generación
                </p>
                <p className="mt-3 text-[13px] leading-relaxed text-inksoft">
                  El mismo mensaje no funciona igual para todos. Ajusta el lenguaje de tu copy
                  según la generación a la que le hablas:
                </p>
                <ul className="mt-4 space-y-4">
                  {GENERATIONS.map((g) => (
                    <li key={g.name}>
                      <p className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-sm font-semibold text-ink">{g.name}</span>
                        <span className="font-mono text-[11px] text-inkmuted">{g.years}</span>
                      </p>
                      <p className="mt-1 text-[13px] leading-relaxed text-inksoft">{g.tip}</p>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 border-t border-line pt-3 text-[12px] leading-relaxed text-inkmuted">
                  Combínalo con los estilos y emojis de la barra: manuscrita o burbujas para
                  audiencias jóvenes, serif para un tono más formal.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </BrandShell>
  )
}
