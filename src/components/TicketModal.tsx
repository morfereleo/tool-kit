import { useEffect, useRef, useState } from 'react'
import { fmt } from '@/lib/format'

export type TicketMilestone = { name: string; amount: number; when: string }

export type TicketData = {
  client: string
  provider: string
  items: string[]
  schemeLabel: string
  perPaymentLabel: string
  total: number
  milestones: TicketMilestone[]
}

const INK = '#1C1917'
const LINE = '#E7E5E0'
const MUTED = '#78716C'
const ACCENT = '#DB2777'

const SANS = '"Space Grotesk", system-ui, sans-serif'
const MONO = '"IBM Plex Mono", ui-monospace, monospace'

const W = 760
const PAD = 48

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    if (line && ctx.measureText(line + ' ' + w).width > maxWidth) {
      lines.push(line)
      line = w
    } else {
      line = line ? line + ' ' + w : w
    }
  }
  if (line) lines.push(line)
  return lines.length ? lines : ['']
}

/** Renders the ticket; when draw=false only measures and returns the final height. */
function layout(ctx: CanvasRenderingContext2D, d: TicketData, draw: boolean): number {
  let y = 0

  if (draw) {
    ctx.fillStyle = '#FBFAF7'
    ctx.fillRect(0, 0, W, 4000)
    ctx.fillStyle = ACCENT
    ctx.fillRect(0, 0, W, 14)
  }

  const text = (
    str: string,
    x: number,
    yy: number,
    font: string,
    color: string,
    align: CanvasTextAlign = 'left',
  ) => {
    if (!draw) return
    ctx.font = font
    ctx.fillStyle = color
    ctx.textAlign = align
    ctx.fillText(str, x, yy)
    ctx.textAlign = 'left'
  }

  const hline = (yy: number) => {
    if (!draw) return
    ctx.strokeStyle = LINE
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(PAD, yy)
    ctx.lineTo(W - PAD, yy)
    ctx.stroke()
  }

  // ——— header ———
  y = 88
  text('TICKET DE SERVICIO', PAD, y, `700 32px ${SANS}`, INK)
  text('AD·TOOLS', W - PAD, y, `500 13px ${MONO}`, MUTED, 'right')
  y += 28
  const date = new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' })
  text(date.toUpperCase(), PAD, y, `500 13px ${MONO}`, MUTED)
  y += 28
  hline(y)

  // ——— partes ———
  y += 42
  text('CONTRATANTE', PAD, y, `500 11px ${MONO}`, MUTED)
  text('PRESTADOR', W / 2 + 16, y, `500 11px ${MONO}`, MUTED)
  y += 28
  const clientLines = wrapLines(ctx, d.client || '—', W / 2 - PAD - 16)
  const providerLines = wrapLines(ctx, d.provider || '—', W / 2 - PAD - 16)
  const nameFont = `600 20px ${SANS}`
  if (draw) ctx.font = nameFont
  clientLines.forEach((l, i) => text(l, PAD, y + i * 26, nameFont, INK))
  providerLines.forEach((l, i) => text(l, W / 2 + 16, y + i * 26, nameFont, ACCENT))
  y += Math.max(clientLines.length, providerLines.length) * 26 + 24
  hline(y)

  // ——— ítems ———
  y += 42
  text('ÍTEMS DEL SERVICIO', PAD, y, `500 11px ${MONO}`, MUTED)
  y += 30
  const itemFont = `500 15px ${SANS}`
  if (draw) ctx.font = itemFont
  if (d.items.length === 0) {
    text('Sin ítems definidos', PAD, y, itemFont, MUTED)
    y += 30
  } else {
    d.items.forEach((item, i) => {
      const lines = wrapLines(ctx, item, W - PAD * 2 - 44)
      lines.forEach((l, li) => {
        if (li === 0) text(`${String(i + 1).padStart(2, '0')}`, PAD, y, `500 13px ${MONO}`, ACCENT)
        text(l, PAD + 44, y, itemFont, INK)
        y += 24
      })
      y += 6
    })
  }
  y += 18
  hline(y)

  // ——— esquema de pago ———
  y += 42
  text('ESQUEMA DE PAGO', PAD, y, `500 11px ${MONO}`, MUTED)
  y += 30
  const schemeLines = wrapLines(ctx, d.schemeLabel, W - PAD * 2)
  if (draw) ctx.font = `600 18px ${SANS}`
  schemeLines.forEach((l) => {
    text(l, PAD, y, `600 18px ${SANS}`, INK)
    y += 26
  })
  if (d.perPaymentLabel) {
    y += 2
    text(d.perPaymentLabel, PAD, y, `500 13px ${MONO}`, MUTED)
    y += 26
  }
  y += 8
  text('TOTAL ACORDADO', PAD, y, `500 11px ${MONO}`, MUTED)
  text(`$ ${fmt(d.total)}`, W - PAD, y + 8, `700 26px ${MONO}`, INK, 'right')
  y += 44
  hline(y)

  // ——— hitos ———
  y += 42
  text('HITOS DE PAGO', PAD, y, `500 11px ${MONO}`, MUTED)
  y += 26
  if (d.milestones.length === 0) {
    text('Pago único contra entrega', PAD, y, `500 15px ${SANS}`, MUTED)
    y += 34
  } else {
    d.milestones.forEach((m, i) => {
      y += 22
      text(`${String(i + 1).padStart(2, '0')}`, PAD, y, `500 13px ${MONO}`, ACCENT)
      const nameLines = wrapLines(ctx, m.name || `Hito ${i + 1}`, W - PAD * 2 - 200)
      if (draw) ctx.font = `600 15px ${SANS}`
      nameLines.forEach((l, li) => text(l, PAD + 40, y + li * 22, `600 15px ${SANS}`, INK))
      text(`$ ${fmt(m.amount)}`, W - PAD, y, `600 16px ${MONO}`, INK, 'right')
      y += (nameLines.length - 1) * 22 + 22
      if (m.when) {
        text(m.when, PAD + 40, y, `500 12px ${MONO}`, MUTED)
        y += 20
      }
      y += 10
      if (i < d.milestones.length - 1) hline(y)
    })
    y += 12
  }

  // ——— footer ———
  y += 30
  text('Emitido con AD·Tools — Herramientas para emprendedores', PAD, y, `500 11px ${MONO}`, MUTED)
  y += 22
  text('Este ticket resume el acuerdo entre las partes; no sustituye un contrato legal.', PAD, y, `500 11px ${MONO}`, MUTED)
  y += 36

  // dashed bottom edge
  if (draw) {
    ctx.strokeStyle = LINE
    ctx.setLineDash([6, 6])
    ctx.beginPath()
    ctx.moveTo(PAD, y - 10)
    ctx.lineTo(W - PAD, y - 10)
    ctx.stroke()
    ctx.setLineDash([])
  }

  return y + 10
}

