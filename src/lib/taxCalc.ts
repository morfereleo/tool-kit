export type TaxMode = 'add' | 'extract'

export type TaxResult = {
  subtotal: number
  tax: number
  total: number
}

/**
 * Parsea un monto escrito con coma decimal ("100,50" → 100.5).
 * Acepta también punto decimal por si el valor no pasó por sanitizeAmount.
 */
export const parseAmount = (raw: string): number => {
  const s = raw.includes(',')
    ? raw.replace(/\./g, '').replace(',', '.')
    : raw
  const n = parseFloat(s)
  return isNaN(n) ? 0 : n
}

/**
 * Normaliza la entrada de un monto: solo dígitos y una coma decimal,
 * con máximo dos decimales. El punto se convierte en coma.
 */
export const sanitizeAmount = (v: string): string => {
  const s = v.replace(/[^0-9.,]/g, '').replace(/\./g, ',')
  const first = s.indexOf(',')
  if (first !== -1) {
    const int = s.slice(0, first)
    const dec = s.slice(first + 1).replace(/,/g, '')
    return `${int},${dec.slice(0, 2)}`
  }
  return s
}

/** Agrega o extrae el impuesto sobre un monto base. */
export const calcTax = (base: number, ratePct: number, mode: TaxMode): TaxResult => {
  const r = ratePct / 100
  if (mode === 'add') {
    const tax = base * r
    return { subtotal: base, tax, total: base + tax }
  }
  const subtotal = r === 0 ? base : base / (1 + r)
  return { subtotal, tax: base - subtotal, total: base }
}

/** IGTF venezolano: 3% sobre el total de la factura cuando se paga en divisas. */
export const IGTF_RATE = 0.03

export const calcIgtf = (total: number): number => total * IGTF_RATE
