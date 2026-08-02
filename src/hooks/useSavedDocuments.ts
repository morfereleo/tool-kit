import { useCallback, useEffect, useState } from 'react'

export type SavedDoc<T> = {
  id: string
  name: string
  updatedAt: number
  payload: T
}

/**
 * Persistencia local por herramienta: guarda documentos nombrados
 * (cotizaciones, acuerdos, etc.) en localStorage. Nada sale del navegador.
 */
export function useSavedDocuments<T>(storageKey: string) {
  const [docs, setDocs] = useState<SavedDoc<T>[]>(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      return raw ? (JSON.parse(raw) as SavedDoc<T>[]) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(docs))
    } catch {
      /* almacenamiento lleno o bloqueado: se ignora */
    }
  }, [docs, storageKey])

  const save = useCallback((name: string, payload: T, id?: string) => {
    const doc: SavedDoc<T> = {
      id: id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim() || 'Sin nombre',
      updatedAt: Date.now(),
      payload,
    }
    setDocs((prev) => {
      const idx = prev.findIndex((d) => d.id === doc.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = doc
        return next
      }
      return [doc, ...prev]
    })
    return doc.id
  }, [])

  const remove = useCallback((id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const duplicate = useCallback((id: string) => {
    let newId: string | null = null
    setDocs((prev) => {
      const src = prev.find((d) => d.id === id)
      if (!src) return prev
      newId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      const copy: SavedDoc<T> = {
        ...src,
        id: newId,
        name: `${src.name} (copia)`,
        updatedAt: Date.now(),
        payload: JSON.parse(JSON.stringify(src.payload)),
      }
      return [copy, ...prev]
    })
    return newId
  }, [])

  return { docs, save, remove, duplicate }
}

export function formatDocDate(ts: number, locale = 'es-VE'): string {
  return new Date(ts).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