const drawTicket = (canvas: HTMLCanvasElement, d: TicketData) => {
  // pass 1: measure
  const measure = document.createElement('canvas')
  measure.width = W
  measure.height = 100
  const mctx = measure.getContext('2d')!
  const h = layout(mctx, d, false)

  // pass 2: draw
  canvas.width = W * 2
  canvas.height = h * 2
  const ctx = canvas.getContext('2d')!
  ctx.scale(2, 2)
  layout(ctx, d, true)
}

export function TicketModal({ data, onClose }: { data: TicketData; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [url, setUrl] = useState('')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawTicket(canvas, data)
    setUrl(canvas.toDataURL('image/png'))
  }, [data])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const download = () => {
    const a = document.createElement('a')
    a.href = url
    a.download = `ticket-de-servicio-${Date.now()}.png`
    a.click()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-3xl bg-paper shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div>
            <h3 className="font-grotesk text-lg font-bold">Tu ticket de servicio</h3>
            <p className="text-xs text-inkmuted">Listo para enviar por WhatsApp o adjuntar al correo del prestador</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-inkmuted transition-colors hover:bg-paper hover:text-ink"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto bg-paper p-6">
          <canvas ref={canvasRef} className="mx-auto w-full max-w-md rounded-xl shadow-lg" />
        </div>

        <div className="border-t border-line p-4">
          <button
            onClick={download}
            className="w-full rounded-full py-3.5 font-grotesk text-sm font-bold text-white transition-transform hover:scale-[1.01] active:scale-[0.99]"
            style={{ backgroundColor: ACCENT }}
          >
            Descargar como PNG
          </button>
        </div>
      </div>
    </div>
  )
}
