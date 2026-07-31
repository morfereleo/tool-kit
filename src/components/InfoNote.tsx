import { useState } from 'react'
import type { TaxNote } from '@/lib/taxNotes'

export default function InfoNote({
  note,
  mode,
  highlight,
  onDismiss,
  accent,
}: {
  note: TaxNote
  mode: 'add' | 'extract'
  highlight: boolean
  onDismiss: () => void
  accent: string
}) {
  const [open, setOpen] = useState(false)
  const expanded = highlight || open
  const bullets = mode === 'add' ? note.add : note.extract

  return (
    <div
      className={`rounded-2xl border transition-colors ${
        highlight ? 'border-transparent' : 'border-line'
      }`}
      style={highlight ? { backgroundColor: `${accent}10`, borderColor: `${accent}40` } : undefined}
    >
      <button
        onClick={() => {
          if (highlight) onDismiss()
          else setOpen(!open)
        }}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            highlight ? 'animate-pulse' : ''
          }`}
          style={{ backgroundColor: `${accent}1A`, color: accent }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5" strokeLinecap="round" />
            <circle cx="12" cy="8" r="0.5" fill="currentColor" />
          </svg>
        </span>
        <span className="flex-1">
          <span className="block text-sm font-semibold">{note.title}</span>
          <span className="block text-xs text-inksoft">
            {expanded
              ? highlight
                ? 'Lee esto la primera vez — toca para minimizar'
                : 'Toca para minimizar'
              : `¿Por qué ${mode === 'add' ? 'se agrega' : 'se extrae'} este impuesto? Toca para saber`}
          </span>
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`h-4 w-4 shrink-0 text-inkmuted transition-transform ${expanded ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t px-5 pb-5 pt-4" style={{ borderColor: `${accent}25` }}>
          <ul className="space-y-3">
            {bullets.map((b, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-inksoft">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
                {b}
              </li>
            ))}
          </ul>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-inkmuted">
            Fuente: {note.source}
          </p>
        </div>
      )}
    </div>
  )
}
