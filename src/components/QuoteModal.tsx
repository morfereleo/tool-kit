import { useEffect, useRef, useState } from 'react'
import { fmt } from '@/lib/format'

export type QuoteData = {
  service: string
  amountUSD: number
  rateBs: number
  subtotalBs: number
  taxBs: number
  totalBs: number
  taxName: string
  taxRate: number
}

const INK = '#1C1917'
const LINE = '#E7E5E0'
const MUTED = '#78716C'
const ACCENT = '#2F4BFF'

const draw = (canvas: HTMLCanvasElement, d: QuoteData) => {
  const W = 760
  const H = 820
  canvas.width = W * 2
  canvas.height = H * 2
  const ctx = canvas.getContext('2d')!
  ctx.scale(2, 2)

  // paper
  ctx.fillStyle = '#FBFAF7'
  ctx.fillRect(0, 0, W, H)

  // accent bar
  ctx.fillStyle = ACCENT
  ctx.fillRect(0, 0, W, 14)

  const sans = '"Space Grotesk", system-ui, sans-serif'
  const mono = '"IBM Plex Mono", ui-monospace, monospace'

  // header
  ctx.fillStyle = INK
  ctx.font = `700 34px ${sans}`
  ctx.fillText('ORDEN DE SERVICIO', 48, 88)

  ctx.font = `500 13px ${mono}`
  ctx.fillStyle = MUTED
  const date = new Date().toLocaleDateString('es-VE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  ctx.fillText(date.toUpperCase(), 48, 116)
  ctx.textAlign = 'right'
  ctx.fillText('AD·TOOLS', W - 48, 88)
  ctx.textAlign = 'left'

  // divider
  ctx.strokeStyle = LINE
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(48, 144)
  ctx.lineTo(W - 48, 144)
  ctx.stroke()

  // service
  ctx.font = `500 11px ${mono}`
  ctx.fillStyle = MUTED
  ctx.fillText('SERVICIO', 48, 186)
  ctx.font = `600 26px ${sans}`
  ctx.fillStyle = INK
  const service = d.service.trim() || 'Servicio profesional'
  // simple word wrap
  const words = service.split(' ')
  let line = ''
  let y = 222
  for (const w of words) {
    if (ctx.measureText(line + w).width > W - 96) {
      ctx.fillText(line, 48, y)
      line = ''
      y += 34
    }
    line += w + ' '
  }
  ctx.fillText(line.trim(), 48, y)
  const serviceBottom = y + 40

  // amounts in USD
  ctx.strokeStyle = LINE
  ctx.beginPath()
  ctx.moveTo(48, serviceBottom)
  ctx.lineTo(W - 48, serviceBottom)
  ctx.stroke()

  ctx.font = `500 11px ${mono}`
  ctx.fillStyle = MUTED
  ctx.fillText('MONTO ACORDADO', 48, serviceBottom + 36)
  ctx.font = `600 40px ${mono}`
  ctx.fillStyle = INK
  ctx.fillText(`$ ${fmt(d.amountUSD)}`, 48, serviceBottom + 80)

  const usd = d.rateBs <= 1
  const cur = usd ? '$' : 'Bs.'

  ctx.font = `500 13px ${mono}`
  ctx.fillStyle = MUTED
  ctx.fillText(
    usd ? 'Montos expresados en dólares (USD)' : `Tasa de cambio: Bs. ${fmt(d.rateBs)} / USD`,
    48, serviceBottom + 112,
  )

  // breakdown box
  const boxY = serviceBottom + 140
  ctx.fillStyle = '#FFFFFF'
  ctx.strokeStyle = LINE
  ctx.beginPath()
  ctx.roundRect(48, boxY, W - 96, 220, 14)
  ctx.fill()
  ctx.stroke()

  const rows: [string, string, string][] = [
    ['Base imponible', `${cur} ${fmt(d.subtotalBs)}`, MUTED],
    [`${d.taxName} (${d.taxRate}%)`, `${cur} ${fmt(d.taxBs)}`, ACCENT],
  ]
  rows.forEach(([label, value, color], i) => {
    const ry = boxY + 52 + i * 52
    ctx.font = `500 15px ${sans}`
    ctx.fillStyle = MUTED
    ctx.fillText(label, 76, ry)
    ctx.textAlign = 'right'
    ctx.font = `600 18px ${mono}`
    ctx.fillStyle = color
    ctx.fillText(value, W - 76, ry)
    ctx.textAlign = 'left'
  })

  // total row
  ctx.strokeStyle = LINE
  ctx.beginPath()
  ctx.moveTo(76, boxY + 148)
  ctx.lineTo(W - 76, boxY + 148)
  ctx.stroke()
  ctx.font = `700 13px ${sans}`
  ctx.fillStyle = INK
  ctx.fillText('TOTAL A FACTURAR', 76, boxY + 192)
  ctx.textAlign = 'right'
  ctx.font = `700 30px ${mono}`
  ctx.fillText(`${cur} ${fmt(d.totalBs)}`, W - 76, boxY + 192)
  ctx.textAlign = 'left'

  // footer
  ctx.font = `500 11px ${mono}`
  ctx.fillStyle = MUTED
  ctx.fillText('Emitido con AD·Tools — Herramientas para emprendedores', 48, H - 88)
  ctx.fillText(
    usd
      ? 'Para el equivalente en bolívares, aplica la tasa de cambio vigente al momento de facturar.'
      : 'Los montos en bolívares se calculan según la tasa indicada al momento de emisión.',
    48, H - 66,
  )

  // dashed bottom
  ctx.strokeStyle = LINE
  ctx.setLineDash([6, 6])
  ctx.beginPath()
  ctx.moveTo(48, H - 40)
  ctx.lineTo(W - 48, H - 40)
  ctx.stroke()
  ctx.setLineDash([])
}

export default function QuoteModal({
  data,
  onClose,
}: {
  data: QuoteData
  onClose: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    draw(canvas, data)
    setReady(true)
  }, [data])

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onEsc)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const download = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `orden-de-servicio-${Date.now()}.png`
    a.click()
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-paper shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <p className="font-grotesk text-lg font-bold tracking-tight">Tu orden de servicio</p>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-inkmuted transition-colors hover:bg-line hover:text-ink"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        <div className="p-5">
          <canvas ref={canvasRef} className="w-full rounded-xl border border-line" />
          <button
            onClick={download}
            disabled={!ready}
            className="mt-5 w-full rounded-full py-4 text-sm font-semibold text-white transition-opacity disabled:opacity-30"
            style={{ backgroundColor: ACCENT }}
          >
            Descargar como PNG
          </button>
          <p className="mt-3 text-center font-mono text-[11px] text-inkmuted">
            Lista para enviar por WhatsApp o adjuntar al correo de tu cliente
          </p>
        </div>
      </div>
    </div>
  )
}
