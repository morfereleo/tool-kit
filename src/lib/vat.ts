export type VatCountry = {
  code: string
  name: string
  rate: number
  taxName: string
  currency: string
}

export const VAT_COUNTRIES: VatCountry[] = [
  { code: 'VE', name: 'Venezuela', rate: 16, taxName: 'IVA', currency: 'Bs.' },
  { code: 'AR', name: 'Argentina', rate: 21, taxName: 'IVA', currency: '$' },
  { code: 'BO', name: 'Bolivia', rate: 13, taxName: 'IVA', currency: 'Bs' },
  { code: 'BR', name: 'Brasil', rate: 17, taxName: 'ICMS (promedio)', currency: 'R$' },
  { code: 'CL', name: 'Chile', rate: 19, taxName: 'IVA', currency: '$' },
  { code: 'CO', name: 'Colombia', rate: 19, taxName: 'IVA', currency: '$' },
  { code: 'CR', name: 'Costa Rica', rate: 13, taxName: 'IVA', currency: '₡' },
  { code: 'DO', name: 'Rep. Dominicana', rate: 18, taxName: 'ITBIS', currency: 'RD$' },
  { code: 'EC', name: 'Ecuador', rate: 15, taxName: 'IVA', currency: '$' },
  { code: 'SV', name: 'El Salvador', rate: 13, taxName: 'IVA', currency: '$' },
  { code: 'ES', name: 'España', rate: 21, taxName: 'IVA', currency: '€' },
  { code: 'GT', name: 'Guatemala', rate: 12, taxName: 'IVA', currency: 'Q' },
  { code: 'HN', name: 'Honduras', rate: 15, taxName: 'ISV', currency: 'L' },
  { code: 'MX', name: 'México', rate: 16, taxName: 'IVA', currency: '$' },
  { code: 'PA', name: 'Panamá', rate: 7, taxName: 'ITBMS', currency: 'B/.' },
  { code: 'PY', name: 'Paraguay', rate: 10, taxName: 'IVA', currency: '₲' },
  { code: 'PE', name: 'Perú', rate: 18, taxName: 'IGV', currency: 'S/' },
  { code: 'PT', name: 'Portugal', rate: 23, taxName: 'IVA', currency: '€' },
  { code: 'UY', name: 'Uruguay', rate: 22, taxName: 'IVA', currency: '$' },
  { code: 'US', name: 'Estados Unidos', rate: 7, taxName: 'Sales Tax (promedio)', currency: '$' },
]
