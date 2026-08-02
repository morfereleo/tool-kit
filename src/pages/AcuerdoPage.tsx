import { useMemo, useRef, useState } from 'react'
import { TOOLS } from '@/lib/tools'
import { fmt, parseNum } from '@/lib/format'
import BrandShell from '@/components/BrandShell'
import SavedDocsPanel from '@/components/SavedDocsPanel'
import { useSavedDocuments } from '@/hooks/useSavedDocuments'
import { Step, NumInput, HealthPill } from '@/components/QuoteUI'
import { IconUsers, IconList, IconWallet, IconFlag, IconDoc } from '@/components/icons'
import { TicketModal, type TicketData } from '@/components/TicketModal'
import { DocumentModal, type DocumentData } from '@/components/DocumentModal'
import posthog from '@/lib/posthog'

const tool = TOOLS[5]
const ACCENT = tool.accent

type Scheme = 'fijo' | 'mensual' | 'quincenal'

type Item = { id: number; text: string }
type Milestone = { id: number; name: string; amount: string; when: string }

type AgreementPayload = {
  client: string
  clientId: string
  provider: string
  providerId: string
  items: Item[]
  scheme: Scheme
  fixedAmount: string
  fixedTerm: string
  payAmount: string
  payCount: string
  milestones: Milestone[]
}

const SCHEMES: { id: Scheme; name: string; hint: string }[] = [
  { id: 'fijo', name: 'Monto fijo', hint: 'Un precio cerrado por todo el servicio' },
  { id: 'mensual', name: 'Pago mensual', hint: 'Un monto igual cada mes' },
  { id: 'quincenal', name: 'Pago quincenal', hint: 'Un monto igual cada quincena' },
]

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="field-box"
    />
  )
}

