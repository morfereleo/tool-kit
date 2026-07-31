export const fmt = (n: number, decimals = 2): string => {
  if (!isFinite(n)) return '—'
  return new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n)
}

export const fmtMoney = (n: number, symbol: string, decimals = 2): string =>
  `${symbol} ${fmt(n, decimals)}`

export const fmtBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export const parseNum = (v: string): number => {
  const n = parseFloat(v.replace(/\./g, '').replace(',', '.'))
  return isNaN(n) ? 0 : n
}
