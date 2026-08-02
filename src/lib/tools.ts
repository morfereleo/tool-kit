import type { Lang } from './i18n'

export type Tool = {
  id: string
  num: string
  path: string
  name: string
  nameEn: string
  shortName: string
  shortNameEn: string
  tagline: string
  taglineEn: string
  accent: string
  accentInk: string
}

export const TOOLS: Tool[] = [
  {
    id: 'iva',
    num: '01',
    path: '#/iva',
    name: 'Calculadora de IVA',
    nameEn: 'VAT Calculator',
    shortName: 'IVA',
    shortNameEn: 'VAT',
    tagline: 'Agrega o extrae el impuesto según el país, listo para facturar.',
    taglineEn: 'Add or extract tax by country, ready to invoice.',
    accent: '#2F4BFF',
    accentInk: '#FFFFFF',
  },
  {
    id: 'tasas',
    num: '02',
    path: '#/tasas',
    name: 'Conversor de Tasas',
    nameEn: 'Exchange Rates',
    shortName: 'Tasas',
    shortNameEn: 'Rates',
    tagline: 'Dólar y Euro BCV, paralelo y USDT contra bolívares en vivo.',
    taglineEn: 'BCV Dollar and Euro, parallel and USDT against bolívares, live.',
    accent: '#00965E',
    accentInk: '#FFFFFF',
  },
  {
    id: 'imagenes',
    num: '03',
    path: '#/imagenes',
    name: 'Optimizador de Imágenes',
    nameEn: 'Image Optimizer',
    shortName: 'Imágenes',
    shortNameEn: 'Images',
    tagline: 'Convierte JPG y PNG a WebP y reduce el peso sin perder calidad.',
    taglineEn: 'Convert JPG and PNG to WebP and shrink file size without losing quality.',
    accent: '#7C3AED',
    accentInk: '#FFFFFF',
  },
  {
    id: 'qr',
    num: '04',
    path: '#/qr',
    name: 'Generador de QR',
    nameEn: 'QR Generator',
    shortName: 'QR',
    shortNameEn: 'QR',
    tagline: 'Códigos QR personalizados con los colores de tu marca.',
    taglineEn: 'Custom QR codes in your brand colors.',
    accent: '#FF5A1F',
    accentInk: '#FFFFFF',
  },
  {
    id: 'servicios',
    num: '05',
    path: '#/servicios',
    name: 'Cotizador de Servicios',
    nameEn: 'Service Quote Builder',
    shortName: 'Cotizador',
    shortNameEn: 'Quoter',
    tagline: 'Estudio completo para cotizar proyectos freelance sin quedarte corto.',
    taglineEn: 'A complete study to price freelance projects without undercharging.',
    accent: '#F5B301',
    accentInk: '#1C1917',
  },
  {
    id: 'acuerdo',
    num: '06',
    path: '#/acuerdo',
    name: 'Acuerdo de Servicios',
    nameEn: 'Service Agreement',
    shortName: 'Acuerdo',
    shortNameEn: 'Agreement',
    tagline: 'Documento de contratación con ítems, hitos y esquema de pago, listo para enviar.',
    taglineEn: 'A hiring document with items, milestones and a payment plan, ready to send.',
    accent: '#DB2777',
    accentInk: '#FFFFFF',
  },
  {
    id: 'texto',
    num: '07',
    path: '#/texto',
    name: 'Texto para Redes',
    nameEn: 'Social Text Styler',
    shortName: 'Texto',
    shortNameEn: 'Text',
    tagline: 'Negritas, cursivas y estilos especiales más emojis, listos para pegar en tus publicaciones.',
    taglineEn: 'Bold, italics and special styles plus emojis, ready to paste into your posts.',
    accent: '#0EA5E9',
    accentInk: '#FFFFFF',
  },
]

export const toolText = (t: Tool, lang: Lang) => ({
  name: lang === 'es' ? t.name : t.nameEn,
  shortName: lang === 'es' ? t.shortName : t.shortNameEn,
  tagline: lang === 'es' ? t.tagline : t.taglineEn,
})

export const BRAND = {
  name: 'AD·Tools',
  author: 'Alejandro Danieles',
  url: 'https://alejandrodanieles.com',
}
