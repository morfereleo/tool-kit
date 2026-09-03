import { describe, expect, it } from 'vitest'
import { fmt, fmtBytes, parseNum, setNumLocale } from './format'

describe('fmt', () => {
  it('formatea con locale es-VE por defecto', () => {
    setNumLocale('es-VE')
    expect(fmt(1234.56)).toBe('1.234,56')
  })

  it('respeta el número de decimales', () => {
    setNumLocale('es-VE')
    expect(fmt(16, 0)).toBe('16')
  })

  it('devuelve — para valores no finitos', () => {
    expect(fmt(Infinity)).toBe('—')
    expect(fmt(NaN)).toBe('—')
  })

  it('cambia de locale', () => {
    setNumLocale('en-US')
    expect(fmt(1234.56)).toBe('1,234.56')
    setNumLocale('es-VE')
  })
})

describe('parseNum', () => {
  it('parsea formato es-VE (miles con punto, decimal con coma)', () => {
    expect(parseNum('1.234,56')).toBe(1234.56)
    expect(parseNum('100,50')).toBe(100.5)
  })

  it('devuelve 0 para entradas inválidas', () => {
    expect(parseNum('')).toBe(0)
    expect(parseNum('abc')).toBe(0)
  })
})

describe('fmtBytes', () => {
  it('escala B / KB / MB', () => {
    expect(fmtBytes(512)).toBe('512 B')
    expect(fmtBytes(2048)).toBe('2.0 KB')
    expect(fmtBytes(3 * 1024 * 1024)).toBe('3.00 MB')
  })
})
