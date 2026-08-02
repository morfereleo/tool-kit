import { useRef, useState } from 'react'
import BrandShell from '@/components/BrandShell'
import { TOOLS } from '@/lib/tools'
import { EMOJI_GROUPS, TEXT_STYLES, charCount, type TextStyle } from '@/lib/textStyles'
import { IconCheck, IconSpark } from '@/components/icons'

const LIMITS = [
  { id: 'x', label: 'X / Twitter', max: 280 },
  { id: 'ig', label: 'Instagram', max: 2200 },
  { id: 'li', label: 'LinkedIn', max: 3000 },
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

/** Evita que el botón robe el foco del textarea (así se conserva la selección) */
const keepFocus = (e: React.PointerEvent) => e.preventDefault()

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
    const styled = s.apply(text.slice(start, end))
    if (styled === text.slice(start, end) && !whole) return
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
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Editor */}
            <div className="lg:col-span-7">
              <label htmlFor="copy-input" className="field-label">
                Tu copy
              </label>
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
                rows={8}
                placeholder="Escribe o pega aquí el texto de tu publicación…"
                className="field-box resize-y leading-relaxed"
              />

              {/* Barra de estilos */}
              <div className="mt-4">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-inksoft">
                  Estilos — toca para aplicar
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {TEXT_STYLES.map((s) => {
                    const active = lastStyle === s.id
                    return (
                      <button
                        key={s.id}
                        onPointerDown={keepFocus}
                        onClick={() => applyStyle(s)}
                        disabled={!hasText}
                        title={s.hint}
                        className={`rounded-full border px-3.5 py-2 text-[14px] leading-none transition-all ${
                          active
                            ? 'border-transparent text-white'
                            : hasText
                              ? 'border-line bg-white text-ink hover:-translate-y-0.5 hover:border-inkmuted hover:shadow-sm dark:bg-paper'
                              : 'border-line/60 text-inkmuted/60'
                        }`}
                        style={active ? { backgroundColor: tool.accent } : undefined}
                      >
                        {s.apply(s.label)}
                      </button>
                    )
                  })}
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-inkmuted">
                  Selecciona un fragmento del texto y toca un estilo: solo esa parte cambia. Si no
                  seleccionas nada, se aplica a todo el copy.
                </p>
              </div>

              {/* Contadores + acciones */}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {LIMITS.map((l) => (
                  <LimitChip key={l.id} label={l.label} max={l.max} len={len} />
                ))}
                <span className="flex-1" />
                <button
                  onPointerDown={keepFocus}
                  onClick={() => setShowEmoji(!showEmoji)}
                  className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-[13px] font-medium transition-all ${
                    showEmoji
                      ? 'border-transparent text-white'
                      : 'border-line bg-white text-inksoft hover:border-inkmuted dark:bg-paper'
                  }`}
                  style={showEmoji ? { backgroundColor: tool.accent } : undefined}
                >
                  <IconSpark className="h-4 w-4" />
                  Emojis
                </button>
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
                        onPointerDown={keepFocus}
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
                        onPointerDown={keepFocus}
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
            </div>

            {/* Consejos */}
            <aside className="lg:col-span-5">
              <div className="rounded-2xl border border-line bg-white p-6 dark:bg-paper">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-inksoft">
                  Cómo funciona
                </p>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-inksoft">
                  <li className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: tool.accent }} />
                    Selecciona la parte del texto que quieras destacar y toca un estilo: solo ese fragmento cambia, el resto queda igual.
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: tool.accent }} />
                    Combina estilos en un mismo copy: el título en negrita, una frase en cursiva, una palabra tachada o en burbujas.
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
            </aside>
          </div>
        </div>
      </section>
    </BrandShell>
  )
}
