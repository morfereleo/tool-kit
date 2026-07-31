import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import BrandShell from '@/components/BrandShell'
import { TOOLS } from '@/lib/tools'

const tool = TOOLS[3]
const ACCENT = tool.accent

const SWATCHES = ['#1C1917', '#2F4BFF', '#00965E', '#7C3AED', '#FF5A1F', '#B45309']
const BG_SWATCHES = ['#FFFFFF', '#FBFAF7', '#F5F5F4', '#FFF7E6']

const SIZES = [256, 512, 1024]

/* ————— Plantillas (pares código/fondo listos para usar) ————— */
const TEMPLATES: { name: string; fg: string; bg: string }[] = [
  { name: 'Clásico', fg: '#1C1917', bg: '#FFFFFF' },
  { name: 'Sepia', fg: '#292119', bg: '#F7F2E9' },
  { name: 'Cobalto', fg: '#2F4BFF', bg: '#FFFFFF' },
  { name: 'Bosque', fg: '#0B6B4F', bg: '#F2FBF6' },
  { name: 'Violeta', fg: '#6D28D9', bg: '#FBF7FF' },
  { name: 'Naranja', fg: '#EA4A0F', bg: '#FFF7E6' },
]

/* ————— Contraste código/fondo (luminancia relativa WCAG) ————— */
const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const relLum = (hex: string): number => {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const contrastRatio = (a: string, b: string): number => {
  const [l1, l2] = [relLum(a), relLum(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

export default function QrPage() {
  const [text, setText] = useState('https://alejandrodanieles.com')
  const [fg, setFg] = useState('#1C1917')
  const [bg, setBg] = useState('#FFFFFF')
  const [size, setSize] = useState(512)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState('')
  // logo centrado (opcional)
  const [logo, setLogo] = useState<HTMLImageElement | null>(null)
  const [logoName, setLogoName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const contrast = contrastRatio(fg, bg)
  const activeTemplate = TEMPLATES.find((t) => t.fg === fg && t.bg === bg)

  /* Caja blanca + logo en el centro (canvas ya renderizado) */
  const drawLogo = (canvas: HTMLCanvasElement, img: HTMLImageElement) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const s = canvas.width
    const box = Math.round(s * 0.22)
    const pad = Math.round(box * 0.18)
    const x = (s - box) / 2
    const r = Math.round(box * 0.25)
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.roundRect(x - pad, x - pad, box + pad * 2, box + pad * 2, r)
    ctx.fill()
    const scale = Math.min(box / img.naturalWidth, box / img.naturalHeight)
    const w = img.naturalWidth * scale
    const h = img.naturalHeight * scale
    ctx.drawImage(img, (s - w) / 2, (s - h) / 2, w, h)
  }

  const onLogoFile = (f: File | undefined) => {
    if (!f || !f.type.startsWith('image/')) return
    const url = URL.createObjectURL(f)
    const img = new Image()
    img.onload = () => {
      if (logoUrl) URL.revokeObjectURL(logoUrl)
      setLogo(img)
      setLogoName(f.name)
      setLogoUrl(url)
    }
    img.src = url
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (!text.trim()) {
      const ctx = canvas.getContext('2d')
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
      return
    }
    QRCode.toCanvas(canvas, text, {
      width: size,
      margin: 2,
      color: { dark: fg, light: bg },
      // con logo usamos corrección alta (H): tolera ~30% de área cubierta
      errorCorrectionLevel: logo ? 'H' : 'M',
    })
      .then(() => {
        setError('')
        if (logo) drawLogo(canvas, logo)
      })
      .catch(() => setError('El contenido es demasiado largo para un solo QR.'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, fg, bg, size, logo])

  const downloadPng = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = 'qr.png'
    a.click()
  }

  /* Logo como PNG embebido para el SVG */
  const logoDataUrl = (img: HTMLImageElement): string => {
    const c = document.createElement('canvas')
    const MAX = 256
    const scale = Math.min(MAX / img.naturalWidth, MAX / img.naturalHeight, 1)
    c.width = Math.round(img.naturalWidth * scale)
    c.height = Math.round(img.naturalHeight * scale)
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
    return c.toDataURL('image/png')
  }

  const downloadSvg = async () => {
    if (!text.trim()) return
    let svg = await QRCode.toString(text, {
      type: 'svg',
      width: size,
      margin: 2,
      color: { dark: fg, light: bg },
      errorCorrectionLevel: logo ? 'H' : 'M',
    })
    if (logo) {
      const box = size * 0.22
      const pad = box * 0.18
      const x = (size - box) / 2
      const scale = Math.min(box / logo.naturalWidth, box / logo.naturalHeight)
      const w = logo.naturalWidth * scale
      const h = logo.naturalHeight * scale
      const lx = (size - w) / 2
      const ly = (size - h) / 2
      const inject =
        `<rect x="${x - pad}" y="${x - pad}" width="${box + pad * 2}" height="${box + pad * 2}" rx="${box * 0.25}" fill="#FFFFFF"/>` +
        `<image href="${logoDataUrl(logo)}" x="${lx}" y="${ly}" width="${w}" height="${h}"/>`
      svg = svg.replace('</svg>', `${inject}</svg>`)
    }
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'qr.svg'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <BrandShell tool={tool}>
      <section className="mx-auto grid max-w-6xl md:grid-cols-2">
        <div className="border-b border-line px-5 py-10 md:border-b-0 md:border-r md:px-8 md:py-14">
          <label className="field-label">Contenido del QR</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="URL, texto, WhatsApp, WiFi…"
            className="field-box resize-none font-mono text-sm"
          />
          <p className="mt-2 font-mono text-[11px] text-inkmuted">
            Tip: para WhatsApp usa https://wa.me/584121234567
          </p>

          <div className="mt-8">
            <label className="field-label">Plantillas</label>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {TEMPLATES.map((t) => {
                const active = activeTemplate?.name === t.name
                return (
                  <button
                    key={t.name}
                    onClick={() => {
                      setFg(t.fg)
                      setBg(t.bg)
                    }}
                    className={`rounded-xl border p-2 text-center transition-all hover:-translate-y-0.5 ${
                      active ? 'border-transparent ring-2 ring-ink' : 'border-line hover:border-inkmuted'
                    }`}
                  >
                    <span
                      className="flex h-11 items-center justify-center rounded-lg border border-line/60"
                      style={{ backgroundColor: t.bg }}
                    >
                      <span className="grid grid-cols-2 gap-[3px]">
                        <span className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: t.fg }} />
                        <span className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: t.fg }} />
                        <span className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: t.fg }} />
                        <span className="h-2.5 w-2.5 rounded-[2px] opacity-30" style={{ backgroundColor: t.fg }} />
                      </span>
                    </span>
                    <span className="mt-1.5 block font-mono text-[10px] uppercase tracking-wider text-inksoft">
                      {t.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-8">
            <label className="field-label">Color del código{!activeTemplate && ' · personalizado'}</label>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  onClick={() => setFg(c)}
                  className={`h-9 w-9 rounded-full border-2 transition-transform hover:scale-110 ${
                    fg === c ? 'border-ink' : 'border-line'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
              <input
                type="color"
                value={fg}
                onChange={(e) => setFg(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded-full border border-line bg-transparent"
                title="Color libre"
              />
            </div>
          </div>

          <div className="mt-8">
            <label className="field-label">Color de fondo</label>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {BG_SWATCHES.map((c) => (
                <button
                  key={c}
                  onClick={() => setBg(c)}
                  className={`h-9 w-9 rounded-full border-2 transition-transform hover:scale-110 ${
                    bg === c ? 'border-ink' : 'border-line'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
              <input
                type="color"
                value={bg}
                onChange={(e) => setBg(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded-full border border-line bg-transparent"
                title="Color libre"
              />
            </div>
          </div>

          <div className="mt-8">
            <label className="field-label">Logo en el centro · opcional</label>
            <div className="mt-3">
              {logo ? (
                <div className="flex items-center gap-3 rounded-xl border border-line p-2.5">
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="h-11 w-11 rounded-lg border border-line bg-white object-contain p-1"
                  />
                  <span className="min-w-0 flex-1 truncate font-mono text-xs text-inksoft">{logoName}</span>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="rounded-full border border-line px-3.5 py-1.5 font-mono text-[11px] text-inksoft transition-colors hover:border-ink hover:text-ink"
                  >
                    Cambiar
                  </button>
                  <button
                    onClick={() => {
                      setLogo(null)
                      setLogoName('')
                      if (logoUrl) URL.revokeObjectURL(logoUrl)
                      setLogoUrl('')
                      if (fileRef.current) fileRef.current.value = ''
                    }}
                    className="rounded-full border border-line px-3.5 py-1.5 font-mono text-[11px] text-inksoft transition-colors hover:border-red-400 hover:text-red-600"
                  >
                    Quitar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-dashed border-inkmuted/50 px-4 py-5 text-inksoft transition-colors hover:border-ink hover:text-ink"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <path d="M12 8v8M8 12h8" strokeLinecap="round" />
                  </svg>
                  <span className="text-sm font-medium">Subir tu logo</span>
                  <span className="font-mono text-[10px] text-inkmuted">PNG · JPG · SVG</span>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onLogoFile(e.target.files?.[0])}
              />
              {logo && (
                <p className="mt-2 font-mono text-[11px] leading-relaxed text-inkmuted">
                  * Va sobre una caja blanca con corrección de errores alta — escanéalo
                  antes de imprimirlo.
                </p>
              )}
            </div>
          </div>

          <div className="mt-8">
            <label className="field-label">Tamaño de exportación</label>
            <div className="mt-3 flex gap-2">
              {SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`rounded-full border px-5 py-2 font-mono text-sm transition-all ${
                    size === s ? 'border-transparent text-white' : 'border-line text-inksoft hover:text-ink'
                  }`}
                  style={size === s ? { backgroundColor: ACCENT } : undefined}
                >
                  {s}px
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* PREVIEW */}
        <div className="flex flex-col px-5 py-10 md:px-8 md:py-14">
          <p className="field-label">Vista previa</p>
          <div
            className="mt-4 flex flex-1 items-center justify-center rounded-2xl border border-line p-8"
            style={{
              backgroundImage:
                'repeating-conic-gradient(#F5F5F4 0% 25%, transparent 0% 50%)',
              backgroundSize: '20px 20px',
            }}
          >
            <div className="aspect-square w-full max-w-[292px] rounded-xl border border-line bg-white p-4 shadow-sm">
              <canvas ref={canvasRef} className="block aspect-square h-auto w-full" />
            </div>
          </div>

          {error && <p className="mt-3 font-mono text-xs text-red-600">{error}</p>}

          {text.trim() && !error && (
            <div
              className="mt-4 flex items-start gap-3 rounded-xl border px-4 py-3"
              style={
                contrast >= 4
                  ? { borderColor: '#00965E33', backgroundColor: '#00965E0D', color: '#00965E' }
                  : contrast >= 2.5
                    ? { borderColor: '#F5B3014D', backgroundColor: '#F5B30114', color: '#B45309' }
                    : { borderColor: '#DC262633', backgroundColor: '#DC26260D', color: '#DC2626' }
              }
            >
              <span className="mt-px font-mono text-sm leading-none">
                {contrast >= 4 ? '✓' : '⚠'}
              </span>
              <p className="font-mono text-[11px] leading-relaxed">
                {contrast >= 4 ? (
                  <>Contraste óptimo ({contrast.toFixed(1)}:1) — se escaneará sin problema.</>
                ) : contrast >= 2.5 ? (
                  <>
                    Contraste bajo ({contrast.toFixed(1)}:1) — algunos lectores podrían fallar.
                    Oscurece el código o aclara el fondo para superar 4:1, y escanéalo antes de imprimir.
                  </>
                ) : (
                  <>
                    Contraste muy bajo ({contrast.toFixed(1)}:1) — es casi seguro que no escanee.
                    Elige una plantilla o aumenta la diferencia entre código y fondo.
                  </>
                )}
              </p>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={downloadPng}
              disabled={!text.trim()}
              className="flex-1 rounded-full py-3.5 text-sm font-semibold text-white transition-opacity disabled:opacity-30"
              style={{ backgroundColor: ACCENT }}
            >
              Descargar PNG
            </button>
            <button
              onClick={downloadSvg}
              disabled={!text.trim()}
              className="flex-1 rounded-full border border-ink py-3.5 text-sm font-semibold transition-colors hover:bg-ink hover:text-paper disabled:opacity-30"
            >
              Descargar SVG
            </button>
          </div>
          <p className="mt-4 font-mono text-[11px] leading-relaxed text-inkmuted">
            * El SVG es vectorial: ideal para imprenta, tarjetas y vallas sin
            perder nitidez. Verifica siempre el QR escaneándolo antes de mandarlo
            a producción.
          </p>
        </div>
      </section>
    </BrandShell>
  )
}
