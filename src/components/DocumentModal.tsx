import { useEffect, useRef, useState } from 'react'
import { fmt } from '@/lib/format'

export type DocumentData = {
  client: string
  clientId: string
  provider: string
  providerId: string
  date: string
  items: string[]
  schemeLabel: string
  perPaymentLabel: string
  total: number
  milestones: { name: string; amount: number; when: string }[]
}

const ACCENT = '#DB2777'
const INK = '#292119'
const SOFT = '#6B5F51'
const MUTED = '#A39783'
const LINE = '#E4DACA'
const PAPER = '#FFFFFF'
const S = 2 // escala retina

type Ctx = CanvasRenderingContext2D

function wrapText(ctx: Ctx, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = w
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

/** Dibuja el documento completo en canvas. Devuelve la altura total usada. */
function layout(ctx: Ctx, d: DocumentData, draw: boolean): number {
  const W = 820
  const M = 64 // margen lateral
  const CW = W - M * 2
  let y = M

  const text = (str: string, x: number, yy: number, font: string, color = INK, maxW = CW, lineH = 22) => {
    ctx.font = font
    ctx.fillStyle = color
    const lines = wrapText(ctx, str, maxW)
    if (draw) {
      lines.forEach((ln, i) => ctx.fillText(ln, x, yy + i * lineH))
    }
    return lines.length * lineH
  }

  // ——— encabezado ———
  if (draw) {
    ctx.fillStyle = ACCENT
    ctx.fillRect(0, 0, W, 10 * S)
  }
  y += 30
  y += text('ACUERDO DE PRESTACIÓN DE SERVICIOS', M, y, `700 ${15 * S}px "Space Grotesk", sans-serif`, INK, CW, 20 * S)
  y += 4
  ctx.font = `500 ${9 * S}px "IBM Plex Mono", monospace`
  ctx.fillStyle = MUTED
  if (draw) ctx.fillText(`${d.date.toUpperCase()} · AD·TOOLS`, M, y)
  y += 18 * S
  if (draw) {
    ctx.fillStyle = ACCENT
    ctx.fillRect(M, y, CW, 2 * S)
  }
  y += 22 * S

  // ——— partes ———
  const cName = d.client || 'el Contratante'
  const pName = d.provider || 'el Prestador'
  const parties = `Entre ${cName}${d.clientId ? ` (${d.clientId})` : ''}, en adelante «el Cliente», y ${pName}${d.providerId ? ` (${d.providerId})` : ''}, en adelante «el Prestador», se acuerda la prestación del servicio descrito bajo las siguientes condiciones:`
  ctx.font = `${10.5 * S}px "Space Grotesk", sans-serif`
  y += text(parties, M, y, `${10.5 * S}px "Space Grotesk", sans-serif`, SOFT, CW, 17 * S)
  y += 14 * S

  // ——— 1 · objeto ———
  const sectionTitle = (t: string, yy: number) => {
    ctx.font = `600 ${8.5 * S}px "IBM Plex Mono", monospace`
    ctx.fillStyle = ACCENT
    if (draw) ctx.fillText(t.toUpperCase(), M, yy)
    return 16 * S
  }
  y += sectionTitle('1 · Objeto del servicio', y)
  if (d.items.length === 0) {
    y += text('(Sin ítems definidos)', M, y, `italic ${10.5 * S}px "Space Grotesk", sans-serif`, MUTED, CW, 17 * S)
  } else {
    d.items.forEach((it, i) => {
      const num = `${String(i + 1).padStart(2, '0')}`
      ctx.font = `600 ${9 * S}px "IBM Plex Mono", monospace`
      ctx.fillStyle = ACCENT
      if (draw) ctx.fillText(num, M, y + 11 * S)
      const h = text(it, M + 28 * S, y + 11 * S, `${10.5 * S}px "Space Grotesk", sans-serif`, INK, CW - 28 * S, 16 * S)
      y += Math.max(h, 16 * S) + 3 * S
    })
  }
  y += 12 * S

  // ——— 2 · esquema ———
  y += sectionTitle('2 · Esquema de pago', y)
  y += text(`${d.schemeLabel}.`, M, y + 11 * S, `${10.5 * S}px "Space Grotesk", sans-serif`, INK, CW, 16 * S) + 6 * S
  if (d.perPaymentLabel) {
    y += text(d.perPaymentLabel, M, y + 4 * S, `500 ${9 * S}px "IBM Plex Mono", monospace`, MUTED, CW, 14 * S) + 4 * S
  }
  // total
  y += 8 * S
  if (draw) {
    ctx.strokeStyle = LINE
    ctx.lineWidth = 1 * S
    ctx.beginPath()
    ctx.moveTo(M, y)
    ctx.lineTo(M + CW, y)
    ctx.stroke()
  }
  y += 18 * S
  ctx.font = `600 ${8.5 * S}px "IBM Plex Mono", monospace`
  ctx.fillStyle = MUTED
  if (draw) ctx.fillText('TOTAL ACORDADO', M, y)
  ctx.font = `700 ${16 * S}px "IBM Plex Mono", monospace`
  ctx.fillStyle = INK
  if (draw) {
    const t = `$ ${fmt(d.total)}`
    ctx.fillText(t, M + CW - ctx.measureText(t).width, y + 2 * S)
  }
  y += 16 * S

  // ——— 3 · hitos ———
  y += sectionTitle('3 · Hitos de pago', y)
  if (d.milestones.length === 0) {
    y += text('Pago único contra entrega del servicio.', M, y + 11 * S, `italic ${10.5 * S}px "Space Grotesk", sans-serif`, MUTED, CW, 16 * S) + 6 * S
  } else {
    d.milestones.forEach((m, i) => {
      y += 13 * S
      ctx.font = `600 ${10 * S}px "Space Grotesk", sans-serif`
      ctx.fillStyle = INK
      const label = `${String(i + 1).padStart(2, '0')} · ${m.name || `Hito ${i + 1}`}`
      if (draw) ctx.fillText(label, M, y)
      ctx.font = `700 ${10 * S}px "IBM Plex Mono", monospace`
      const amt = `$ ${fmt(m.amount)}`
      if (draw) ctx.fillText(amt, M + CW - ctx.measureText(amt).width, y)
      y += 4 * S
      if (m.when) {
        y += text(m.when, M, y + 9 * S, `500 ${8.5 * S}px "IBM Plex Mono", monospace`, MUTED, CW - 90 * S, 12 * S) - 2 * S
      }
      y += 10 * S
      if (draw) {
        ctx.strokeStyle = LINE
        ctx.lineWidth = 1 * S
        ctx.beginPath()
        ctx.moveTo(M, y)
        ctx.lineTo(M + CW, y)
        ctx.stroke()
      }
      y += 6 * S
    })
  }
  y += 10 * S

  // ——— nota legal ———
  y += text(
    'Ambas partes declaran estar de acuerdo con lo aquí descrito. Este documento resume los términos acordados y no sustituye asesoría legal profesional.',
    M, y, `${9 * S}px "Space Grotesk", sans-serif`, MUTED, CW, 14 * S
  )
  y += 26 * S

  // ——— firmas ———
  const colW = (CW - 40 * S) / 2
  y += 30 * S
  if (draw) {
    ctx.strokeStyle = INK
    ctx.lineWidth = 1 * S
    ;[M, M + colW + 40 * S].forEach((x) => {
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + colW, y)
      ctx.stroke()
    })
  }
  y += 14 * S
  const sig = (x: number, role: string, name: string, idNum: string) => {
    ctx.font = `600 ${8 * S}px "IBM Plex Mono", monospace`
    ctx.fillStyle = MUTED
    if (draw) ctx.fillText(role, x, y)
    ctx.font = `600 ${10 * S}px "Space Grotesk", sans-serif`
    ctx.fillStyle = INK
    if (draw) ctx.fillText(name || '—', x, y + 14 * S)
    if (idNum) {
      ctx.font = `500 ${8.5 * S}px "IBM Plex Mono", monospace`
      ctx.fillStyle = MUTED
      if (draw) ctx.fillText(idNum, x, y + 27 * S)
    }
  }
  sig(M, 'EL CLIENTE', cName === 'el Contratante' ? '' : cName, d.clientId)
  sig(M + colW + 40 * S, 'EL PRESTADOR', pName === 'el Prestador' ? '' : pName, d.providerId)
  y += 36 * S

  return y + M * 0.6
}

