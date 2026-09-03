import { describe, expect, it } from 'vitest'
import { calcIgtf, calcTax, parseAmount, sanitizeAmount } from './taxCalc'

describe('parseAmount', () => {
  it('parsea coma decimal (el bug de 100,50)', () => {
    expect(parseAmount('100,50')).toBe(100.5)
    expect(parseAmount('0,05')).toBe(0.05)
  })

  it('parsea punto decimal cuando no hay coma', () => {
    expect(parseAmount('12.5')).toBe(12.5)
    expect(parseAmount('100')).toBe(100)
  })

  it('trata el punto como separador de miles cuando hay coma', () => {
    expect(parseAmount('1.234,56')).toBe(1234.56)
  })

  it('devuelve 0 para entradas vacías o inválidas', () => {
    expect(parseAmount('')).toBe(0)
    expect(parseAmount('abc')).toBe(0)
    expect(parseAmount(',')).toBe(0)
  })
})

describe('sanitizeAmount', () => {
  it('convierte el punto en coma', () => {
    expect(sanitizeAmount('100.50')).toBe('100,50')
  })

  it('permite una sola coma', () => {
    expect(sanitizeAmount('1,2,3')).toBe('1,23')
  })

  it('limita a dos decimales también al teclear', () => {
    expect(sanitizeAmount('100,509')).toBe('100,50')
  })

  it('elimina caracteres no numéricos', () => {
    expect(sanitizeAmount('$ 1a00')).toBe('100')
  })

  it('round-trip con parseAmount', () => {
    expect(parseAmount(sanitizeAmount('100.50'))).toBe(100.5)
  })
})

describe('calcTax', () => {
  it('agrega el impuesto sobre la base', () => {
    const r = calcTax(100, 16, 'add')
    expect(r.subtotal).toBe(100)
    expect(r.tax).toBeCloseTo(16)
    expect(r.total).toBeCloseTo(116)
  })

  it('extrae el impuesto de un total', () => {
    const r = calcTax(116, 16, 'extract')
    expect(r.subtotal).toBeCloseTo(100)
    expect(r.tax).toBeCloseTo(16)
    expect(r.total).toBe(116)
  })

  it('con tasa 0 no altera el monto', () => {
    expect(calcTax(100, 0, 'add')).toEqual({ subtotal: 100, tax: 0, total: 100 })
    expect(calcTax(100, 0, 'extract')).toEqual({ subtotal: 100, tax: 0, total: 100 })
  })

  it('soporta tasas con decimales', () => {
    const r = calcTax(200, 12.5, 'add')
    expect(r.tax).toBeCloseTo(25)
    expect(r.total).toBeCloseTo(225)
  })
})

describe('calcIgtf', () => {
  it('calcula el 3% sobre el total', () => {
    expect(calcIgtf(116)).toBeCloseTo(3.48)
  })
})
