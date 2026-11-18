import { describe, expect, it } from 'vitest'
import { tasasSeo } from './tasasSeo'

// 15:00 UTC = 11:00 en Caracas, mismo día en ambas zonas
const DATE = '2026-11-18T15:00:00.000Z'

describe('tasasSeo', () => {
  it('incluye dólar y euro con formato es-VE', () => {
    const { title, desc } = tasasSeo({ usd: 804.81, eur: 932.81, date: DATE, lang: 'es' })
    expect(title).toContain('Bs 804,81')
    expect(title).toContain('Euro Bs 932,81')
    expect(title).toMatch(/^Dólar BCV hoy 18 nov: /)
    expect(desc).toContain('dólar Bs 804,81, euro Bs 932,81')
  })

  it('formatea en inglés con punto decimal', () => {
    const { title } = tasasSeo({ usd: 1234.5, eur: null, date: DATE, lang: 'en' })
    expect(title).toContain('Bs 1,234.50')
    expect(title).toMatch(/^BCV dollar today Nov 18: /)
    expect(title).not.toContain('Euro')
  })

  it('usa la fecha de Caracas, no la UTC', () => {
    // 02:00 UTC del 19 = 22:00 del 18 en Caracas
    const { title } = tasasSeo({ usd: 800, eur: null, date: '2026-11-19T02:00:00.000Z', lang: 'es' })
    expect(title).toMatch(/hoy 18/)
  })
})
