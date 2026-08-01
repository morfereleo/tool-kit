import { useRef, useState } from 'react'
import BrandShell from '@/components/BrandShell'
import { TOOLS } from '@/lib/tools'
import { EMOJI_GROUPS, TEXT_STYLES, charCount } from '@/lib/textStyles'
import { IconCheck, IconSpark } from '@/components/icons'

const SAMPLE = 'Así se verá tu texto 123'

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
      style={color ? { color, borderColor: `${color}55` } : undefined}
    >
      <span className="text-inkmuted">{label}</span>
      <span style={color ? { color } : undefined} className={color ? '' : 'text-inksoft'}>
        {len}/{max}
      </span>
    </span>
  )
}

export default function TextoPage() {
  const tool = TOOLS.find((t) => t.id === 'texto')!
  const [text, setText] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [emojiTab, setEmojiTab] = useState(EMOJI_GROUPS[0].id)
  const [copied, setCopied] = useState<string | null>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const len = charCount(text)
  const hasText = text.trim().length > 0

  const insertEmoji = (emoji: string) => {
    const el = taRef.current
    const start = el?.selectionStart ?? text.length
    const end = el?.selectionEnd ?? text.length
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

  const copy = async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = value
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    if (copyTimer.current) clearTimeout(copyTimer.current)
    setCopied(id)
    copyTimer.current = setTimeout(() => setCopied(null), 1600)
  }

  const activeGroup = EMOJI_GROUPS.find((g) => g.id === emojiTab)!

  return (
    <BrandShell tool={tool}>
      {/* ——— Editor ——— */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Texto */}
            <div className="lg:col-span-7">
              <label htmlFor="copy-input" className="field-label">
                Tu copy
              </label>
              <textarea
                id="copy-input"
                ref={taRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={7}
                placeholder="Escribe o pega aquí el texto de tu publicación…"
                className="field-box resize-y leading-relaxed"
              />

              {/* Contadores + acciones */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {LIMITS.map((l) => (
                  <LimitChip key={l.id} label={l.label} max={l.max} len={len} />
                ))}
                <span className="flex-1" />
                <button
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
                  <button
                    onClick={() => setText('')}
                    className="rounded-full border border-line bg-white px-4 py-1.5 text-[13px] font-medium text-inksoft transition-colors hover:border-inkmuted hover:text-ink dark:bg-paper"
                  >
                    Limpiar
                  </button>
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
                    Escribe tu copy, elige un estilo de la galería y tócalo para copiarlo.
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: tool.accent }} />
                    Pégalo directo en Instagram, X, TikTok, LinkedIn o WhatsApp — la negrita y la cursiva se ven sin necesidad de apps externas.
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: tool.accent }} />
                    Son caracteres Unicode reales: funcionan en biografías, títulos y comentarios donde el formato normal no está disponible.
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

      {/* ——— Galería de estilos ——— */}
      <section>
        <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-inkmuted">
            Estilos disponibles — toca para copiar
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TEXT_STYLES.map((s, i) => {
              const preview = hasText ? s.apply(text) : s.apply(SAMPLE)
              const isCopied = copied === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => hasText && copy(s.id, s.apply(text))}
                  disabled={!hasText}
                  className={`group relative overflow-hidden rounded-2xl border bg-white p-5 text-left transition-all dark:bg-paper ${
                    hasText
                      ? 'border-line hover:-translate-y-0.5 hover:shadow-md'
                      : 'border-line/60 opacity-70'
                  }`}
                  style={{
                    animation: 'menu-item-in 0.4s ease-out both',
                    animationDelay: `${i * 30}ms`,
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-inksoft">
                      {s.label}
                    </span>
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all ${
                        isCopied ? 'scale-110' : 'opacity-0 group-hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor: isCopied ? tool.accent : `${tool.accent}1A`,
                        color: isCopied ? '#fff' : tool.accent,
                      }}
                    >
                      {isCopied ? (
                        <IconCheck className="h-3.5 w-3.5" />
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                          <rect x="9" y="9" width="12" height="12" rx="2" />
                          <path d="M5 15V5a2 2 0 012-2h10" strokeLinecap="round" />
                        </svg>
                      )}
                    </span>
                  </div>
                  <p className={`mt-3 break-words text-lg leading-snug ${hasText ? 'text-ink' : 'text-inkmuted/70'}`}>
                    {preview}
                  </p>
                  <p className="mt-3 text-[12px] text-inkmuted">{isCopied ? '¡Copiado!' : s.hint}</p>
                </button>
              )
            })}
          </div>

          {!hasText && (
            <p className="mt-6 text-center text-sm text-inkmuted">
              Escribe tu copy arriba y luego toca cualquier estilo para copiarlo ✨
            </p>
          )}
        </div>
      </section>
    </BrandShell>
  )
}