export function DocumentModal({ data, onClose }: { data: DocumentData; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const W = 820
    const render = () => {
      // pase 1: medir
      const mCanvas = document.createElement('canvas')
      mCanvas.width = W * S
      const mCtx = mCanvas.getContext('2d')!
      mCtx.scale(S, S)
      const h = Math.ceil(layout(mCtx, data, false))
      setHeight(h)
      // pase 2: dibujar
      canvas.width = W * S
      canvas.height = h * S
      const ctx = canvas.getContext('2d')!
      ctx.scale(S, S)
      ctx.fillStyle = PAPER
      ctx.fillRect(0, 0, W, h)
      layout(ctx, data, true)
    }
    if (document.fonts?.ready) {
      document.fonts.ready.then(render)
    } else {
      render()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [data, onClose])

  const download = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const a = document.createElement('a')
    a.download = `acuerdo-de-servicios${data.provider ? `-${data.provider.toLowerCase().replace(/\s+/g, '-')}` : ''}.png`
    a.href = canvas.toDataURL('image/png')
    a.click()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-paper shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div>
            <h3 className="font-grotesk text-lg font-bold">Tu acuerdo de servicios</h3>
            <p className="text-xs text-inkmuted">Documento completo, listo para firmar o compartir</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-inkmuted transition-colors hover:bg-line hover:text-ink"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto bg-[color-mix(in_srgb,var(--facc,#DB2777)_3%,transparent)] p-5">
          <canvas
            ref={canvasRef}
            className="mx-auto h-auto w-full max-w-[640px] rounded-xl border border-line bg-white shadow-lg"
            style={{ aspectRatio: height ? `820 / ${height}` : undefined }}
          />
        </div>

        <div className="border-t border-line p-4">
          <button
            onClick={download}
            className="flex w-full items-center justify-center gap-2 rounded-full py-3.5 font-grotesk text-sm font-bold text-white transition-transform hover:scale-[1.01] active:scale-[0.99]"
            style={{ backgroundColor: ACCENT }}
          >
            Descargar como PNG
          </button>
        </div>
      </div>
    </div>
  )
}
