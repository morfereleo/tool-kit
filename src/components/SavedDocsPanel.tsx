import { useState } from 'react'
import { formatDocDate, type SavedDoc } from '@/hooks/useSavedDocuments'

/**
 * Panel de documentos guardados (localStorage). Reutilizable entre herramientas.
 * --facc define el color de acento.
 */
export default function SavedDocsPanel<T>({
  docs,
  currentId,
  onSave,
  onLoad,
  onDuplicate,
  onDelete,
  onNew,
  saveLabel = 'Guardar',
  listLabel = 'Documentos guardados',
  placeholder = 'Ej. Cliente X — rediseño web',
}: {
  docs: SavedDoc<T>[]
  currentId: string | null
  onSave: (name: string) => void
  onLoad: (id: string) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onNew: () => void
  saveLabel?: string
  listLabel?: string
  placeholder?: string
}) {
  const [name, setName] = useState('')
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-2xl border border-line bg-paper/60 p-4">
      {/* guardar estado actual */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && name.trim()) {
              onSave(name)
              setName('')
            }
          }}
          placeholder={placeholder}
          className="field-box flex-1 py-2 text-sm"
          aria-label="Nombre del documento"
        />
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (!name.trim()) return
              onSave(name)
              setName('')
            }}
            disabled={!name.trim()}
            className="flex-1 rounded-full px-4 py-2 text-xs font-semibold text-white transition-opacity disabled:opacity-30 sm:flex-none"
            style={{ backgroundColor: 'var(--facc, #292119)' }}
          >
            {currentId ? 'Guardar cambios' : saveLabel}
          </button>
          <button
            onClick={onNew}
            className="rounded-full border border-line px-4 py-2 text-xs font-semibold text-inksoft transition-colors hover:border-ink hover:text-ink"
            title="Empezar uno nuevo en blanco"
          >
            + Nuevo
          </button>
        </div>
      </div>

      {/* lista */}
      {docs.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setOpen(!open)}
            className="flex w-full items-center justify-between font-mono text-[11px] uppercase tracking-[0.15em] text-inkmuted transition-colors hover:text-ink"
          >
            <span>
              {listLabel} · {docs.length}
            </span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}
            >
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {open && (
            <ul className="mt-2 divide-y divide-line overflow-hidden rounded-xl border border-line">
              {docs.map((d) => (
                <li
                  key={d.id}
                  className={`flex items-center gap-2 px-3 py-2.5 transition-colors ${
                    d.id === currentId
                      ? 'bg-[color-mix(in_srgb,var(--facc,#292119)_8%,transparent)]'
                      : 'hover:bg-[color-mix(in_srgb,var(--facc,#292119)_4%,transparent)]'
                  }`}
                >
                  <button onClick={() => onLoad(d.id)} className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-sm font-medium text-ink">
                      {d.name}
                      {d.id === currentId && (
                        <span
                          className="ml-2 rounded-full px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase text-white"
                          style={{ backgroundColor: 'var(--facc, #292119)' }}
                        >
                          abierto
                        </span>
                      )}
                    </span>
                    <span className="block font-mono text-[10px] text-inkmuted">
                      {formatDocDate(d.updatedAt)}
                    </span>
                  </button>
                  <button
                    onClick={() => onDuplicate(d.id)}
                    className="rounded-full p-1.5 text-inkmuted transition-colors hover:bg-line hover:text-ink"
                    title="Duplicar"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                      <rect x="9" y="9" width="12" height="12" rx="2" />
                      <path d="M5 15V5a2 2 0 012-2h10" strokeLinecap="round" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(d.id)}
                    className="rounded-full p-1.5 text-inkmuted transition-colors hover:bg-line hover:text-red-600"
                    title="Eliminar"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                      <path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-9 0l1 13h8l1-13" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
