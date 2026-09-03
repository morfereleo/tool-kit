/* eslint-disable react-refresh/only-export-components --
   este módulo exporta el provider junto a useT/useLang/dateLocale a propósito;
   editar aquí recarga la página completa en dev, un trade-off aceptable frente
   a partir el módulo que importan ~30 archivos. */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { setNumLocale } from '@/lib/format'

export type Lang = 'es' | 'en'

const LS_KEY = 'adtools-lang'

function detect(): Lang {
  try {
    const saved = localStorage.getItem(LS_KEY)
    if (saved === 'es' || saved === 'en') return saved
  } catch {
    /* privado */
  }
  return navigator.language?.toLowerCase().startsWith('es') ? 'es' : 'en'
}

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: 'es',
  setLang: () => {},
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detect)

  useEffect(() => {
    document.documentElement.lang = lang
    setNumLocale(lang === 'es' ? 'es-VE' : 'en-US')
    try {
      localStorage.setItem(LS_KEY, lang)
    } catch {
      /* privado */
    }
  }, [lang])

  return (
    <LangContext.Provider value={{ lang, setLang: setLangState }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)

/** Interpola {vars} en una cadena */
const fill = (s: string, vars?: Record<string, string | number>) =>
  vars ? s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`)) : s

/** Hook de traducción: const t = useT(); t('home.sub') */
export function useT() {
  const { lang } = useLang()
  return (key: string, vars?: Record<string, string | number>): string => {
    const entry = STRINGS[key]
    if (!entry) return key
    return fill(entry[lang], vars)
  }
}

/** Locale para toLocaleDateString según el idioma activo */
export const dateLocale = (lang: Lang) => (lang === 'es' ? 'es-VE' : 'en-US')

/* ————————————————————————————————————————————————————————
   Diccionario ES / EN — una entrada por clave
———————————————————————————————————————————————————————— */
const STRINGS: Record<string, { es: string; en: string }> = {
  /* ——— UI general (header / footer / shell) ——— */
  'ui.menu': { es: 'Menú', en: 'Menu' },
  'ui.closeMenu': { es: 'Cerrar menú', en: 'Close menu' },
  'ui.close': { es: 'Cerrar', en: 'Close' },
  'ui.toLight': { es: 'Cambiar a modo claro', en: 'Switch to light mode' },
  'ui.toDark': { es: 'Cambiar a modo oscuro', en: 'Switch to dark mode' },
  'ui.light': { es: 'Modo claro', en: 'Light mode' },
  'ui.dark': { es: 'Modo oscuro', en: 'Dark mode' },
  'ui.lang': { es: 'Idioma', en: 'Language' },
  'footer.designedBy': { es: 'Diseñado por', en: 'Designed by' },
  'footer.tagline': {
    es: 'Herramientas gratuitas — sin registro, sin letra pequeña',
    en: 'Free tools — no sign-up, no fine print',
  },
  'shell.back': { es: '← Volver al índice', en: '← Back to all tools' },

  /* ——— Home ——— */
  'home.kicker': { es: 'Herramientas Freelance', en: 'Freelance Tools' },
  'home.title1': { es: 'Caja de', en: 'Your' },
  'home.title2': { es: 'herramientas', en: 'toolbox' },
  'home.sub': {
    es: 'Utilidades rápidas y sin fricción para emprendedores y freelancers: calcula impuestos, convierte divisas, optimiza imágenes, genera QR y cotiza proyectos como un profesional.',
    en: 'Fast, friction-free utilities for entrepreneurs and freelancers: calculate taxes, convert currencies, optimize images, generate QR codes and quote projects like a pro.',
  },
  'home.chip1': { es: 'Sin registro', en: 'No sign-up' },
  'home.chip2': { es: 'Sin instalación', en: 'Nothing to install' },
  'home.chip3': {
    es: 'Tus datos no salen del navegador',
    en: 'Your data never leaves your browser',
  },
  'home.indexCta': { es: 'Selecciona una herramienta ↓', en: 'Pick a tool ↓' },
  'home.note': { es: '[ Nota ]', en: '[ Note ]' },
  'home.noteText': {
    es: 'Todo corre en tu navegador. Las tasas de cambio se consultan en vivo desde fuentes públicas; el resto de herramientas procesan tus datos localmente — nada se sube a ningún servidor.',
    en: 'Everything runs in your browser. Exchange rates are fetched live from public sources; every other tool processes your data locally — nothing is uploaded to any server.',
  },

  /* ——— Documentos guardados (SavedDocsPanel) ——— */
  'docs.save': { es: 'Guardar', en: 'Save' },
  'docs.saveChanges': { es: 'Guardar cambios', en: 'Save changes' },
  'docs.new': { es: '+ Nuevo', en: '+ New' },
  'docs.newTitle': { es: 'Empezar uno nuevo en blanco', en: 'Start a new blank one' },
  'docs.list': { es: 'Documentos guardados', en: 'Saved documents' },
  'docs.open': { es: 'abierto', en: 'open' },
  'docs.duplicate': { es: 'Duplicar', en: 'Duplicate' },
  'docs.delete': { es: 'Eliminar', en: 'Delete' },
  'docs.nameAria': { es: 'Nombre del documento', en: 'Document name' },
  'docs.editing': { es: 'Editando:', en: 'Editing:' },
  'docs.unsaved': {
    es: '— los cambios no se guardan solos; pulsa «Guardar cambios».',
    en: '— changes are not saved automatically; press "Save changes".',
  },
  'docs.placeholder': { es: 'Ej. Cliente X — rediseño web', en: 'E.g. Client X — website redesign' },

  /* ——— InfoNote ——— */
  'note.firstTime': {
    es: 'Lee esto la primera vez — toca para minimizar',
    en: 'Read this on your first visit — tap to minimize',
  },
  'note.minimize': { es: 'Toca para minimizar', en: 'Tap to minimize' },
  'note.whyAdd': {
    es: '¿Por qué se agrega este impuesto? Toca para saber',
    en: 'Why is this tax added? Tap to learn',
  },
  'note.whyExtract': {
    es: '¿Por qué se extrae este impuesto? Toca para saber',
    en: 'Why is this tax extracted? Tap to learn',
  },
  'note.source': { es: 'Fuente:', en: 'Source:' },

  /* ——— IVA ——— */
  'iva.simple': { es: 'Modo simple', en: 'Simple mode' },
  'iva.advanced': { es: 'Modo avanzado', en: 'Advanced mode' },
  'iva.otherCountry': { es: 'Otro país / tasa libre', en: 'Other country / custom rate' },
  'iva.otherCountrySub': { es: 'Define tu propio porcentaje', en: 'Set your own percentage' },
  'iva.customTag': { es: 'personalizado', en: 'custom' },
  'iva.customTax': { es: 'Impuesto', en: 'Tax' },
  'iva.customCountry': { es: 'tasa personalizada', en: 'custom rate' },
  'iva.ratePct': { es: 'Tasa %', en: 'Rate %' },
  'iva.addTax': { es: 'Agregar impuesto', en: 'Add tax' },
  'iva.extractTax': { es: 'Extraer impuesto', en: 'Extract tax' },
  'iva.foreignPayment': { es: 'Pago en divisas', en: 'Foreign currency payment' },
  'iva.igtfHint': {
    es: 'Suma el IGTF (3%) sobre el total',
    en: 'Adds the IGTF (3%) on top of the total',
  },
  'iva.netAmount': { es: 'Monto neto', en: 'Net amount' },
  'iva.grossAmount': { es: 'Monto con impuesto', en: 'Amount incl. tax' },
  'iva.quick': { es: 'Rápido', en: 'Quick' },
  'iva.taxableBase': { es: 'Base imponible', en: 'Taxable base' },
  'iva.totalWithTax': { es: 'Total con impuesto', en: 'Total incl. tax' },
  'iva.fx': { es: 'divisas', en: 'FX' },
  'iva.totalToPay': { es: 'Total a pagar', en: 'Total to pay' },
  'iva.totalToInvoice': { es: 'Total a facturar', en: 'Total to invoice' },
  'iva.copy': { es: 'Copiar desglose', en: 'Copy breakdown' },
  'iva.copied': { es: '✓ Desglose copiado', en: '✓ Breakdown copied' },
  'iva.igtfLine': { es: 'IGTF (3% divisas)', en: 'IGTF (3% FX)' },
  'iva.keypadShow': { es: 'Mostrar teclado', en: 'Show keypad' },
  'iva.keypadHide': { es: 'Ocultar teclado', en: 'Hide keypad' },
  'iva.keypadNote': {
    es: 'Toca el monto y escribe directamente — el teclado es opcional',
    en: 'Tap the amount and type directly — the keypad is optional',
  },
  'iva.delete': { es: 'Borrar', en: 'Delete' },
  'iva.disclaimer': {
    es: '* Tasas generales vigentes en {country}. Algunos productos o servicios pueden tener tasas reducidas o exoneraciones según la legislación local.',
    en: '* General rates in effect in {country}. Some products or services may have reduced rates or exemptions under local law.',
  },
  'iva.igtfDisclaimer': {
    es: ' El IGTF (3%) aplica a pagos en moneda extranjera y se calcula sobre el total de la factura.',
    en: ' The IGTF (3%) applies to foreign currency payments and is calculated on the invoice total.',
  },
  'iva.amountCurrency': { es: 'Moneda del monto', en: 'Amount currency' },
  'iva.amountsCharge': { es: 'Montos que cobras ($)', en: 'Amounts you charge ($)' },
  'iva.addItem': { es: '+ Añadir otro monto', en: '+ Add another amount' },
  'iva.itemPh': { es: 'Descripción (opcional)', en: 'Description (optional)' },
  'iva.removeItem': { es: 'Quitar monto', en: 'Remove amount' },
  'iva.itemsTotal': { es: 'Suma de montos', en: 'Amounts total' },
  'iva.rateTag': { es: 'tasa {r}', en: 'rate {r}' },
  'iva.copyEquiv': { es: 'Equivalente: {v} (tasa {r})', en: 'Equivalent: {v} (rate {r})' },
  'iva.serviceName': { es: 'Nombre del servicio', en: 'Service name' },
  'iva.servicePh': {
    es: 'Ej. Diseño de logo + manual de marca',
    en: 'E.g. Logo design + brand manual',
  },
  'iva.amountCharge': { es: 'Monto que cobras ($)', en: 'Amount you charge ($)' },
  'iva.fxRate': { es: 'Tasa de cambio (Bs/$)', en: 'Exchange rate (Bs/$)' },
  'iva.fxLoading': { es: 'Consultando…', en: 'Loading…' },
  'iva.fxLive': { es: 'BCV en vivo · {date}', en: 'BCV live · {date}' },
  'iva.fxOffline': { es: 'Sin conexión', en: 'Offline' },
  'iva.fxOther': { es: 'Otra', en: 'Other' },
  'iva.fxCustomPh': { es: 'Ingresa tu tasa', en: 'Enter your rate' },
  'iva.generate': { es: 'Generar orden de servicio', en: 'Generate service order' },
  'iva.advDisclaimer': {
    es: '* El total en bolívares se calcula con la tasa seleccionada y el {taxName} del país. Las tasas BCV se consultan en vivo (misma fuente que el conversor, herramienta 02) — verifica la tasa del día antes de enviar la orden a tu cliente.',
    en: '* The bolívar total is calculated with the selected rate and the country\'s {taxName}. BCV rates are fetched live (same source as the converter, tool 02) — check the day\'s rate before sending the order to your client.',
  },

  /* ——— Tasas ——— */
  'tasas.loading': { es: 'Consultando tasas…', en: 'Fetching rates…' },
  'tasas.updated': { es: 'Actualizado: {date}', en: 'Updated: {date}' },
  'tasas.offline': {
    es: 'Sin conexión — ingresa las tasas manualmente',
    en: 'Offline — enter the rates manually',
  },
  'tasas.reload': { es: '↻ Actualizar', en: '↻ Refresh' },
  'tasas.board': {
    es: 'Pizarra de tasas · Bs. por unidad (tocables para editar)',
    en: 'Rate board · Bs. per unit (tap to edit)',
  },
  'tasas.usdBcv': { es: 'Dólar BCV', en: 'USD BCV' },
  'tasas.eurBcv': { es: 'Euro BCV', en: 'EUR BCV' },
  'tasas.usdPar': { es: 'Dólar paralelo', en: 'Parallel USD' },
  'tasas.usdt': { es: 'USDT (Tether)', en: 'USDT (Tether)' },
  'tasas.bolivares': { es: 'Bolívares', en: 'Bolívares' },
  'tasas.srcBcv': { es: 'Banco Central de Venezuela', en: 'Central Bank of Venezuela' },
  'tasas.srcPar': { es: 'Mercado paralelo', en: 'Parallel market' },
  'tasas.srcUsdt': { es: 'Estimado ≈ paralelo', en: 'Estimated ≈ parallel' },
  'tasas.deltaTitle': {
    es: 'Variación vs. día anterior',
    en: 'Change vs. previous day',
  },
  'tasas.reset': { es: 'Restablecer tasas originales', en: 'Reset to live rates' },
  'tasas.amount': { es: 'Monto a convertir', en: 'Amount to convert' },
  'tasas.from': { es: 'Moneda de origen', en: 'Source currency' },
  'tasas.to': { es: 'Equivale a', en: 'Converts to' },
  'tasas.disclaimer': {
    es: '* Tasas oficiales del BCV vía API pública (dolarapi.com). La tasa USDT se estima con el mercado paralelo — verifica el precio real en tu exchange P2P antes de cerrar una operación. Las flechas ▲▼ comparan contra el último día anterior consultado desde este navegador.',
    en: '* Official BCV rates via public API (dolarapi.com). The USDT rate is estimated from the parallel market — check the real price on your P2P exchange before closing a deal. The ▲▼ arrows compare against the last previous day checked from this browser.',
  },

  /* ——— Imágenes ——— */
  'img.drop': { es: 'Arrastra tus imágenes', en: 'Drag your images' },
  'img.dropping': { es: 'Suéltalas aquí', en: 'Drop them here' },
  'img.dropHint': {
    es: 'o haz clic para seleccionar · JPG y PNG · todo se procesa en tu navegador',
    en: 'or click to browse · JPG & PNG · everything is processed in your browser',
  },
  'img.quality': { es: 'Calidad WebP — {q}%', en: 'WebP quality — {q}%' },
  'img.qualityHint': {
    es: '80–85 es el punto dulce habitual',
    en: '80–85 is the usual sweet spot',
  },
  'img.maxWidth': { es: 'Ancho máximo (px, 0 = original)', en: 'Max width (px, 0 = original)' },
  'img.optimizeOne': { es: 'Optimizar {n} imagen', en: 'Optimize {n} image' },
  'img.optimizeMany': { es: 'Optimizar {n} imágenes', en: 'Optimize {n} images' },
  'img.allDone': { es: 'Optimizar todo listo', en: 'Optimize — all done' },
  'img.downloadZip': { es: 'Descargar todas (.zip)', en: 'Download all (.zip)' },
  'img.downloadOne': { es: 'Descargar WebP', en: 'Download WebP' },
  'img.saved': { es: 'ahorrados', en: 'saved' },
  'img.imageDone': { es: 'imagen optimizada', en: 'image optimized' },
  'img.imagesDone': { es: 'imágenes optimizadas', en: 'images optimized' },
  'img.pending': { es: ' · en espera', en: ' · pending' },
  'img.failed': { es: ' · error al convertir', en: ' · conversion failed' },
  'img.compare': { es: 'Comparar antes / después', en: 'Compare before / after' },
  'img.download': { es: 'Descargar', en: 'Download' },
  'img.step1t': { es: 'Sube', en: 'Upload' },
  'img.step1d': {
    es: 'Arrastra JPG o PNG, una o varias a la vez.',
    en: 'Drag JPG or PNG files, one or many at once.',
  },
  'img.step2t': { es: 'Ajusta', en: 'Adjust' },
  'img.step2d': {
    es: 'Elige calidad y tamaño máximo según tu caso.',
    en: 'Pick quality and max size for your use case.',
  },
  'img.step3t': { es: 'Descarga', en: 'Download' },
  'img.step3d': {
    es: 'WebP ligero, listo para web, tienda o portafolio.',
    en: 'Lightweight WebP, ready for your website, store or portfolio.',
  },
  'compare.hint': {
    es: 'Arrastra el divisor (o usa ← →) para comparar la original con la optimizada',
    en: 'Drag the divider (or use ← →) to compare the original with the optimized version',
  },
  'compare.original': { es: 'Original', en: 'Original' },
  'compare.webp': { es: 'Optimizada (WebP)', en: 'Optimized (WebP)' },

  /* ——— QR ——— */
  'qr.content': { es: 'Contenido del QR', en: 'QR content' },
  'qr.contentPh': { es: 'URL, texto, WhatsApp, WiFi…', en: 'URL, text, WhatsApp, WiFi…' },
  'qr.waTip': {
    es: 'Tip: para WhatsApp usa https://wa.me/584121234567',
    en: 'Tip: for WhatsApp use https://wa.me/14155552671',
  },
  'qr.templates': { es: 'Plantillas', en: 'Templates' },
  'qr.t1': { es: 'Clásico', en: 'Classic' },
  'qr.t2': { es: 'Sepia', en: 'Sepia' },
  'qr.t3': { es: 'Cobalto', en: 'Cobalt' },
  'qr.t4': { es: 'Bosque', en: 'Forest' },
  'qr.t5': { es: 'Violeta', en: 'Violet' },
  'qr.t6': { es: 'Naranja', en: 'Orange' },
  'qr.codeColor': { es: 'Color del código', en: 'Code color' },
  'qr.custom': { es: ' · personalizado', en: ' · custom' },
  'qr.freeColor': { es: 'Color libre', en: 'Custom color' },
  'qr.bgColor': { es: 'Color de fondo', en: 'Background color' },
  'qr.logo': { es: 'Logo en el centro · opcional', en: 'Logo in the center · optional' },
  'qr.change': { es: 'Cambiar', en: 'Change' },
  'qr.remove': { es: 'Quitar', en: 'Remove' },
  'qr.uploadLogo': { es: 'Subir tu logo', en: 'Upload your logo' },
  'qr.logoNote': {
    es: '* Va sobre una caja blanca con corrección de errores alta — escanéalo antes de imprimirlo.',
    en: '* It sits on a white box with high error correction — scan it before printing.',
  },
  'qr.size': { es: 'Tamaño de exportación', en: 'Export size' },
  'qr.preview': { es: 'Vista previa', en: 'Preview' },
  'qr.tooLong': {
    es: 'El contenido es demasiado largo para un solo QR.',
    en: 'The content is too long for a single QR code.',
  },
  'qr.contrastGood': {
    es: 'Contraste óptimo ({r}:1) — se escaneará sin problema.',
    en: 'Optimal contrast ({r}:1) — it will scan without issues.',
  },
  'qr.contrastLow': {
    es: 'Contraste bajo ({r}:1) — algunos lectores podrían fallar. Oscurece el código o aclara el fondo para superar 4:1, y escanéalo antes de imprimir.',
    en: 'Low contrast ({r}:1) — some readers might fail. Darken the code or lighten the background to get above 4:1, and scan it before printing.',
  },
  'qr.contrastBad': {
    es: 'Contraste muy bajo ({r}:1) — es casi seguro que no escanee. Elige una plantilla o aumenta la diferencia entre código y fondo.',
    en: 'Very low contrast ({r}:1) — it will almost certainly not scan. Pick a template or increase the difference between code and background.',
  },
  'qr.png': { es: 'Descargar PNG', en: 'Download PNG' },
  'qr.svg': { es: 'Descargar SVG', en: 'Download SVG' },
  'qr.svgNote': {
    es: '* El SVG es vectorial: ideal para imprenta, tarjetas y vallas sin perder nitidez. Verifica siempre el QR escaneándolo antes de mandarlo a producción.',
    en: '* SVG is a vector format: ideal for print, cards and billboards without losing sharpness. Always verify the QR by scanning it before sending it to production.',
  },

  /* ——— Cotizador ——— */
  'sv.saveLabel': { es: 'Guardar cotización', en: 'Save quote' },
  'sv.listLabel': { es: 'Cotizaciones guardadas', en: 'Saved quotes' },
  'sv.pick': {
    es: 'Elige tu modelo de cotización — el que mejor se adapte a tu servicio',
    en: 'Choose your pricing model — the one that best fits your service',
  },
  'sv.m.horas.name': { es: 'Por horas y fases', en: 'Hours and phases' },
  'sv.m.horas.desc': {
    es: 'Desglosa el proyecto en fases con horas estimadas y complejidad.',
    en: 'Break the project into phases with estimated hours and complexity.',
  },
  'sv.m.horas.best': {
    es: 'Proyectos a medida con alcance variable',
    en: 'Custom projects with variable scope',
  },
  'sv.m.paquete.name': { es: 'Precio por paquete', en: 'Package pricing' },
  'sv.m.paquete.desc': {
    es: 'Ofrece hasta 3 opciones cerradas; el cliente elige la suya.',
    en: 'Offer up to 3 closed options; the client picks theirs.',
  },
  'sv.m.paquete.best': {
    es: 'Servicios repetibles y productizados',
    en: 'Repeatable, productized services',
  },
  'sv.m.valor.name': { es: 'Por valor generado', en: 'Value-based' },
  'sv.m.valor.desc': {
    es: 'Precio anclado al impacto que generas, no a tus horas.',
    en: 'Price anchored to the impact you create, not your hours.',
  },
  'sv.m.valor.best': {
    es: 'Proyectos con retorno medible para el cliente',
    en: 'Projects with measurable client returns',
  },
  'sv.m.retainer.name': { es: 'Retainer mensual', en: 'Monthly retainer' },
  'sv.m.retainer.desc': {
    es: 'Bloque de horas mensual recurrente con descuento por fidelidad.',
    en: 'Recurring monthly block of hours with a loyalty discount.',
  },
  'sv.m.retainer.best': {
    es: 'Clientes fijos y trabajo continuo',
    en: 'Steady clients and ongoing work',
  },
  'sv.base': { es: 'Tu tarifa base y tu país', en: 'Your base rate and country' },
  'sv.income': { es: 'Ingreso mensual deseado ($)', en: 'Desired monthly income ($)' },
  'sv.billable': { es: 'Horas facturables / semana', en: 'Billable hours / week' },
  'sv.rateOverride': { es: 'Tarifa / hora (opcional)', en: 'Rate / hour (optional)' },
  'sv.countryTax': { es: 'Impuesto del país', en: 'Country tax' },
  'sv.suggestedRate': { es: '→ Tarifa sugerida:', en: '→ Suggested rate:' },
  'sv.perHour': { es: '/hora', en: '/hour' },
  'sv.customized': { es: ' (personalizada)', en: ' (custom)' },
  'sv.weeksNote': {
    es: ' · calculada con 4,33 semanas/mes',
    en: ' · calculated with 4.33 weeks/month',
  },
  'sv.cx1': { es: 'Simple ×0,8', en: 'Simple ×0.8' },
  'sv.cx2': { es: 'Normal ×1,0', en: 'Normal ×1.0' },
  'sv.cx3': { es: 'Exigente ×1,2', en: 'Demanding ×1.2' },
  'sv.cx4': { es: 'Complejo ×1,5', en: 'Complex ×1.5' },
  'sv.phases': { es: 'Fases del proyecto', en: 'Project phases' },
  'sv.effHours': { es: 'h efectivas', en: 'effective hrs' },
  'sv.phasePh': { es: 'Nombre de la fase', en: 'Phase name' },
  'sv.hours': { es: 'Horas', en: 'Hours' },
  'sv.addPhase': { es: '+ Agregar fase', en: '+ Add phase' },
  'sv.delPhase': { es: 'Eliminar fase', en: 'Delete phase' },
  'sv.directCosts': { es: 'Costos directos', en: 'Direct costs' },
  'sv.costPh': { es: 'Ej. hosting, assets, transporte…', en: 'E.g. hosting, assets, transport…' },
  'sv.addCost': { es: '+ Agregar costo', en: '+ Add cost' },
  'sv.delCost': { es: 'Eliminar costo', en: 'Delete cost' },
  'sv.contingency': { es: 'Contingencia y margen', en: 'Contingency and margin' },
  'sv.risk': { es: 'Contingencia / riesgo %', en: 'Contingency / risk %' },
  'sv.riskHint': {
    es: 'cubre imprevistos y cambios de alcance',
    en: 'covers surprises and scope changes',
  },
  'sv.profit': { es: 'Margen de ganancia %', en: 'Profit margin %' },
  'sv.profitHint': { es: 'tu crecimiento como negocio', en: 'your growth as a business' },
  'sv.pkgs': { es: 'Define tus paquetes', en: 'Define your packages' },
  'sv.marginsOk': { es: 'Márgenes saludables', en: 'Healthy margins' },
  'sv.marginsBad': { es: 'Algún paquete queda corto', en: 'Some package falls short' },
  'sv.popular': { es: 'popular', en: 'popular' },
  'sv.delPkg': { es: 'Quitar paquete', en: 'Remove package' },
  'sv.delFeature': { es: 'Quitar característica', en: 'Remove feature' },
  'sv.addFeature': { es: '+ característica', en: '+ feature' },
  'sv.pkgHours': { es: 'Horas que te toma', en: 'Hours it takes you' },
  'sv.internalCost': { es: 'Costo interno', en: 'Internal cost' },
  'sv.margin': { es: 'Margen', en: 'Margin' },
  'sv.effRateH': { es: '$/h efectivo', en: '$/h effective' },
  'sv.addPkg': { es: '+ Agregar paquete', en: '+ Add package' },
  'sv.newPkg': { es: 'Nuevo', en: 'New' },
  'sv.pkgCosts': { es: 'Costos directos por proyecto', en: 'Direct costs per project' },
  'sv.pkgCostsLabel': {
    es: 'Total en $ (herramientas, assets…)',
    en: 'Total in $ (tools, assets…)',
  },
  'sv.pkgCostsNote': {
    es: 'Se suma a tu costo de tiempo para verificar que cada paquete deje al menos 20% de margen.',
    en: 'Added to your time cost to verify each package leaves at least a 20% margin.',
  },
  'sv.impact': { es: 'El impacto para tu cliente', en: 'The impact for your client' },
  'sv.impactValue': {
    es: 'Valor que generará el proyecto ($)',
    en: 'Value the project will generate ($)',
  },
  'sv.impactHint': {
    es: 'ventas adicionales, ahorro de tiempo, ingresos esperados…',
    en: 'additional sales, time saved, expected revenue…',
  },
  'sv.share': { es: 'Tu participación del valor — {s}%', en: 'Your share of the value — {s}%' },
  'sv.shareHint': {
    es: 'lo habitual en value pricing: 10–20% del impacto',
    en: 'typical in value pricing: 10–20% of the impact',
  },
  'sv.suggestedByValue': { es: 'Precio sugerido por valor', en: 'Suggested price by value' },
  'sv.finalPrice': {
    es: 'Tu precio final y verificación de costos',
    en: 'Your final price and cost check',
  },
  'sv.marginOk': { es: 'Margen saludable', en: 'Healthy margin' },
  'sv.marginBad': { es: 'Por debajo de tus costos', en: 'Below your costs' },
  'sv.yourPrice': { es: 'Tu precio ($)', en: 'Your price ($)' },
  'sv.estHours': { es: 'Horas estimadas', en: 'Estimated hours' },
  'sv.directCostsUsd': { es: 'Costos directos ($)', en: 'Direct costs ($)' },
  'sv.retAgreement': { es: 'El acuerdo mensual', en: 'The monthly agreement' },
  'sv.retHours': { es: 'Horas mensuales', en: 'Monthly hours' },
  'sv.retGross': {
    es: 'valor sin descuento: ${v}/mes',
    en: 'value without discount: ${v}/month',
  },
  'sv.retDiscount': { es: 'Descuento por fidelidad — {d}%', en: 'Loyalty discount — {d}%' },
  'sv.retDiscountHint': {
    es: 'premia la recurrencia; lo habitual: 5–15%',
    en: 'rewards recurrence; typical: 5–15%',
  },
  'sv.retMonths': { es: 'Duración (meses)', en: 'Duration (months)' },
  'sv.retMonthsHint': {
    es: 'para proyectar el contrato total',
    en: 'to project the total contract',
  },
  'sv.retIncludes': { es: 'Qué incluye cada mes', en: 'What each month includes' },
  'sv.retIncludesText': {
    es: 'Define con tu cliente las entregas del bloque: por ejemplo mantenimiento, ajustes de diseño, reportes o soporte prioritario. Las horas no usadas no se acumulan al mes siguiente — escríbelo en el acuerdo.',
    en: 'Agree with your client on the block deliverables: for example maintenance, design tweaks, reports or priority support. Unused hours do not roll over to the next month — write that into the agreement.',
  },
  'sv.result': { es: 'Resultado — {model}', en: 'Result — {model}' },
  'sv.labor': { es: 'Mano de obra ({h} h efectivas)', en: 'Labor ({h} effective hrs)' },
  'sv.contingencyRow': { es: 'Contingencia {r}%', en: 'Contingency {r}%' },
  'sv.marginRow': { es: 'Margen {p}%', en: 'Margin {p}%' },
  'sv.suggestedValueRow': { es: 'Precio sugerido (valor)', en: 'Suggested price (value)' },
  'sv.yourPriceRow': { es: 'Tu precio', en: 'Your price' },
  'sv.discountRow': { es: 'Descuento {d}%', en: 'Discount {d}%' },
  'sv.lbl.horas': { es: 'Precio total del proyecto', en: 'Total project price' },
  'sv.lbl.paquete': { es: 'Paquete recomendado', en: 'Recommended package' },
  'sv.lbl.valor': { es: 'Precio del proyecto', en: 'Project price' },
  'sv.lbl.retainer': { es: 'Mensualidad del retainer', en: 'Monthly retainer fee' },
  'sv.floor': { es: 'Piso mínimo aceptable: ${v}', en: 'Minimum acceptable floor: ${v}' },
  'sv.effRate': { es: 'Tarifa efectiva: ${v}/h', en: 'Effective rate: ${v}/h' },
  'sv.pkgNote': {
    es: 'El cliente elige su paquete — verifica que todos cubran tus costos',
    en: 'The client picks a package — make sure they all cover your costs',
  },
  'sv.floorCosts': { es: 'Piso mínimo (costos): ${v}', en: 'Minimum floor (costs): ${v}' },
  'sv.contract': { es: 'Contrato proyectado: ${v}', en: 'Projected contract: ${v}' },
  'sv.warn': {
    es: 'Los montos en la orden se muestran en dólares. Para el equivalente en bolívares, usa el modo avanzado de la calculadora de IVA con la tasa BCV del día.',
    en: 'Amounts on the order are shown in dollars. For the bolívar equivalent, use the advanced mode of the VAT calculator with the day\'s BCV rate.',
  },
  'sv.q.horas': {
    es: 'Proyecto por fases — {h} horas estimadas',
    en: 'Phase-based project — {h} estimated hours',
  },
  'sv.q.paquete': { es: 'Paquete {name} — {feat}', en: '{name} package — {feat}' },
  'sv.q.valor': {
    es: 'Proyecto cotizado por valor generado',
    en: 'Value-priced project',
  },
  'sv.q.retainer': {
    es: 'Retainer mensual — {h} horas/mes × {m} meses',
    en: 'Monthly retainer — {h} hours/month × {m} months',
  },
  'sv.q.retainerShort': {
    es: 'Retainer mensual — {h} horas/mes',
    en: 'Monthly retainer — {h} hours/month',
  },
  'sv.d.phase1': { es: 'Investigación y brief', en: 'Research & brief' },
  'sv.d.phase2': { es: 'Diseño / desarrollo', en: 'Design / development' },
  'sv.d.phase3': { es: 'Revisiones y ajustes', en: 'Revisions & adjustments' },
  'sv.d.cost': { es: 'Suscripciones / plugins', en: 'Subscriptions / plugins' },
  'sv.d.tier1': { es: 'Básico', en: 'Basic' },
  'sv.d.tier2': { es: 'Estándar', en: 'Standard' },
  'sv.d.tier3': { es: 'Premium', en: 'Premium' },
  'sv.d.f1': { es: 'Entrega en 7 días', en: 'Delivery in 7 days' },
  'sv.d.f2': { es: '1 revisión', en: '1 revision' },
  'sv.d.f3': { es: 'Entrega en 10 días', en: 'Delivery in 10 days' },
  'sv.d.f4': { es: '3 revisiones', en: '3 revisions' },
  'sv.d.f5': { es: 'Soporte 15 días', en: '15-day support' },
  'sv.d.f6': { es: 'Entrega prioritaria', en: 'Priority delivery' },
  'sv.d.f7': { es: 'Revisiones ilimitadas', en: 'Unlimited revisions' },
  'sv.d.f8': { es: 'Soporte 30 días', en: '30-day support' },
  'sv.m.horas.short': { es: 'Por horas', en: 'Hourly' },
  'sv.m.paquete.short': { es: 'Paquetes', en: 'Packages' },
  'sv.m.valor.short': { es: 'Por valor', en: 'By value' },
  'sv.m.retainer.short': { es: 'Retainer', en: 'Retainer' },
  'sv.effPill': { es: '${v}/h efectivo', en: '${v}/h effective' },

  /* ——— Acuerdo ——— */
  'ac.saveLabel': { es: 'Guardar acuerdo', en: 'Save agreement' },
  'ac.listLabel': { es: 'Acuerdos guardados', en: 'Saved agreements' },
  'ac.placeholder': {
    es: 'Ej. Acuerdo — diseño de marca para Café Andino',
    en: 'E.g. Agreement — brand design for Andino Café',
  },
  'ac.parties': { es: 'Las partes', en: 'The parties' },
  'ac.client': { es: 'Contratante (tú)', en: 'Client (you)' },
  'ac.idNum': { es: 'Cédula / ID fiscal (opcional)', en: 'Tax ID (optional)' },
  'ac.provider': { es: 'Prestador del servicio', en: 'Service provider' },
  'ac.clientPh': { es: 'Ej. Alejandro Danieles', en: 'E.g. Jane Cooper' },
  'ac.clientIdPh': { es: 'Ej. V-12.345.678', en: 'E.g. 12-345678' },
  'ac.providerPh': { es: 'Ej. María Pérez — Diseño', en: 'E.g. John Smith — Design' },
  'ac.providerIdPh': { es: 'Ej. V-98.765.432', en: 'E.g. 98-765432' },
  'ac.date': { es: 'Fecha del acuerdo: {d}', en: 'Agreement date: {d}' },
  'ac.items': { es: 'Ítems del servicio', en: 'Service items' },
  'ac.itemOne': { es: 'ítem definido', en: 'item defined' },
  'ac.itemMany': { es: 'ítems definidos', en: 'items defined' },
  'ac.itemPh': {
    es: 'Ej. Diseño de 5 piezas gráficas para redes sociales',
    en: 'E.g. Design of 5 social media graphics',
  },
  'ac.delItem': { es: 'Quitar ítem', en: 'Remove item' },
  'ac.addItem': { es: '+ Agregar ítem', en: '+ Add item' },
  'ac.itemsNote': {
    es: 'Describe cada entregable con la mayor claridad posible: qué incluye, en qué formato y cuántas revisiones contempla.',
    en: 'Describe each deliverable as clearly as possible: what it includes, in what format and how many revisions it covers.',
  },
  'ac.scheme': { es: 'Esquema de pago', en: 'Payment scheme' },
  'ac.s.fijo.name': { es: 'Monto fijo', en: 'Fixed amount' },
  'ac.s.fijo.hint': {
    es: 'Un precio cerrado por todo el servicio',
    en: 'One closed price for the whole service',
  },
  'ac.s.mensual.name': { es: 'Pago mensual', en: 'Monthly payment' },
  'ac.s.mensual.hint': { es: 'Un monto igual cada mes', en: 'The same amount every month' },
  'ac.s.quincenal.name': { es: 'Pago quincenal', en: 'Biweekly payment' },
  'ac.s.quincenal.hint': {
    es: 'Un monto igual cada quincena',
    en: 'The same amount every two weeks',
  },
  'ac.total': { es: 'Monto total ($)', en: 'Total amount ($)' },
  'ac.term': { es: 'Plazo estimado del servicio', en: 'Estimated service term' },
  'ac.termPh': { es: 'Ej. 4 semanas', en: 'E.g. 4 weeks' },
  'ac.termDefault': { es: '4 semanas', en: '4 weeks' },
  'ac.perPayment': { es: 'Monto por pago ($)', en: 'Amount per payment ($)' },
  'ac.payCount': { es: 'N° de pagos', en: 'No. of payments' },
  'ac.fillPayment': {
    es: 'Completa el monto y la cantidad de pagos',
    en: 'Fill in the amount and number of payments',
  },
  'ac.milestones': { es: 'Hitos de pago', en: 'Payment milestones' },
  'ac.healthOk': {
    es: 'Los hitos cuadran con el total',
    en: 'Milestones add up to the total',
  },
  'ac.healthUnder': { es: 'Faltan ${v} por asignar', en: '${v} left to assign' },
  'ac.healthOver': { es: 'Excede el total por ${v}', en: 'Exceeds the total by ${v}' },
  'ac.msPh': {
    es: 'Nombre del hito — ej. Primer avance',
    en: 'Milestone name — e.g. First draft',
  },
  'ac.msAmount': { es: 'Monto ($)', en: 'Amount ($)' },
  'ac.msWhen': { es: 'Condición o fecha', en: 'Condition or date' },
  'ac.msWhenPh': {
    es: 'Ej. Al aprobar el primer avance',
    en: 'E.g. Upon approving the first draft',
  },
  'ac.delMs': { es: 'Quitar hito', en: 'Remove milestone' },
  'ac.addMs': { es: '+ Agregar hito', en: '+ Add milestone' },
  'ac.msNote': {
    es: 'Reparte el total entre los hitos — la píldora te avisa cuando la suma cuadra con el monto acordado.',
    en: 'Split the total across milestones — the pill tells you when the sum matches the agreed amount.',
  },
  'ac.d.upfront': { es: 'Anticipo', en: 'Upfront payment' },
  'ac.d.onSigning': { es: 'Al firmar el acuerdo', en: 'Upon signing the agreement' },
  'ac.d.final': { es: 'Entrega final', en: 'Final delivery' },
  'ac.d.onDelivery': { es: 'Contra entrega del servicio', en: 'Upon delivery of the service' },
  'ac.preview': { es: 'Vista previa del documento', en: 'Document preview' },
  'ac.docTitle': { es: 'ACUERDO DE PRESTACIÓN DE SERVICIOS', en: 'SERVICE AGREEMENT' },
  'ac.theClient': { es: 'el Contratante', en: 'the Client' },
  'ac.theProvider': { es: 'el Prestador', en: 'the Provider' },
  'ac.s1': { es: '1 · Objeto del servicio', en: '1 · Scope of service' },
  'ac.noItems': { es: 'Aún sin ítems definidos…', en: 'No items defined yet…' },
  'ac.s2': { es: '2 · Esquema de pago', en: '2 · Payment scheme' },
  'ac.agreedTotal': { es: 'Total acordado', en: 'Agreed total' },
  'ac.s3': { es: '3 · Hitos de pago', en: '3 · Payment milestones' },
  'ac.singlePayment': { es: 'Pago único contra entrega…', en: 'Single payment upon delivery…' },
  'ac.milestoneN': { es: 'Hito {n}', en: 'Milestone {n}' },
  'ac.roleClient': { es: 'EL CLIENTE', en: 'THE CLIENT' },
  'ac.roleProvider': { es: 'EL PRESTADOR', en: 'THE PROVIDER' },
  'ac.download': { es: 'Descargar documento', en: 'Download document' },
  'ac.ticket': { es: 'Ticket de servicio', en: 'Service ticket' },
  'ac.legalNote': {
    es: 'El documento es el acuerdo completo para firmar; el ticket es un resumen rápido para enviar. No sustituyen un contrato con validez legal — para eso, consulta a un profesional.',
    en: 'The document is the full agreement to sign; the ticket is a quick summary to send. They are not a substitute for a legally binding contract — for that, consult a professional.',
  },
  'ac.labelFijo': {
    es: 'Monto fijo por el servicio completo{term}',
    en: 'Fixed amount for the full service{term}',
  },
  'ac.labelTerm': { es: ' — plazo estimado: {t}', en: ' — estimated term: {t}' },
  'ac.labelMensual': {
    es: 'Pago mensual durante {n} {period}',
    en: 'Monthly payment for {n} {period}',
  },
  'ac.labelQuincenal': {
    es: 'Pago quincenal durante {n} {period}',
    en: 'Biweekly payment for {n} {period}',
  },
  'ac.month': { es: 'mes', en: 'month' },
  'ac.months': { es: 'meses', en: 'months' },
  'ac.fortnight': { es: 'quincena', en: 'two-week period' },
  'ac.fortnights': { es: 'quincenas', en: 'two-week periods' },
  'ac.perLabel': {
    es: '$ {per} por {period} × {n} pagos',
    en: '$ {per} per {period} × {n} payments',
  },
  'ac.between': { es: 'Entre', en: 'Between' },
  'ac.hereClient': { es: '(en adelante, el Cliente) y', en: '(hereinafter, the Client) and' },
  'ac.hereProvider': {
    es: '(en adelante, el Prestador), se acuerda lo siguiente:',
    en: '(hereinafter, the Provider), the following is agreed:',
  },

  /* ——— Texto para Redes ——— */
  'tx.yourCopy': { es: 'Tu copy', en: 'Your copy' },
  'tx.copyPh': {
    es: 'Escribe o pega aquí el texto de tu publicación…',
    en: 'Write or paste the text of your post here…',
  },
  'tx.toolbarNote': {
    es: 'Selecciona un fragmento y toca un estilo de la barra: solo esa parte cambia. Para cambiarlo, vuelve a seleccionarlo y toca el nuevo estilo.',
    en: 'Select a fragment and tap a style in the toolbar: only that part changes. To change it, select it again and tap the new style.',
  },
  'tx.emojiHint': {
    es: 'Toca un emoji para insertarlo en el cursor',
    en: 'Tap an emoji to insert it at the cursor',
  },
  'tx.copy': { es: 'Copiar texto', en: 'Copy text' },
  'tx.copied': { es: '¡Copiado!', en: 'Copied!' },
  'tx.clear': { es: 'Limpiar', en: 'Clear' },
  'tx.how': { es: 'Cómo funciona', en: 'How it works' },
  'tx.how1': {
    es: 'Usa la barra de herramientas: selecciona un fragmento del texto y toca un estilo — solo esa parte cambia, el resto queda igual.',
    en: 'Use the toolbar: select a fragment of text and tap a style — only that part changes, the rest stays the same.',
  },
  'tx.how2': {
    es: '¿Quieres otro estilo en el mismo fragmento? Vuelve a seleccionarlo y toca el nuevo: se reemplaza sin problema. Combina varios estilos en un mismo copy.',
    en: 'Want a different style on the same fragment? Select it again and tap the new one: it gets replaced cleanly. Combine several styles in a single copy.',
  },
  'tx.how3': {
    es: 'Cuando esté listo, toca «Copiar texto» y pégalo en Instagram, X, TikTok, LinkedIn o WhatsApp — el formato se conserva.',
    en: 'When it\'s ready, tap "Copy text" and paste it into Instagram, X, TikTok, LinkedIn or WhatsApp — the formatting is preserved.',
  },
  'tx.a11y': {
    es: 'úsalos con moderación — los lectores de pantalla no siempre interpretan bien estos caracteres. Ideal para titulares y frases cortas.',
    en: 'use them sparingly — screen readers don\'t always interpret these characters well. Best for headlines and short phrases.',
  },
  'tx.a11yTitle': { es: 'Tip de accesibilidad:', en: 'Accessibility tip:' },
  'tx.generations': { es: 'Escribe para cada generación', en: 'Write for every generation' },
  'tx.genIntro': {
    es: 'El mismo mensaje no funciona igual para todos. Ajusta el lenguaje de tu copy según la generación a la que le hablas:',
    en: 'The same message doesn\'t work for everyone. Adjust your copy\'s language to the generation you\'re speaking to:',
  },
  'tx.g1.name': { es: 'Baby Boomers', en: 'Baby Boomers' },
  'tx.g1.years': { es: '1946–1964', en: '1946–1964' },
  'tx.g1.tip': {
    es: 'Buscan claridad y confianza: frases completas, buena ortografía y beneficios concretos. Evita la jerga, los memes y el exceso de emojis.',
    en: 'They value clarity and trust: full sentences, good spelling and concrete benefits. Avoid jargon, memes and emoji overload.',
  },
  'tx.g2.name': { es: 'Generación X', en: 'Generation X' },
  'tx.g2.years': { es: '1965–1980', en: '1965–1980' },
  'tx.g2.tip': {
    es: 'Prácticos y escépticos: sé directo, honesto y sin exageraciones. Funcionan los datos, las comparaciones y el humor sutil.',
    en: 'Practical and skeptical: be direct, honest and avoid hype. Data, comparisons and subtle humor work well.',
  },
  'tx.g3.name': { es: 'Millennials', en: 'Millennials' },
  'tx.g3.years': { es: '1981–1996', en: '1981–1996' },
  'tx.g3.tip': {
    es: 'Conectan con la autenticidad y el propósito: cuenta historias, muestra el por qué de tu marca y usa un tono cercano pero profesional.',
    en: 'They connect with authenticity and purpose: tell stories, show your brand\'s why and keep a warm but professional tone.',
  },
  'tx.g4.name': { es: 'Generación Z · Centennials', en: 'Gen Z · Centennials' },
  'tx.g4.years': { es: '1997–2012', en: '1997–2012' },
  'tx.g4.tip': {
    es: 'Ultra-directos y visuales: frases cortas, humor, emojis y lenguaje inclusivo. Huyen de todo lo que suena a publicidad tradicional.',
    en: 'Ultra-direct and visual: short phrases, humor, emojis and inclusive language. They run from anything that sounds like traditional advertising.',
  },
  'tx.g5.name': { es: 'Generación Alpha', en: 'Generation Alpha' },
  'tx.g5.years': { es: '2013 en adelante', en: '2013 onwards' },
  'tx.g5.tip': {
    es: 'Nativos digitales: contenido breve, visual e interactivo. Ten en cuenta que la compra suele decidirla un adulto de la casa.',
    en: 'Digital natives: short, visual, interactive content. Keep in mind the purchase is usually decided by an adult at home.',
  },
  'tx.genNote': {
    es: 'Combínalo con los estilos y emojis de la barra: manuscrita o burbujas para audiencias jóvenes, serif para un tono más formal.',
    en: 'Combine it with the styles and emojis in the toolbar: script or bubbles for younger audiences, serif for a more formal tone.',
  },

  /* ——— Orden de servicio (QuoteModal) ——— */
  'quote.title': { es: 'ORDEN DE SERVICIO', en: 'SERVICE ORDER' },
  'quote.service': { es: 'SERVICIO', en: 'SERVICE' },
  'quote.defaultService': { es: 'Servicio profesional', en: 'Professional service' },
  'quote.amount': { es: 'MONTO ACORDADO', en: 'AGREED AMOUNT' },
  'quote.itemN': { es: 'Monto {n}', en: 'Amount {n}' },
  'quote.usdNote': {
    es: 'Montos expresados en dólares (USD)',
    en: 'Amounts expressed in US dollars (USD)',
  },
  'quote.fxNote': { es: 'Tasa de cambio: Bs. {r} / USD', en: 'Exchange rate: Bs. {r} / USD' },
  'quote.base': { es: 'Base imponible', en: 'Taxable base' },
  'quote.total': { es: 'TOTAL A FACTURAR', en: 'TOTAL TO INVOICE' },
  'quote.madeWith': {
    es: 'Emitido con AD·Tools — Herramientas para emprendedores',
    en: 'Made with AD·Tools — Tools for entrepreneurs',
  },
  'quote.footerUsd': {
    es: 'Para el equivalente en bolívares, aplica la tasa de cambio vigente al momento de facturar.',
    en: 'For the bolívar equivalent, apply the exchange rate in effect at invoicing time.',
  },
  'quote.footerBs': {
    es: 'Los montos en bolívares se calculan según la tasa indicada al momento de emisión.',
    en: 'Bolívar amounts are calculated at the rate indicated at issuance time.',
  },
  'quote.modalTitle': { es: 'Tu orden de servicio', en: 'Your service order' },
  'quote.download': { es: 'Descargar como PNG', en: 'Download as PNG' },
  'quote.modalNote': {
    es: 'Lista para enviar por WhatsApp o adjuntar al correo de tu cliente',
    en: 'Ready to send via WhatsApp or attach to your client\'s email',
  },

  /* ——— Ticket (TicketModal) ——— */
  'ticket.title': { es: 'TICKET DE SERVICIO', en: 'SERVICE TICKET' },
  'ticket.client': { es: 'CONTRATANTE', en: 'CLIENT' },
  'ticket.provider': { es: 'PRESTADOR', en: 'PROVIDER' },
  'ticket.items': { es: 'ÍTEMS DEL SERVICIO', en: 'SERVICE ITEMS' },
  'ticket.noItems': { es: 'Sin ítems definidos', en: 'No items defined' },
  'ticket.scheme': { es: 'ESQUEMA DE PAGO', en: 'PAYMENT SCHEME' },
  'ticket.total': { es: 'TOTAL ACORDADO', en: 'AGREED TOTAL' },
  'ticket.milestones': { es: 'HITOS DE PAGO', en: 'PAYMENT MILESTONES' },
  'ticket.single': { es: 'Pago único contra entrega', en: 'Single payment upon delivery' },
  'ticket.madeWith': {
    es: 'Emitido con AD·Tools — Herramientas para emprendedores',
    en: 'Made with AD·Tools — Tools for entrepreneurs',
  },
  'ticket.disclaimer': {
    es: 'Este ticket resume el acuerdo entre las partes; no sustituye un contrato legal.',
    en: 'This ticket summarizes the agreement between the parties; it is not a substitute for a legal contract.',
  },
  'ticket.modalTitle': { es: 'Tu ticket de servicio', en: 'Your service ticket' },
  'ticket.modalNote': {
    es: 'Listo para enviar por WhatsApp o adjuntar al correo del prestador',
    en: 'Ready to send via WhatsApp or attach to the provider\'s email',
  },
  'ticket.download': { es: 'Descargar como PNG', en: 'Download as PNG' },
  'ticket.milestoneN': { es: 'Hito {n}', en: 'Milestone {n}' },

  /* ——— Documento (DocumentModal) ——— */
  'doc.parties': {
    es: 'Entre {client}, en adelante «el Cliente», y {provider}, en adelante «el Prestador», se acuerda la prestación del servicio descrito bajo las siguientes condiciones:',
    en: 'Between {client}, hereinafter "the Client", and {provider}, hereinafter "the Provider", the provision of the service described is agreed under the following conditions:',
  },
  'doc.noItems': { es: '(Sin ítems definidos)', en: '(No items defined)' },
  'doc.single': {
    es: 'Pago único contra entrega del servicio.',
    en: 'Single payment upon delivery of the service.',
  },
  'doc.legal': {
    es: 'Ambas partes declaran estar de acuerdo con lo aquí descrito. Este documento resume los términos acordados y no sustituye asesoría legal profesional.',
    en: 'Both parties declare their agreement with what is described here. This document summarizes the agreed terms and is not a substitute for professional legal advice.',
  },
  'doc.modalTitle': { es: 'Tu acuerdo de servicios', en: 'Your service agreement' },
  'doc.modalNote': {
    es: 'Documento completo, listo para firmar o compartir',
    en: 'Complete document, ready to sign or share',
  },
  'doc.download': { es: 'Descargar como PNG', en: 'Download as PNG' },
}
