export type Tool = {
  id: string
  num: string
  path: string
  name: string
  shortName: string
  tagline: string
  accent: string
  accentInk: string
}

export const TOOLS: Tool[] = [
  {
    id: 'iva',
    num: '01',
    path: '#/iva',
    name: 'Calculadora de IVA',
    shortName: 'IVA',
    tagline: 'Agrega o extrae el impuesto según el país, listo para facturar.',
    accent: '#2F4BFF',
    accentInk: '#FFFFFF',
  },
  {
    id: 'tasas',
    num: '02',
    path: '#/tasas',
    name: 'Conversor de Tasas',
    shortName: 'Tasas',
    tagline: 'Dólar y Euro BCV, paralelo y USDT contra bolívares en vivo.',
    accent: '#00965E',
    accentInk: '#FFFFFF',
  },
  {
    id: 'imagenes',
    num: '03',
    path: '#/imagenes',
    name: 'Optimizador de Imágenes',
    shortName: 'Imágenes',
    tagline: 'Convierte JPG y PNG a WebP y reduce el peso sin perder calidad.',
    accent: '#7C3AED',
    accentInk: '#FFFFFF',
  },
  {
    id: 'qr',
    num: '04',
    path: '#/qr',
    name: 'Generador de QR',
    shortName: 'QR',
    tagline: 'Códigos QR personalizados con los colores de tu marca.',
    accent: '#FF5A1F',
    accentInk: '#FFFFFF',
  },
  {
    id: 'servicios',
    num: '05',
    path: '#/servicios',
    name: 'Cotizador de Servicios',
    shortName: 'Cotizador',
    tagline: 'Estudio completo para cotizar proyectos freelance sin quedarte corto.',
    accent: '#F5B301',
    accentInk: '#1C1917',
  },
  {
    id: 'acuerdo',
    num: '06',
    path: '#/acuerdo',
    name: 'Acuerdo de Servicios',
    shortName: 'Acuerdo',
    tagline: 'Documento de contratación con ítems, hitos y esquema de pago, listo para enviar.',
    accent: '#DB2777',
    accentInk: '#FFFFFF',
  },
]

export const BRAND = {
  name: 'AD·Tools',
  author: 'Alejandro Danieles',
  url: 'https://alejandrodanieles.com',
}
