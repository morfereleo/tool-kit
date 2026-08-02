import type { Lang } from './i18n'

export type VatCountry = {
  code: string
  name: string
  nameEn: string
  rate: number
  taxName: string
  taxNameEn: string
  currency: string
}

export const VAT_COUNTRIES: VatCountry[] = [
  { code: 'VE', name: 'Venezuela', nameEn: 'Venezuela', rate: 16, taxName: 'IVA', taxNameEn: 'VAT', currency: 'Bs.' },
  { code: 'AR', name: 'Argentina', nameEn: 'Argentina', rate: 21, taxName: 'IVA', taxNameEn: 'VAT', currency: '$' },
  { code: 'BO', name: 'Bolivia', nameEn: 'Bolivia', rate: 13, taxName: 'IVA', taxNameEn: 'VAT', currency: 'Bs' },
  { code: 'BR', name: 'Brasil', nameEn: 'Brazil', rate: 17, taxName: 'ICMS (promedio)', taxNameEn: 'ICMS (average)', currency: 'R$' },
  { code: 'CL', name: 'Chile', nameEn: 'Chile', rate: 19, taxName: 'IVA', taxNameEn: 'VAT', currency: '$' },
  { code: 'CO', name: 'Colombia', nameEn: 'Colombia', rate: 19, taxName: 'IVA', taxNameEn: 'VAT', currency: '$' },
  { code: 'CR', name: 'Costa Rica', nameEn: 'Costa Rica', rate: 13, taxName: 'IVA', taxNameEn: 'VAT', currency: '₡' },
  { code: 'DO', name: 'Rep. Dominicana', nameEn: 'Dominican Republic', rate: 18, taxName: 'ITBIS', taxNameEn: 'ITBIS', currency: 'RD$' },
  { code: 'EC', name: 'Ecuador', nameEn: 'Ecuador', rate: 15, taxName: 'IVA', taxNameEn: 'VAT', currency: '$' },
  { code: 'SV', name: 'El Salvador', nameEn: 'El Salvador', rate: 13, taxName: 'IVA', taxNameEn: 'VAT', currency: '$' },
  { code: 'ES', name: 'España', nameEn: 'Spain', rate: 21, taxName: 'IVA', taxNameEn: 'VAT', currency: '€' },
  { code: 'GT', name: 'Guatemala', nameEn: 'Guatemala', rate: 12, taxName: 'IVA', taxNameEn: 'VAT', currency: 'Q' },
  { code: 'HN', name: 'Honduras', nameEn: 'Honduras', rate: 15, taxName: 'ISV', taxNameEn: 'ISV', currency: 'L' },
  { code: 'MX', name: 'México', nameEn: 'Mexico', rate: 16, taxName: 'IVA', taxNameEn: 'VAT', currency: '$' },
  { code: 'PA', name: 'Panamá', nameEn: 'Panama', rate: 7, taxName: 'ITBMS', taxNameEn: 'ITBMS', currency: 'B/.' },
  { code: 'PY', name: 'Paraguay', nameEn: 'Paraguay', rate: 10, taxName: 'IVA', taxNameEn: 'VAT', currency: '₲' },
  { code: 'PE', name: 'Perú', nameEn: 'Peru', rate: 18, taxName: 'IGV', taxNameEn: 'IGV', currency: 'S/' },
  { code: 'PT', name: 'Portugal', nameEn: 'Portugal', rate: 23, taxName: 'IVA', taxNameEn: 'VAT', currency: '€' },
  { code: 'UY', name: 'Uruguay', nameEn: 'Uruguay', rate: 22, taxName: 'IVA', taxNameEn: 'VAT', currency: '$' },
  { code: 'US', name: 'Estados Unidos', nameEn: 'United States', rate: 7, taxName: 'Sales Tax (promedio)', taxNameEn: 'Sales Tax (average)', currency: '$' },
]

export const vatCountryName = (c: VatCountry, lang: Lang) =>
  lang === 'es' ? c.name : c.nameEn

export const vatTaxName = (c: VatCountry, lang: Lang) =>
  lang === 'es' ? c.taxName : c.taxNameEn
