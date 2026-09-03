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
import { dateLocale, useLang, useT } from '@/lib/i18n'
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

const SCHEMES: { id: Scheme; nameKey: string; hintKey: string }[] = [
  { id: 'fijo', nameKey: 'ac.s.fijo.name', hintKey: 'ac.s.fijo.hint' },
  { id: 'mensual', nameKey: 'ac.s.mensual.name', hintKey: 'ac.s.mensual.hint' },
  { id: 'quincenal', nameKey: 'ac.s.quincenal.name', hintKey: 'ac.s.quincenal.hint' },
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
  const { lang } = useLang()
  const t = useT()
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
  const [fixedTerm, setFixedTerm] = useState(() => t('ac.termDefault'))
  const [payAmount, setPayAmount] = useState('150')
  const [payCount, setPayCount] = useState('4')

  // ——— paso 04: hitos ———
  const [milestones, setMilestones] = useState<Milestone[]>(() => [
    { id: 11, name: t('ac.d.upfront'), amount: '', when: t('ac.d.onSigning') },
    { id: 12, name: t('ac.d.final'), amount: '', when: t('ac.d.onDelivery') },
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
    setScheme('fijo'); setFixedAmount('400'); setFixedTerm(t('ac.termDefault'))
    setPayAmount('150'); setPayCount('4')
    setMilestones([
      { id: nid(), name: t('ac.d.upfront'), amount: '', when: t('ac.d.onSigning') },
      { id: nid(), name: t('ac.d.final'), amount: '', when: t('ac.d.onDelivery') },
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

    const periodName = scheme === 'mensual' ? t('ac.month') : t('ac.fortnight')
    const schemeLabel =
      scheme === 'fijo'
        ? t('ac.labelFijo', {
            term: fixedTerm.trim() ? t('ac.labelTerm', { t: fixedTerm.trim() }) : '',
          })
        : t(scheme === 'mensual' ? 'ac.labelMensual' : 'ac.labelQuincenal', {
            n: n || '—',
            period: n === 1 ? periodName : scheme === 'mensual' ? t('ac.months') : t('ac.fortnights'),
          })
    const perPaymentLabel =
      scheme === 'fijo' ? '' : t('ac.perLabel', { per: fmt(per), period: periodName, n: n || 0 })

    const filledMilestones = milestones
      .filter((m) => m.name.trim() || parseNum(m.amount) > 0)
      .map((m) => ({ name: m.name.trim(), amount: parseNum(m.amount), when: m.when.trim() }))
    const assigned = filledMilestones.reduce((a, m) => a + m.amount, 0)
    const diff = total - assigned
    const health: boolean | null =
      total <= 0 || filledMilestones.length === 0 ? null : Math.abs(diff) < 0.005

    return { n, per, total, schemeLabel, perPaymentLabel, filledMilestones, assigned, diff, health }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheme, fixedAmount, fixedTerm, payAmount, payCount, milestones, lang])

  const filledItems = items.map((i) => i.text.trim()).filter(Boolean)
  const today = new Date().toLocaleDateString(dateLocale(lang), { day: '2-digit', month: 'long', year: 'numeric' })

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
          saveLabel={t('ac.saveLabel')}
          listLabel={t('ac.listLabel')}
          placeholder={t('ac.placeholder')}
        />
        {docName && openDocId && (
          <p className="mt-2 font-mono text-[11px] text-inkmuted">
            {t('docs.editing')} <span className="font-semibold text-inksoft">{docName}</span> {t('docs.unsaved')}
          </p>
        )}
      </div>

      <div className="mx-auto grid max-w-6xl lg:grid-cols-[1fr_380px]">
        {/* ————— LEFT: formulario ————— */}
        <div className="min-w-0">
          {/* 01 — partes */}
          <Step n="01" icon={<IconUsers />} title={t('ac.parties')} color={ACCENT}>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="field-label">
                  {t('ac.client')}
                </label>
                <div className="mt-1.5">
                  <TextInput value={client} onChange={setClient} placeholder={t('ac.clientPh')} />
                </div>
                <label className="field-label mt-4 !text-[10px]">
                  {t('ac.idNum')}
                </label>
                <div className="mt-1.5">
                  <TextInput value={clientId} onChange={setClientId} placeholder={t('ac.clientIdPh')} />
                </div>
              </div>
              <div>
                <label className="field-label">
                  {t('ac.provider')}
                </label>
                <div className="mt-1.5">
                  <TextInput value={provider} onChange={setProvider} placeholder={t('ac.providerPh')} />
                </div>
                <label className="field-label mt-4 !text-[10px]">
                  {t('ac.idNum')}
                </label>
                <div className="mt-1.5">
                  <TextInput value={providerId} onChange={setProviderId} placeholder={t('ac.providerIdPh')} />
                </div>
              </div>
            </div>
            <p className="mt-4 font-mono text-[11px] text-inkmuted">
              {t('ac.date', { d: today })}
            </p>
          </Step>

          {/* 02 — ítems */}
          <Step n="02" icon={<IconList />} title={t('ac.items')} color={ACCENT}
            right={
              <HealthPill
                ok={filledItems.length > 0 ? true : null}
                okText={`${filledItems.length} ${filledItems.length === 1 ? t('ac.itemOne') : t('ac.itemMany')}`}
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
                      placeholder={t('ac.itemPh')}
                    />
                  </div>
                  {items.length > 1 && (
                    <button
                      onClick={() => setItems((prev) => prev.filter((x) => x.id !== item.id))}
                      className="shrink-0 text-inkmuted transition-colors hover:text-ink"
                      aria-label={t('ac.delItem')}
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
              {t('ac.addItem')}
            </button>
            <p className="mt-4 font-mono text-[11px] leading-relaxed text-inkmuted">
              {t('ac.itemsNote')}
            </p>
          </Step>

          {/* 03 — esquema de pago */}
          <Step n="03" icon={<IconWallet />} title={t('ac.scheme')} color={ACCENT}>
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
                    <p className="font-grotesk text-sm font-bold">{t(s.nameKey)}</p>
                    <p className={`mt-1 text-xs leading-relaxed ${active ? 'text-white/60' : 'text-inkmuted'}`}>
                      {t(s.hintKey)}
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
                      {t('ac.total')}
                    </label>
                    <NumInput value={fixedAmount} onChange={setFixedAmount} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="field-label">
                      {t('ac.term')}
                    </label>
                    <div className="mt-1.5">
                      <TextInput value={fixedTerm} onChange={setFixedTerm} placeholder={t('ac.termPh')} />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="field-label">
                      {t('ac.perPayment')}
                    </label>
                    <NumInput value={payAmount} onChange={setPayAmount} />
                  </div>
                  <div>
                    <label className="field-label">
                      {t('ac.payCount')}
                    </label>
                    <NumInput value={payCount} onChange={setPayCount} />
                  </div>
                  <div className="flex items-end pb-1.5">
                    <p className="font-mono text-[11px] leading-relaxed text-inkmuted">
                      {calc.perPaymentLabel || t('ac.fillPayment')}
                    </p>
                  </div>
                </>
              )}
            </div>
          </Step>

          {/* 04 — hitos */}
          <Step n="04" icon={<IconFlag />} title={t('ac.milestones')} color={ACCENT}
            right={
              <HealthPill
                ok={calc.health}
                okText={t('ac.healthOk')}
                badText={
                  calc.diff > 0
                    ? t('ac.healthUnder', { v: fmt(calc.diff) })
                    : t('ac.healthOver', { v: fmt(-calc.diff) })
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
                        placeholder={t('ac.msPh')}
                      />
                    </div>
                    {milestones.length > 1 && (
                      <button
                        onClick={() => setMilestones((prev) => prev.filter((x) => x.id !== m.id))}
                        className="shrink-0 text-inkmuted transition-colors hover:text-ink"
                        aria-label={t('ac.delMs')}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="mt-3 grid gap-4 pl-10 sm:grid-cols-[140px_1fr]">
                    <div>
                      <label className="field-label !text-[10px]">
                        {t('ac.msAmount')}
                      </label>
                      <NumInput value={m.amount} onChange={(v) => setMilestone(m.id, { amount: v })} />
                    </div>
                    <div>
                      <label className="field-label !text-[10px]">
                        {t('ac.msWhen')}
                      </label>
                      <div className="mt-1">
                        <TextInput
                          value={m.when}
                          onChange={(v) => setMilestone(m.id, { when: v })}
                          placeholder={t('ac.msWhenPh')}
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
              {t('ac.addMs')}
            </button>
            <p className="mt-4 font-mono text-[11px] leading-relaxed text-inkmuted">
              {t('ac.msNote')}
            </p>
          </Step>
        </div>

        {/* ————— RIGHT: documento vivo ————— */}
        <aside className="border-t border-line lg:border-l lg:border-t-0">
          <div className="sticky top-14 px-5 py-10 md:px-8">
            <p className="field-label !mb-4">
              {t('ac.preview')}
            </p>

            <div className="mt-4 rounded-2xl border border-line bg-paper p-6 shadow-sm">
              <div className="border-b-2 pb-4" style={{ borderColor: ACCENT }}>
                <p className="font-grotesk text-base font-bold leading-tight">
                  {t('ac.docTitle')}
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-inkmuted">
                  {today} · AD·Tools
                </p>
              </div>

              <p className="mt-4 text-[13px] leading-relaxed text-inksoft">
                {t('ac.between')} <strong className="text-ink">{client.trim() || t('ac.theClient')}</strong>
                {clientId.trim() ? ` (${clientId.trim()})` : ''} {t('ac.hereClient')}{' '}
                <strong style={{ color: ACCENT }}>{provider.trim() || t('ac.theProvider')}</strong>
                {providerId.trim() ? ` (${providerId.trim()})` : ''} {t('ac.hereProvider')}
              </p>

              <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: ACCENT }}>
                {t('ac.s1')}
              </p>
              {filledItems.length === 0 ? (
                <p className="mt-2 text-[13px] italic text-inkmuted">{t('ac.noItems')}</p>
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
                {t('ac.s2')}
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink">{calc.schemeLabel}.</p>
              {calc.perPaymentLabel && (
                <p className="mt-1 font-mono text-[11px] text-inkmuted">{calc.perPaymentLabel}</p>
              )}
              <p className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-inkmuted">
                  {t('ac.agreedTotal')}
                </span>
                <span className="font-mono text-xl font-bold tabular-nums">$ {fmt(calc.total)}</span>
              </p>

              <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: ACCENT }}>
                {t('ac.s3')}
              </p>
              {calc.filledMilestones.length === 0 ? (
                <p className="mt-2 text-[13px] italic text-inkmuted">{t('ac.singlePayment')}</p>
              ) : (
                <div className="mt-2">
                  {calc.filledMilestones.map((m, i) => (
                    <div key={i} className="flex items-baseline justify-between gap-3 border-b border-line py-2">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-ink">
                          {String(i + 1).padStart(2, '0')} · {m.name || t('ac.milestoneN', { n: i + 1 })}
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
                  [t('ac.roleClient'), client.trim(), clientId.trim()],
                  [t('ac.roleProvider'), provider.trim(), providerId.trim()],
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
                {t('ac.download')}
              </button>
              <button
                onClick={openTicket}
                disabled={!provider.trim() && !client.trim() && filledItems.length === 0}
                className="flex flex-1 items-center justify-center gap-2 rounded-full border py-3.5 font-grotesk text-sm font-bold transition-colors hover:bg-[color-mix(in_srgb,var(--facc)_6%,transparent)] disabled:cursor-not-allowed disabled:opacity-40"
                style={{ borderColor: ACCENT, color: ACCENT }}
              >
                {t('ac.ticket')}
              </button>
            </div>
            <p className="mt-3 text-center font-mono text-[10px] leading-relaxed text-inkmuted">
              {t('ac.legalNote')}
            </p>
          </div>
        </aside>
      </div>

      {ticket && <TicketModal data={ticket} onClose={() => setTicket(null)} />}
      {document && <DocumentModal data={document} onClose={() => setDocument(null)} />}
    </BrandShell>
  )
}