export default function AcuerdoPage() {
  const nextId = useRef(100)
  const nid = () => nextId.current++

  // ——— paso 01: partes ———
  const [client, setClient] = useState('')
  const [clientId, setClientId] = useState('')
  const [provider, setProvider] = useState('')
  const [providerId, setProviderId] = useState('')

  // ——— paso 02: ítems ———
  const [items, setItems] = useState<Item[]>([
    { id: 1, text: '' },
    { id: 2, text: '' },
    { id: 3, text: '' },
  ])

  // ——— paso 03: esquema ———
  const [scheme, setScheme] = useState<Scheme>('fijo')
  const [fixedAmount, setFixedAmount] = useState('400')
  const [fixedTerm, setFixedTerm] = useState('4 semanas')
  const [payAmount, setPayAmount] = useState('150')
  const [payCount, setPayCount] = useState('4')

  // ——— paso 04: hitos ———
  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: 11, name: 'Anticipo', amount: '', when: 'Al firmar el acuerdo' },
    { id: 12, name: 'Entrega final', amount: '', when: 'Contra entrega del servicio' },
  ])

  const [ticket, setTicket] = useState<TicketData | null>(null)
  const [document, setDocument] = useState<DocumentData | null>(null)

  // ——— persistencia: acuerdos guardados en el navegador ———
  const { docs, save, remove, duplicate } = useSavedDocuments<AgreementPayload>('adtools-agreements')
  const [openDocId, setOpenDocId] = useState<string | null>(null)
  const [docName, setDocName] = useState('')

  const buildPayload = (): AgreementPayload => ({
    client, clientId, provider, providerId, items, scheme,
    fixedAmount, fixedTerm, payAmount, payCount, milestones,
  })

  const applyPayload = (p: AgreementPayload, id: string, name: string) => {
    setClient(p.client); setClientId(p.clientId)
    setProvider(p.provider); setProviderId(p.providerId)
    setItems(p.items); setScheme(p.scheme)
    setFixedAmount(p.fixedAmount); setFixedTerm(p.fixedTerm)
    setPayAmount(p.payAmount); setPayCount(p.payCount)
    setMilestones(p.milestones)
    const maxId = Math.max(0, ...p.items.map((x) => x.id), ...p.milestones.map((x) => x.id))
    if (maxId >= nextId.current) nextId.current = maxId + 1
    setOpenDocId(id)
    setDocName(name)
  }

  const handleSave = (name: string) => {
    const finalName = openDocId ? docName || name : name
    const id = save(finalName, buildPayload(), openDocId ?? undefined)
    posthog.capture('agreement_saved', { is_existing_agreement: Boolean(openDocId), item_count: filledItems.length })
    setOpenDocId(id)
    setDocName(finalName)
  }

  const handleLoad = (id: string) => {
    const d = docs.find((x) => x.id === id)
    if (d) applyPayload(d.payload, d.id, d.name)
  }

  const handleNew = () => {
    setClient(''); setClientId(''); setProvider(''); setProviderId('')
    setItems([{ id: nid(), text: '' }, { id: nid(), text: '' }, { id: nid(), text: '' }])
    setScheme('fijo'); setFixedAmount('400'); setFixedTerm('4 semanas')
    setPayAmount('150'); setPayCount('4')
    setMilestones([
      { id: nid(), name: 'Anticipo', amount: '', when: 'Al firmar el acuerdo' },
      { id: nid(), name: 'Entrega final', amount: '', when: 'Contra entrega del servicio' },
    ])
    setOpenDocId(null)
    setDocName('')
  }

  const handleDelete = (id: string) => {
    remove(id)
    if (id === openDocId) {
      setOpenDocId(null)
      setDocName('')
    }
  }

  const calc = useMemo(() => {
    const n = Math.max(0, Math.round(parseNum(payCount)))
    const per = parseNum(payAmount)
    const total = scheme === 'fijo' ? parseNum(fixedAmount) : per * n

    const periodName = scheme === 'mensual' ? 'mes' : 'quincena'
    const schemeLabel =
      scheme === 'fijo'
        ? `Monto fijo por el servicio completo${fixedTerm.trim() ? ` — plazo estimado: ${fixedTerm.trim()}` : ''}`
        : `Pago ${scheme} durante ${n || '—'} ${n === 1 ? periodName : scheme === 'mensual' ? 'meses' : 'quincenas'}`
    const perPaymentLabel =
      scheme === 'fijo' ? '' : `$ ${fmt(per)} por ${periodName} × ${n || 0} pagos`

    const filledMilestones = milestones
      .filter((m) => m.name.trim() || parseNum(m.amount) > 0)
      .map((m) => ({ name: m.name.trim(), amount: parseNum(m.amount), when: m.when.trim() }))
    const assigned = filledMilestones.reduce((a, m) => a + m.amount, 0)
    const diff = total - assigned
    const health: boolean | null =
      total <= 0 || filledMilestones.length === 0 ? null : Math.abs(diff) < 0.005

    return { n, per, total, schemeLabel, perPaymentLabel, filledMilestones, assigned, diff, health }
  }, [scheme, fixedAmount, fixedTerm, payAmount, payCount, milestones])

  const filledItems = items.map((i) => i.text.trim()).filter(Boolean)
  const today = new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' })

  const openTicket = () => {
    posthog.capture('service_ticket_generated', { item_count: filledItems.length, milestone_count: calc.filledMilestones.length })
    setTicket({
      client: client.trim(),
      provider: provider.trim(),
      items: filledItems,
      schemeLabel: calc.schemeLabel,
      perPaymentLabel: calc.perPaymentLabel,
      total: calc.total,
      milestones: calc.filledMilestones,
    })
  }

  const openDocument = () => {
    posthog.capture('service_agreement_generated', { item_count: filledItems.length, milestone_count: calc.filledMilestones.length })
    setDocument({
      client: client.trim(),
      clientId: clientId.trim(),
      provider: provider.trim(),
      providerId: providerId.trim(),
      date: today,
      items: filledItems,
      schemeLabel: calc.schemeLabel,
      perPaymentLabel: calc.perPaymentLabel,
      total: calc.total,
      milestones: calc.filledMilestones,
    })
  }

  const setItem = (id: number, text: string) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, text } : i)))
  const setMilestone = (id: number, patch: Partial<Milestone>) =>
    setMilestones((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))

  return (
    <BrandShell tool={tool}>

      <div className="mx-auto max-w-6xl px-5 pt-8 md:px-8">
        <SavedDocsPanel
          docs={docs}
          currentId={openDocId}
          onSave={handleSave}
          onLoad={handleLoad}
          onDuplicate={duplicate}
          onDelete={handleDelete}
          onNew={handleNew}
          saveLabel="Guardar acuerdo"
          listLabel="Acuerdos guardados"
          placeholder="Ej. Acuerdo — diseño de marca para Café Andino"
        />
        {docName && openDocId && (
          <p className="mt-2 font-mono text-[11px] text-inkmuted">
            Editando: <span className="font-semibold text-inksoft">{docName}</span> — los cambios no se guardan solos; pulsa «Guardar cambios».
          </p>
        )}
      </div>

      <div className="mx-auto grid max-w-6xl lg:grid-cols-[1fr_380px]">
        {/* ————— LEFT: formulario ————— */}
        <div className="min-w-0">
          {/* 01 — partes */}
          <Step n="01" icon={<IconUsers />} title="Las partes" color={ACCENT}>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="field-label">
                  Contratante (tú)
                </label>
                <div className="mt-1.5">
                  <TextInput value={client} onChange={setClient} placeholder="Ej. Alejandro Danieles" />
                </div>
                <label className="field-label mt-4 !text-[10px]">
                  Cédula / ID fiscal (opcional)
                </label>
                <div className="mt-1.5">
                  <TextInput value={clientId} onChange={setClientId} placeholder="Ej. V-12.345.678" />
                </div>
              </div>
              <div>
                <label className="field-label">
                  Prestador del servicio
                </label>
                <div className="mt-1.5">
                  <TextInput value={provider} onChange={setProvider} placeholder="Ej. María Pérez — Diseño" />
                </div>
                <label className="field-label mt-4 !text-[10px]">
                  Cédula / ID fiscal (opcional)
                </label>
                <div className="mt-1.5">
                  <TextInput value={providerId} onChange={setProviderId} placeholder="Ej. V-98.765.432" />
                </div>
              </div>
            </div>
            <p className="mt-4 font-mono text-[11px] text-inkmuted">
              Fecha del acuerdo: {today}
            </p>
          </Step>

          {/* 02 — ítems */}
          <Step n="02" icon={<IconList />} title="Ítems del servicio" color={ACCENT}
            right={
              <HealthPill
                ok={filledItems.length > 0 ? true : null}
                okText={`${filledItems.length} ítem${filledItems.length === 1 ? '' : 's'} definido${filledItems.length === 1 ? '' : 's'}`}
                badText=""
              />
            }
          >
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={item.id} className="flex items-center gap-3">
                  <span className="w-7 shrink-0 font-mono text-xs" style={{ color: ACCENT }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <TextInput
                      value={item.text}
                      onChange={(v) => setItem(item.id, v)}
                      placeholder="Ej. Diseño de 5 piezas gráficas para redes sociales"
                    />
                  </div>
                  {items.length > 1 && (
                    <button
                      onClick={() => setItems((prev) => prev.filter((x) => x.id !== item.id))}
                      className="shrink-0 text-inkmuted transition-colors hover:text-ink"
                      aria-label="Quitar ítem"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => setItems((prev) => [...prev, { id: nid(), text: '' }])}
              className="mt-5 rounded-full border border-dashed border-inkmuted px-5 py-2 text-sm font-medium text-inksoft transition-colors hover:border-ink hover:text-ink"
            >
              + Agregar ítem
            </button>
            <p className="mt-4 font-mono text-[11px] leading-relaxed text-inkmuted">
              Describe cada entregable con la mayor claridad posible: qué incluye, en qué formato y cuántas
              revisiones contempla.
            </p>
          </Step>

          {/* 03 — esquema de pago */}
          <Step n="03" icon={<IconWallet />} title="Esquema de pago" color={ACCENT}>
            <div className="grid gap-3 sm:grid-cols-3">
              {SCHEMES.map((s) => {
                const active = scheme === s.id
                return (
                  <button
                    key={s.id}
                    onClick={() => setScheme(s.id)}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      active
                        ? 'border-transparent bg-ink text-white shadow-lg'
                        : 'border-line bg-paper hover:border-inkmuted'
                    }`}
                  >
                    <p className="font-grotesk text-sm font-bold">{s.name}</p>
                    <p className={`mt-1 text-xs leading-relaxed ${active ? 'text-white/60' : 'text-inkmuted'}`}>
                      {s.hint}
                    </p>
                  </button>
                )
              })}
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              {scheme === 'fijo' ? (
                <>
                  <div>
                    <label className="field-label">
                      Monto total ($)
                    </label>
                    <NumInput value={fixedAmount} onChange={setFixedAmount} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="field-label">
                      Plazo estimado del servicio
                    </label>
                    <div className="mt-1.5">
                      <TextInput value={fixedTerm} onChange={setFixedTerm} placeholder="Ej. 4 semanas" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="field-label">
                      Monto por pago ($)
                    </label>
                    <NumInput value={payAmount} onChange={setPayAmount} />
                  </div>
                  <div>
                    <label className="field-label">
                      N° de pagos
                    </label>
                    <NumInput value={payCount} onChange={setPayCount} />
                  </div>
                  <div className="flex items-end pb-1.5">
                    <p className="font-mono text-[11px] leading-relaxed text-inkmuted">
                      {calc.perPaymentLabel || 'Completa el monto y la cantidad de pagos'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </Step>

          {/* 04 — hitos */}
          <Step n="04" icon={<IconFlag />} title="Hitos de pago" color={ACCENT}
            right={
              <HealthPill
                ok={calc.health}
                okText="Los hitos cuadran con el total"
                badText={
                  calc.diff > 0
                    ? `Faltan $${fmt(calc.diff)} por asignar`
                    : `Excede el total por $${fmt(-calc.diff)}`
                }
              />
            }
          >
            <div className="space-y-4">
              {milestones.map((m, i) => (
                <div key={m.id} className="rounded-2xl border border-line p-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 shrink-0 font-mono text-xs" style={{ color: ACCENT }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <TextInput
                        value={m.name}
                        onChange={(v) => setMilestone(m.id, { name: v })}
                        placeholder="Nombre del hito — ej. Primer avance"
                      />
                    </div>
                    {milestones.length > 1 && (
                      <button
                        onClick={() => setMilestones((prev) => prev.filter((x) => x.id !== m.id))}
                        className="shrink-0 text-inkmuted transition-colors hover:text-ink"
                        aria-label="Quitar hito"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="mt-3 grid gap-4 pl-10 sm:grid-cols-[140px_1fr]">
                    <div>
                      <label className="field-label !text-[10px]">
                        Monto ($)
                      </label>
                      <NumInput value={m.amount} onChange={(v) => setMilestone(m.id, { amount: v })} />
                    </div>
                    <div>
                      <label className="field-label !text-[10px]">
                        Condición o fecha
                      </label>
                      <div className="mt-1">
                        <TextInput
                          value={m.when}
                          onChange={(v) => setMilestone(m.id, { when: v })}
                          placeholder="Ej. Al aprobar el primer avance"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setMilestones((prev) => [...prev, { id: nid(), name: '', amount: '', when: '' }])}
              className="mt-5 rounded-full border border-dashed border-inkmuted px-5 py-2 text-sm font-medium text-inksoft transition-colors hover:border-ink hover:text-ink"
            >
              + Agregar hito
            </button>
            <p className="mt-4 font-mono text-[11px] leading-relaxed text-inkmuted">
              Reparte el total entre los hitos — la píldora te avisa cuando la suma cuadra con el monto
              acordado.
            </p>
          </Step>
        </div>

        {/* ————— RIGHT: documento vivo ————— */}
        <aside className="border-t border-line lg:border-l lg:border-t-0">
          <div className="sticky top-14 px-5 py-10 md:px-8">
            <p className="field-label !mb-4">
              Vista previa del documento
            </p>

            <div className="mt-4 rounded-2xl border border-line bg-paper p-6 shadow-sm">
              <div className="border-b-2 pb-4" style={{ borderColor: ACCENT }}>
                <p className="font-grotesk text-base font-bold leading-tight">
                  ACUERDO DE PRESTACIÓN DE SERVICIOS
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-inkmuted">
                  {today} · AD·Tools
                </p>
              </div>

              <p className="mt-4 text-[13px] leading-relaxed text-inksoft">
                Entre <strong className="text-ink">{client.trim() || 'el Contratante'}</strong>
                {clientId.trim() ? ` (${clientId.trim()})` : ''} (en adelante, el
                Cliente) y <strong style={{ color: ACCENT }}>{provider.trim() || 'el Prestador'}</strong>
                {providerId.trim() ? ` (${providerId.trim()})` : ''} (en
                adelante, el Prestador), se acuerda lo siguiente:
              </p>

              <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: ACCENT }}>
                1 · Objeto del servicio
              </p>
              {filledItems.length === 0 ? (
                <p className="mt-2 text-[13px] italic text-inkmuted">Aún sin ítems definidos…</p>
              ) : (
                <ol className="mt-2 space-y-1.5">
                  {filledItems.map((it, i) => (
                    <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed">
                      <span className="shrink-0 font-mono text-[11px]" style={{ color: ACCENT }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-ink">{it}</span>
                    </li>
                  ))}
                </ol>
              )}

              <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: ACCENT }}>
                2 · Esquema de pago
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink">{calc.schemeLabel}.</p>
              {calc.perPaymentLabel && (
                <p className="mt-1 font-mono text-[11px] text-inkmuted">{calc.perPaymentLabel}</p>
              )}
              <p className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-inkmuted">
                  Total acordado
                </span>
                <span className="font-mono text-xl font-bold tabular-nums">$ {fmt(calc.total)}</span>
              </p>

              <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: ACCENT }}>
                3 · Hitos de pago
              </p>
              {calc.filledMilestones.length === 0 ? (
                <p className="mt-2 text-[13px] italic text-inkmuted">Pago único contra entrega…</p>
              ) : (
                <div className="mt-2">
                  {calc.filledMilestones.map((m, i) => (
                    <div key={i} className="flex items-baseline justify-between gap-3 border-b border-line py-2">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-ink">
                          {String(i + 1).padStart(2, '0')} · {m.name || `Hito ${i + 1}`}
                        </p>
                        {m.when && <p className="font-mono text-[10px] text-inkmuted">{m.when}</p>}
                      </div>
                      <span className="shrink-0 font-mono text-[13px] font-semibold tabular-nums">
                        $ {fmt(m.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8 grid grid-cols-2 gap-6">
                {[
                  ['EL CLIENTE', client.trim(), clientId.trim()],
                  ['EL PRESTADOR', provider.trim(), providerId.trim()],
                ].map(([role, name, idNum]) => (
                  <div key={role}>
                    <div className="h-10 border-b border-ink" />
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-inkmuted">{role}</p>
                    <p className="text-[12px] font-medium text-ink">{name || '—'}</p>
                    {idNum && <p className="font-mono text-[10px] text-inkmuted">{idNum}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={openDocument}
                disabled={!provider.trim() && !client.trim() && filledItems.length === 0}
                className="flex flex-1 items-center justify-center gap-2 rounded-full py-3.5 font-grotesk text-sm font-bold text-white transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                style={{ backgroundColor: ACCENT }}
              >
                <IconDoc className="h-4 w-4" />
                Descargar documento
              </button>
              <button
                onClick={openTicket}
                disabled={!provider.trim() && !client.trim() && filledItems.length === 0}
                className="flex flex-1 items-center justify-center gap-2 rounded-full border py-3.5 font-grotesk text-sm font-bold transition-colors hover:bg-[color-mix(in_srgb,var(--facc)_6%,transparent)] disabled:cursor-not-allowed disabled:opacity-40"
                style={{ borderColor: ACCENT, color: ACCENT }}
              >
                Ticket de servicio
              </button>
            </div>
            <p className="mt-3 text-center font-mono text-[10px] leading-relaxed text-inkmuted">
              El documento es el acuerdo completo para firmar; el ticket es un resumen rápido para enviar. No
              sustituyen un contrato con validez legal — para eso, consulta a un profesional.
            </p>
          </div>
        </aside>
      </div>

      {ticket && <TicketModal data={ticket} onClose={() => setTicket(null)} />}
      {document && <DocumentModal data={document} onClose={() => setDocument(null)} />}
    </BrandShell>
  )
}
