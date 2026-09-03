import { useEffect, useRef, useState } from 'react'
import Modal from '@/components/Modal'
import { fmt } from '@/lib/format'
import { dateLocale, useLang, useT } from '@/lib/i18n'
import posthog from '@/lib/posthog'

type TFn = (k: string, v?: Record<string, string | number>) => string

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
function layout(ctx: CanvasRenderingContext2D, d: TicketData, draw: boolean, t: TFn, locale: string): number {
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
  text(t('ticket.title'), PAD, y, `700 32px ${SANS}`, INK)
  text('AD·TOOLS', W - PAD, y, `500 13px ${MONO}`, MUTED, 'right')
  y += 28
  const date = new Date().toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' })
  text(date.toUpperCase(), PAD, y, `500 13px ${MONO}`, MUTED)
  y += 28
  hline(y)

  // ——— partes ———
  y += 42
  text(t('ticket.client'), PAD, y, `500 11px ${MONO}`, MUTED)
  text(t('ticket.provider'), W / 2 + 16, y, `500 11px ${MONO}`, MUTED)
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
  text(t('ticket.items'), PAD, y, `500 11px ${MONO}`, MUTED)
  y += 30
  const itemFont = `500 15px ${SANS}`
  if (draw) ctx.font = itemFont
  if (d.items.length === 0) {
    text(t('ticket.noItems'), PAD, y, itemFont, MUTED)
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
  text(t('ticket.scheme'), PAD, y, `500 11px ${MONO}`, MUTED)
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
  text(t('ticket.total'), PAD, y, `500 11px ${MONO}`, MUTED)
  text(`$ ${fmt(d.total)}`, W - PAD, y + 8, `700 26px ${MONO}`, INK, 'right')
  y += 44
  hline(y)

  // ——— hitos ———
  y += 42
  text(t('ticket.milestones'), PAD, y, `500 11px ${MONO}`, MUTED)
  y += 26
  if (d.milestones.length === 0) {
    text(t('ticket.single'), PAD, y, `500 15px ${SANS}`, MUTED)
    y += 34
  } else {
    d.milestones.forEach((m, i) => {
      y += 22
      text(`${String(i + 1).padStart(2, '0')}`, PAD, y, `500 13px ${MONO}`, ACCENT)
      const nameLines = wrapLines(ctx, m.name || t('ticket.milestoneN', { n: i + 1 }), W - PAD * 2 - 200)
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
  text(t('ticket.madeWith'), PAD, y, `500 11px ${MONO}`, MUTED)
  y += 22
  text(t('ticket.disclaimer'), PAD, y, `500 11px ${MONO}`, MUTED)
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

const drawTicket = (canvas: HTMLCanvasElement, d: TicketData, t: TFn, locale: string) => {
  // pass 1: measure
  const measure = document.createElement('canvas')
  measure.width = W
  measure.height = 100
  const mctx = measure.getContext('2d')!
  const h = layout(mctx, d, false, t, locale)

  // pass 2: draw
  canvas.width = W * 2
  canvas.height = h * 2
  const ctx = canvas.getContext('2d')!
  ctx.scale(2, 2)
  layout(ctx, d, true, t, locale)
}

export function TicketModal({ data, onClose }: { data: TicketData; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [url, setUrl] = useState('')
  const t = useT()
  const { lang } = useLang()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    // esperar las webfonts para que el PNG no salga con la fuente de fallback
    let cancelled = false
    const render = () => {
      if (cancelled) return
      drawTicket(canvas, data, t, dateLocale(lang))
      setUrl(canvas.toDataURL('image/png'))
    }
    if (document.fonts?.ready) {
      document.fonts.ready.then(render)
    } else {
      render()
    }
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, lang])

  const download = () => {
    const a = document.createElement('a')
    a.href = url
    a.download = `${lang === 'es' ? 'ticket-de-servicio' : 'service-ticket'}-${Date.now()}.png`
    a.click()
    posthog.capture('service_ticket_downloaded', { item_count: data.items.length, milestone_count: data.milestones.length })
  }

  return (
    <Modal
      title={t('ticket.modalTitle')}
      subtitle={t('ticket.modalNote')}
      onClose={onClose}
      maxWidth="max-w-2xl"
      footer={
        <button
          onClick={download}
          className="w-full rounded-full py-3.5 font-grotesk text-sm font-bold text-white transition-transform hover:scale-[1.01] active:scale-[0.99]"
          style={{ backgroundColor: ACCENT }}
        >
          {t('ticket.download')}
        </button>
      }
    >
      <div className="max-h-[60vh] overflow-y-auto bg-paper p-6">
        <canvas ref={canvasRef} className="mx-auto w-full max-w-md rounded-xl shadow-lg" />
      </div>
    </Modal>
  )
}
