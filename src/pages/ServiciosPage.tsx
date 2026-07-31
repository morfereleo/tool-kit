import { useMemo, useState } from 'react'
import BrandShell from '@/components/BrandShell'
import QuoteModal, { type QuoteData } from '@/components/QuoteModal'
import SavedDocsPanel from '@/components/SavedDocsPanel'
import { useSavedDocuments } from '@/hooks/useSavedDocuments'
import { NumInput, Step, HealthPill } from '@/components/QuoteUI'
import {
  IconClock, IconBox, IconGem, IconRepeat, IconWallet, IconStack,
  IconReceipt, IconShield, IconTrend, IconTag, IconSpark, IconCheck, IconWarn,
} from '@/components/icons'
import { TOOLS } from '@/lib/tools'
import { VAT_COUNTRIES } from '@/lib/vat'
import { fmt } from '@/lib/format'
import { useBaseRate } from '@/hooks/useBaseRate'

const tool = TOOLS[4]
const ACCENT = tool.accent
const STEP_COLOR = '#B45309'

type ModelId = 'horas' | 'paquete' | 'valor' | 'retainer'

let uid = 1
const nextId = () => uid++

const COMPLEXITY = [
  { value: '0.8', label: 'Simple ×0,8' },
  { value: '1', label: 'Normal ×1,0' },
  { value: '1.2', label: 'Exigente ×1,2' },
  { value: '1.5', label: 'Complejo ×1,5' },
]

const MODELS: {
  id: ModelId
  num: string
  name: string
  short: string
  desc: string
  best: string
  icon: React.ReactNode
}[] = [
  {
    id: 'horas',
    num: 'A',
    name: 'Por horas y fases',
    short: 'Por horas',
    desc: 'Desglosa el proyecto en fases con horas estimadas y complejidad.',
    best: 'Proyectos a medida con alcance variable',
    icon: <IconClock />,
  },
  {
    id: 'paquete',
    num: 'B',
    name: 'Precio por paquete',
    short: 'Paquetes',
    desc: 'Ofrece hasta 3 opciones cerradas; el cliente elige la suya.',
    best: 'Servicios repetibles y productizados',
    icon: <IconBox />,
  },
  {
    id: 'valor',
    num: 'C',
    name: 'Por valor generado',
    short: 'Por valor',
    desc: 'Precio anclado al impacto que generas, no a tus horas.',
    best: 'Proyectos con retorno medible para el cliente',
    icon: <IconGem />,
  },
  {
    id: 'retainer',
    num: 'D',
    name: 'Retainer mensual',
    short: 'Retainer',
    desc: 'Bloque de horas mensual recurrente con descuento por fidelidad.',
    best: 'Clientes fijos y trabajo continuo',
    icon: <IconRepeat />,
  },
]

/* ————— types ————— */
type Phase = { id: number; name: string; hours: string; factor: string }
type Cost = { id: number; name: string; amount: string }
type Tier = { id: number; name: string; price: string; features: string[]; hours: string }

/* Todo el estado editable de la página, en un solo payload guardable */
type QuotePayload = {
  model: ModelId
  countryCode: string
  phases: Phase[]
  costs: Cost[]
  risk: string
  profit: string
  tiers: Tier[]
  pkgCosts: string
  impact: string
  share: string
  valHours: string
  valCosts: string
  valPrice: string
  retHours: string
  retDiscount: string
  retMonths: string
}

const DEFAULT_PHASES: Phase[] = [
  { id: nextId(), name: 'Investigación y brief', hours: '4', factor: '1' },
  { id: nextId(), name: 'Diseño / desarrollo', hours: '20', factor: '1' },
  { id: nextId(), name: 'Revisiones y ajustes', hours: '6', factor: '1.2' },
]

const DEFAULT_TIERS: Tier[] = [
  { id: nextId(), name: 'Básico', price: '300', features: ['Entrega en 7 días', '1 revisión'], hours: '15' },
  { id: nextId(), name: 'Estándar', price: '550', features: ['Entrega en 10 días', '3 revisiones', 'Soporte 15 días'], hours: '25' },
  { id: nextId(), name: 'Premium', price: '900', features: ['Entrega prioritaria', 'Revisiones ilimitadas', 'Soporte 30 días'], hours: '40' },
]

export default function ServiciosPage() {
  const [model, setModel] = useState<ModelId>('horas')
  const [countryCode, setCountryCode] = useState('VE')
  const [showQuote, setShowQuote] = useState(false)
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null)

  const base = useBaseRate()
  const country = VAT_COUNTRIES.find((c) => c.code === countryCode)!

  /* ——— MODELO A: horas ——— */
  const [phases, setPhases] = useState<Phase[]>(DEFAULT_PHASES)
  const [costs, setCosts] = useState<Cost[]>([{ id: nextId(), name: 'Suscripciones / plugins', amount: '30' }])
  const [risk, setRisk] = useState('10')
  const [profit, setProfit] = useState('20')

  const horas = useMemo(() => {
    const rows = phases.map((p) => {
      const h = parseFloat(p.hours.replace(',', '.')) || 0
      const f = parseFloat(p.factor.replace(',', '.')) || 1
      return { ...p, h, f, subtotal: h * f * base.rate }
    })
    const totalHours = rows.reduce((a, p) => a + p.h, 0)
    const effHours = rows.reduce((a, p) => a + p.h * p.f, 0)
    const labor = rows.reduce((a, p) => a + p.subtotal, 0)
    const directCosts = costs.reduce((a, c) => a + (parseFloat(c.amount.replace(',', '.')) || 0), 0)
    const subtotal = labor + directCosts
    const riskAmt = subtotal * ((parseFloat(risk) || 0) / 100)
    const profitAmt = (subtotal + riskAmt) * ((parseFloat(profit) || 0) / 100)
    const net = subtotal + riskAmt + profitAmt
    const tax = net * (country.rate / 100)
    return {
      rows, totalHours, effHours, labor, directCosts, subtotal, riskAmt, profitAmt,
      net, tax, total: net + tax,
      min: subtotal,
      effRate: totalHours > 0 ? net / totalHours : 0,
    }
  }, [phases, costs, risk, profit, base.rate, country.rate])

  /* ——— MODELO B: paquetes ——— */
  const [tiers, setTiers] = useState<Tier[]>(DEFAULT_TIERS)
  const [pkgCosts, setPkgCosts] = useState('30')

  const paquete = useMemo(() => {
    const dc = parseFloat(pkgCosts.replace(',', '.')) || 0
    return tiers.map((t) => {
      const price = parseFloat(t.price.replace(',', '.')) || 0
      const hours = parseFloat(t.hours.replace(',', '.')) || 0
      const cost = hours * base.rate + dc
      const tax = price * (country.rate / 100)
      const marginAmt = price - cost
      const marginPct = price > 0 ? (marginAmt / price) * 100 : 0
      const effRate = hours > 0 ? price / hours : 0
      return { ...t, priceNum: price, hoursNum: hours, cost, tax, total: price + tax, marginAmt, marginPct, effRate, healthy: marginPct >= 20 }
    })
  }, [tiers, pkgCosts, base.rate, country.rate])

  /* ——— MODELO C: valor ——— */
  const [impact, setImpact] = useState('5000')
  const [share, setShare] = useState('15')
  const [valHours, setValHours] = useState('20')
  const [valCosts, setValCosts] = useState('30')
  const [valPrice, setValPrice] = useState('')

  const valor = useMemo(() => {
    const imp = parseFloat(impact.replace(',', '.')) || 0
    const sh = parseFloat(share.replace(',', '.')) || 0
    const suggested = imp * (sh / 100)
    const price = parseFloat(valPrice.replace(',', '.')) || suggested
    const hours = parseFloat(valHours.replace(',', '.')) || 0
    const dc = parseFloat(valCosts.replace(',', '.')) || 0
    const cost = hours * base.rate + dc
    const marginAmt = price - cost
    const marginPct = price > 0 ? (marginAmt / price) * 100 : 0
    const effRate = hours > 0 ? price / hours : 0
    const tax = price * (country.rate / 100)
    return { suggested, price, hours, cost, marginAmt, marginPct, effRate, tax, total: price + tax, min: cost, healthy: marginPct >= 20 }
  }, [impact, share, valPrice, valHours, valCosts, base.rate, country.rate])

  /* ——— MODELO D: retainer ——— */
  const [retHours, setRetHours] = useState('20')
  const [retDiscount, setRetDiscount] = useState('10')
  const [retMonths, setRetMonths] = useState('6')

  const retainer = useMemo(() => {
    const h = parseFloat(retHours.replace(',', '.')) || 0
    const d = parseFloat(retDiscount.replace(',', '.')) || 0
    const m = parseInt(retMonths) || 0
    const gross = h * base.rate
    const monthly = gross * (1 - d / 100)
    const tax = monthly * (country.rate / 100)
    const effRate = h > 0 ? monthly / h : 0
    return { hours: h, gross, monthly, tax, total: monthly + tax, effRate, months: m, contract: (monthly + tax) * m, discountPct: d }
  }, [retHours, retDiscount, retMonths, base.rate, country.rate])

  /* ——— quote generation ——— */
  const openQuote = (data: QuoteData) => {
    setQuoteData(data)
    setShowQuote(true)
  }

  const quoteForCurrent = () => {
    if (model === 'horas') {
      openQuote({
        service: `Proyecto por fases — ${fmt(horas.totalHours, 1)} horas estimadas`,
        amountUSD: horas.net, rateBs: 1, subtotalBs: horas.net,
        taxBs: horas.tax, totalBs: horas.total, taxName: country.taxName, taxRate: country.rate,
      })
    } else if (model === 'paquete') {
      const t = paquete[1] ?? paquete[0] // Estándar o el primero
      if (!t) return
      openQuote({
        service: `Paquete ${t.name} — ${t.features.join(' · ')}`,
        amountUSD: t.priceNum, rateBs: 1, subtotalBs: t.priceNum,
        taxBs: t.tax, totalBs: t.total, taxName: country.taxName, taxRate: country.rate,
      })
    } else if (model === 'valor') {
      openQuote({
        service: 'Proyecto cotizado por valor generado',
        amountUSD: valor.price, rateBs: 1, subtotalBs: valor.price,
        taxBs: valor.tax, totalBs: valor.total, taxName: country.taxName, taxRate: country.rate,
      })
    } else {
      openQuote({
        service: `Retainer mensual — ${fmt(retainer.hours, 0)} horas/mes${retainer.months > 0 ? ` × ${retainer.months} meses` : ''}`,
        amountUSD: retainer.monthly, rateBs: 1, subtotalBs: retainer.monthly,
        taxBs: retainer.tax, totalBs: retainer.total, taxName: country.taxName, taxRate: country.rate,
      })
    }
  }

  /* ——— persistencia: cotizaciones guardadas en el navegador ——— */
  const { docs, save, remove, duplicate } = useSavedDocuments<QuotePayload>('adtools-quotes')
  const [openDocId, setOpenDocId] = useState<string | null>(null)
  const [docName, setDocName] = useState('')

  const buildPayload = (): QuotePayload => ({
    model, countryCode, phases, costs, risk, profit,
    tiers, pkgCosts, impact, share, valHours, valCosts, valPrice,
    retHours, retDiscount, retMonths,
  })

  const applyPayload = (p: QuotePayload, id: string, name: string) => {
    setModel(p.model); setCountryCode(p.countryCode)
    setPhases(p.phases); setCosts(p.costs); setRisk(p.risk); setProfit(p.profit)
    setTiers(p.tiers); setPkgCosts(p.pkgCosts)
    setImpact(p.impact); setShare(p.share); setValHours(p.valHours); setValCosts(p.valCosts); setValPrice(p.valPrice)
    setRetHours(p.retHours); setRetDiscount(p.retDiscount); setRetMonths(p.retMonths)
    const maxId = Math.max(0, ...p.phases.map((x) => x.id), ...p.costs.map((x) => x.id), ...p.tiers.map((x) => x.id))
    if (maxId >= uid) uid = maxId + 1
    setOpenDocId(id)
    setDocName(name)
  }

  const handleSave = (name: string) => {
    const id = save(openDocId ? docName || name : name, buildPayload(), openDocId ?? undefined)
    setOpenDocId(id)
    setDocName(openDocId ? docName || name : name)
  }

  const handleLoad = (id: string) => {
    const d = docs.find((x) => x.id === id)
    if (d) applyPayload(d.payload, d.id, d.name)
  }

  const handleNew = () => {
    setModel('horas'); setCountryCode('VE')
    setPhases(DEFAULT_PHASES); setCosts([{ id: nextId(), name: 'Suscripciones / plugins', amount: '30' }])
    setRisk('10'); setProfit('20')
    setTiers(DEFAULT_TIERS); setPkgCosts('30')
    setImpact('5000'); setShare('15'); setValHours('20'); setValCosts('30'); setValPrice('')
    setRetHours('20'); setRetDiscount('10'); setRetMonths('6')
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

  const currentTotal =
    model === 'horas' ? horas.total
    : model === 'paquete' ? (paquete[1] ?? paquete[0])?.total ?? 0
    : model === 'valor' ? valor.total
    : retainer.total

  const currentLabel =
    model === 'horas' ? 'Precio total del proyecto'
    : model === 'paquete' ? 'Paquete recomendado'
    : model === 'valor' ? 'Precio del proyecto'
    : 'Mensualidad del retainer'

  return (
    <BrandShell tool={tool}>

      {/* ————— SAVED QUOTES ————— */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 pt-8 md:px-8">
          <SavedDocsPanel
            docs={docs}
            currentId={openDocId}
            onSave={handleSave}
            onLoad={handleLoad}
            onDuplicate={duplicate}
            onDelete={handleDelete}
            onNew={handleNew}
            saveLabel="Guardar cotización"
            listLabel="Cotizaciones guardadas"
            placeholder="Ej. Cliente X — rediseño web"
          />
          {docName && openDocId && (
            <p className="mt-2 font-mono text-[11px] text-inkmuted">
              Editando: <span className="font-semibold text-inksoft">{docName}</span> — los cambios no se guardan solos; pulsa «Guardar cambios».
            </p>
          )}
        </div>
      </section>

      {/* ————— MODEL SELECTOR ————— */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-10 md:px-8">
          <p className="field-label">Elige tu modelo de cotización — el que mejor se adapte a tu servicio</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {MODELS.map((m) => {
              const active = model === m.id
              return (
                <button
                  key={m.id}
                  onClick={() => setModel(m.id)}
                  className={`group rounded-2xl border p-5 text-left transition-all ${
                    active ? 'border-transparent text-white shadow-lg' : 'border-line bg-paper hover:border-inkmuted'
                  }`}
                  style={active ? { backgroundColor: 'var(--dark-panel, #1C1917)', boxShadow: '0 10px 30px rgba(28,25,23,0.25)' } : undefined}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                        active ? 'text-ink' : 'text-inksoft group-hover:text-ink'
                      }`}
                      style={{ backgroundColor: active ? ACCENT : `${ACCENT}14` }}
                    >
                      {m.icon}
                    </span>
                    <span className={`font-mono text-xs ${active ? 'text-white/40' : 'text-inkmuted'}`}>
                      {m.num}
                    </span>
                  </div>
                  <p className="mt-4 font-grotesk text-base font-bold tracking-tight">{m.name}</p>
                  <p className={`mt-1 text-[13px] leading-snug ${active ? 'text-white/60' : 'text-inksoft'}`}>
                    {m.desc}
                  </p>
                  <p className={`mt-3 font-mono text-[10px] uppercase tracking-wider ${active ? 'text-white/40' : 'text-inkmuted'}`}>
                    → {m.best}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl lg:grid-cols-[1fr_400px]">
        {/* ————— LEFT: model workspace ————— */}
        <div>
          {/* shared: base rate + tax */}
          <Step n="01" icon={<IconWallet />} title="Tu tarifa base y tu país">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="field-label">Ingreso mensual deseado ($)</label>
                <NumInput value={base.monthlyGoal} onChange={base.setMonthlyGoal} />
              </div>
              <div>
                <label className="field-label">Horas facturables / semana</label>
                <NumInput value={base.billableHours} onChange={base.setBillableHours} />
              </div>
              <div>
                <label className="field-label">Tarifa / hora (opcional)</label>
                <NumInput value={base.rateOverride} onChange={base.setRateOverride} placeholder={fmt(base.baseRate)} />
              </div>
              <div>
                <label className="field-label">Impuesto del país</label>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="field-box font-mono text-sm"
                >
                  {VAT_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.name} — {c.rate}%</option>
                  ))}
                </select>
              </div>
            </div>
            <p className="mt-4 font-mono text-xs text-inkmuted">
              → Tarifa sugerida: <span className="font-semibold text-ink">${fmt(base.rate)}/hora</span>
              {base.rateOverride && ' (personalizada)'} · calculada con 4,33 semanas/mes
            </p>
          </Step>

          {/* ————— MODELO A ————— */}
          {model === 'horas' && (
            <>
              <Step n="02" icon={<IconStack />} title="Fases del proyecto" right={<span className="font-mono text-xs text-inkmuted">{fmt(horas.effHours, 1)} h efectivas</span>}>
                <div className="space-y-4">
                  {phases.map((p) => (
                    <div key={p.id} className="grid grid-cols-[1fr_auto] items-end gap-3 sm:grid-cols-[1fr_90px_150px_auto_auto]">
                      <input
                        value={p.name}
                        onChange={(e) => setPhases((prev) => prev.map((x) => (x.id === p.id ? { ...x, name: e.target.value } : x)))}
                        placeholder="Nombre de la fase"
                        className="field-box py-2 text-sm"
                      />
                      <div>
                        <label className="field-label sm:hidden">Horas</label>
                        <NumInput value={p.hours} onChange={(v) => setPhases((prev) => prev.map((x) => (x.id === p.id ? { ...x, hours: v } : x)))} />
                      </div>
                      <select
                        value={p.factor}
                        onChange={(e) => setPhases((prev) => prev.map((x) => (x.id === p.id ? { ...x, factor: e.target.value } : x)))}
                        className="field-box py-2 font-mono text-sm"
                      >
                        {COMPLEXITY.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                      <span className="hidden py-1.5 font-mono text-sm tabular-nums text-inksoft sm:block">
                        ${fmt((parseFloat(p.hours.replace(',', '.')) || 0) * (parseFloat(p.factor.replace(',', '.')) || 1) * base.rate)}
                      </span>
                      <button
                        onClick={() => setPhases((prev) => prev.filter((x) => x.id !== p.id))}
                        className="py-1.5 text-inkmuted hover:text-ink" aria-label="Eliminar fase"
                      >✕</button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setPhases((prev) => [...prev, { id: nextId(), name: '', hours: '', factor: '1' }])}
                  className="mt-5 rounded-full border border-dashed border-inkmuted px-5 py-2 text-sm font-medium text-inksoft transition-colors hover:border-ink hover:text-ink"
                >
                  + Agregar fase
                </button>
              </Step>

              <Step n="03" icon={<IconReceipt />} title="Costos directos">
                <div className="space-y-4">
                  {costs.map((c) => (
                    <div key={c.id} className="grid grid-cols-[1fr_auto] items-end gap-3 sm:grid-cols-[1fr_120px_auto]">
                      <input
                        value={c.name}
                        onChange={(e) => setCosts((prev) => prev.map((x) => (x.id === c.id ? { ...x, name: e.target.value } : x)))}
                        placeholder="Ej. hosting, assets, transporte…"
                        className="field-box py-2 text-sm"
                      />
                      <NumInput value={c.amount} onChange={(v) => setCosts((prev) => prev.map((x) => (x.id === c.id ? { ...x, amount: v } : x)))} />
                      <button
                        onClick={() => setCosts((prev) => prev.filter((x) => x.id !== c.id))}
                        className="py-1.5 text-inkmuted hover:text-ink" aria-label="Eliminar costo"
                      >✕</button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setCosts((prev) => [...prev, { id: nextId(), name: '', amount: '' }])}
                  className="mt-5 rounded-full border border-dashed border-inkmuted px-5 py-2 text-sm font-medium text-inksoft transition-colors hover:border-ink hover:text-ink"
                >
                  + Agregar costo
                </button>
              </Step>

              <Step n="04" icon={<IconShield />} title="Contingencia y margen">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="field-label">Contingencia / riesgo %</label>
                    <NumInput value={risk} onChange={setRisk} />
                    <p className="mt-1 font-mono text-[10px] text-inkmuted">cubre imprevistos y cambios de alcance</p>
                  </div>
                  <div>
                    <label className="field-label">Margen de ganancia %</label>
                    <NumInput value={profit} onChange={setProfit} />
                    <p className="mt-1 font-mono text-[10px] text-inkmuted">tu crecimiento como negocio</p>
                  </div>
                </div>
              </Step>
            </>
          )}

          {/* ————— MODELO B ————— */}
          {model === 'paquete' && (
            <>
              <Step
                n="02"
                icon={<IconBox />}
                title="Define tus paquetes"
                right={
                  <HealthPill
                    ok={paquete.length ? paquete.every((t) => t.healthy) : null}
                    okText="Márgenes saludables"
                    badText="Algún paquete queda corto"
                  />
                }
              >
                <div className="grid gap-4 lg:grid-cols-3">
                  {paquete.map((t, i) => (
                    <div key={t.id} className={`rounded-2xl border p-5 ${i === 1 ? 'border-ink' : 'border-line'}`}>
                      <div className="flex items-center justify-between">
                        <input
                          value={t.name}
                          onChange={(e) => setTiers((prev) => prev.map((x) => (x.id === t.id ? { ...x, name: e.target.value } : x)))}
                          className="field-box w-32 px-3 py-1.5 font-grotesk text-base font-bold"
                        />
                        {i === 1 && (
                          <span className="rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold text-ink" style={{ backgroundColor: ACCENT }}>
                            popular
                          </span>
                        )}
                        {tiers.length > 1 && (
                          <button
                            onClick={() => setTiers((prev) => prev.filter((x) => x.id !== t.id))}
                            className="text-inkmuted hover:text-ink" aria-label="Quitar paquete"
                          >✕</button>
                        )}
                      </div>

                      <div className="relative mt-3">
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-lg text-inkmuted">$</span>
                        <input
                          type="text" inputMode="decimal" value={t.price}
                          onChange={(e) => setTiers((prev) => prev.map((x) => (x.id === t.id ? { ...x, price: e.target.value } : x)))}
                          placeholder="0"
                          className="field-box tool-num py-2 pl-9 text-2xl font-semibold"
                        />
                      </div>

                      <div className="mt-4 space-y-2">
                        {t.features.map((f, fi) => (
                          <div key={fi} className="flex items-center gap-2">
                            <span style={{ color: STEP_COLOR }}><IconCheck /></span>
                            <input
                              value={f}
                              onChange={(e) =>
                                setTiers((prev) =>
                                  prev.map((x) =>
                                    x.id === t.id
                                      ? { ...x, features: x.features.map((y, yi) => (yi === fi ? e.target.value : y)) }
                                      : x,
                                  ),
                                )
                              }
                              className="field-box px-3 py-1.5 text-[13px]"
                            />
                            <button
                              onClick={() =>
                                setTiers((prev) =>
                                  prev.map((x) =>
                                    x.id === t.id ? { ...x, features: x.features.filter((_, yi) => yi !== fi) } : x,
                                  ),
                                )
                              }
                              className="text-inkmuted hover:text-ink" aria-label="Quitar característica"
                            >✕</button>
                          </div>
                        ))}
                        <button
                          onClick={() =>
                            setTiers((prev) =>
                              prev.map((x) => (x.id === t.id ? { ...x, features: [...x.features, ''] } : x)),
                            )
                          }
                          className="mt-1 font-mono text-[11px] text-inkmuted underline underline-offset-4 hover:text-ink"
                        >
                          + característica
                        </button>
                      </div>

                      <div className="mt-4 border-t border-line pt-3">
                        <label className="field-label">Horas que te toma</label>
                        <NumInput value={t.hours} onChange={(v) => setTiers((prev) => prev.map((x) => (x.id === t.id ? { ...x, hours: v } : x)))} />
                      </div>

                      <div className="mt-4 rounded-xl bg-paper p-3 font-mono text-[11px] leading-relaxed">
                        <p className="flex justify-between"><span className="text-inkmuted">Costo interno</span><span>${fmt(t.cost)}</span></p>
                        <p className="flex justify-between">
                          <span className="text-inkmuted">Margen</span>
                          <span className={t.healthy ? 'text-emerald-600' : 'text-red-500'}>
                            {fmt(t.marginPct, 0)}%
                          </span>
                        </p>
                        <p className="flex justify-between"><span className="text-inkmuted">$/h efectivo</span><span>${fmt(t.effRate)}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
                {tiers.length < 3 && (
                  <button
                    onClick={() => setTiers((prev) => [...prev, { id: nextId(), name: 'Nuevo', price: '', features: [''], hours: '' }])}
                    className="mt-5 rounded-full border border-dashed border-inkmuted px-5 py-2 text-sm font-medium text-inksoft transition-colors hover:border-ink hover:text-ink"
                  >
                    + Agregar paquete
                  </button>
                )}
              </Step>

              <Step n="03" icon={<IconReceipt />} title="Costos directos por proyecto">
                <div className="max-w-xs">
                  <label className="field-label">Total en $ (herramientas, assets…)</label>
                  <NumInput value={pkgCosts} onChange={setPkgCosts} />
                </div>
                <p className="mt-3 font-mono text-[11px] leading-relaxed text-inkmuted">
                  Se suma a tu costo de tiempo para verificar que cada paquete deje al menos 20% de margen.
                </p>
              </Step>
            </>
          )}

          {/* ————— MODELO C ————— */}
          {model === 'valor' && (
            <>
              <Step n="02" icon={<IconTrend />} title="El impacto para tu cliente">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="field-label">Valor que generará el proyecto ($)</label>
                    <NumInput value={impact} onChange={setImpact} />
                    <p className="mt-1 font-mono text-[10px] text-inkmuted">
                      ventas adicionales, ahorro de tiempo, ingresos esperados…
                    </p>
                  </div>
                  <div>
                    <label className="field-label">Tu participación del valor — {share}%</label>
                    <input
                      type="range" min="5" max="30" value={share}
                      onChange={(e) => setShare(e.target.value)}
                      className="mt-3 w-full" style={{ accentColor: STEP_COLOR }}
                    />
                    <p className="mt-1 font-mono text-[10px] text-inkmuted">
                      lo habitual en value pricing: 10–20% del impacto
                    </p>
                  </div>
                </div>
                <div className="mt-6 rounded-2xl border border-line bg-paper p-5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-inkmuted">Precio sugerido por valor</p>
                  <p className="tool-num mt-1 text-4xl font-semibold">${fmt(valor.suggested)}</p>
                </div>
              </Step>

              <Step
                n="03"
                icon={<IconTag />}
                title="Tu precio final y verificación de costos"
                right={<HealthPill ok={valor.price > 0 ? valor.healthy : null} okText="Margen saludable" badText="Por debajo de tus costos" />}
              >
                <div className="grid gap-6 sm:grid-cols-3">
                  <div>
                    <label className="field-label">Tu precio ($)</label>
                    <NumInput value={valPrice} onChange={setValPrice} placeholder={fmt(valor.suggested, 0)} />
                  </div>
                  <div>
                    <label className="field-label">Horas estimadas</label>
                    <NumInput value={valHours} onChange={setValHours} />
                  </div>
                  <div>
                    <label className="field-label">Costos directos ($)</label>
                    <NumInput value={valCosts} onChange={setValCosts} />
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-3 font-mono text-xs">
                  <span className="rounded-full bg-paper px-3 py-1.5 text-inksoft">
                    Costo interno: ${fmt(valor.cost)}
                  </span>
                  <span className="rounded-full bg-paper px-3 py-1.5 text-inksoft">
                    Margen: <span className={valor.healthy ? 'text-emerald-600' : 'text-red-500'}>{fmt(valor.marginPct, 0)}%</span>
                  </span>
                  <span className="rounded-full bg-paper px-3 py-1.5 text-inksoft">
                    ${fmt(valor.effRate)}/h efectivo
                  </span>
                </div>
              </Step>
            </>
          )}

          {/* ————— MODELO D ————— */}
          {model === 'retainer' && (
            <>
              <Step n="02" icon={<IconRepeat />} title="El acuerdo mensual">
                <div className="grid gap-6 sm:grid-cols-3">
                  <div>
                    <label className="field-label">Horas mensuales</label>
                    <NumInput value={retHours} onChange={setRetHours} />
                    <p className="mt-1 font-mono text-[10px] text-inkmuted">
                      valor sin descuento: ${fmt(retainer.gross)}/mes
                    </p>
                  </div>
                  <div>
                    <label className="field-label">Descuento por fidelidad — {retDiscount}%</label>
                    <input
                      type="range" min="0" max="25" value={retDiscount}
                      onChange={(e) => setRetDiscount(e.target.value)}
                      className="mt-3 w-full" style={{ accentColor: STEP_COLOR }}
                    />
                    <p className="mt-1 font-mono text-[10px] text-inkmuted">
                      premia la recurrencia; lo habitual: 5–15%
                    </p>
                  </div>
                  <div>
                    <label className="field-label">Duración (meses)</label>
                    <NumInput value={retMonths} onChange={setRetMonths} />
                    <p className="mt-1 font-mono text-[10px] text-inkmuted">para proyectar el contrato total</p>
                  </div>
                </div>
              </Step>

              <Step n="03" icon={<IconSpark />} title="Qué incluye cada mes">
                <p className="max-w-lg text-sm leading-relaxed text-inksoft">
                  Define con tu cliente las entregas del bloque: por ejemplo mantenimiento,
                  ajustes de diseño, reportes o soporte prioritario. Las horas no usadas
                  no se acumulan al mes siguiente — escríbelo en el acuerdo.
                </p>
              </Step>
            </>
          )}
        </div>

        {/* ————— RIGHT: sticky result ————— */}
        <aside className="border-t border-line lg:border-l lg:border-t-0">
          <div className="sticky top-14 px-5 py-10 md:px-8">
            <p className="field-label">Resultado — {MODELS.find((m) => m.id === model)?.name}</p>

            {/* breakdown per model */}
            <div className="mt-4 border-y border-line text-sm">
              {model === 'horas' && (
                <>
                  <Row label={`Mano de obra (${fmt(horas.rows.reduce((a, p) => a + p.h * p.f, 0), 1)} h efectivas)`} value={`$${fmt(horas.labor)}`} />
                  <Row label="Costos directos" value={`$${fmt(horas.directCosts)}`} />
                  <Row label={`Contingencia ${risk}%`} value={`$${fmt(horas.riskAmt)}`} />
                  <Row label={`Margen ${profit}%`} value={`$${fmt(horas.profitAmt)}`} />
                  <Row label={`${country.taxName} ${country.rate}%`} value={`$${fmt(horas.tax)}`} last />
                </>
              )}
              {model === 'paquete' && paquete.map((t) => (
                <Row
                  key={t.id}
                  label={`${t.name}${t.healthy ? '' : ' ⚠'}`}
                  value={`$${fmt(t.priceNum)} + ${country.taxName}`}
                />
              ))}
              {model === 'valor' && (
                <>
                  <Row label="Precio sugerido (valor)" value={`$${fmt(valor.suggested)}`} />
                  <Row label="Tu precio" value={`$${fmt(valor.price)}`} />
                  <Row label={`${country.taxName} ${country.rate}%`} value={`$${fmt(valor.tax)}`} last />
                </>
              )}
              {model === 'retainer' && (
                <>
                  <Row label={`${fmt(retainer.hours, 0)} h × $${fmt(base.rate)}`} value={`$${fmt(retainer.gross)}`} />
                  <Row label={`Descuento ${retainer.discountPct}%`} value={`−$${fmt(retainer.gross - retainer.monthly)}`} />
                  <Row label={`${country.taxName} ${country.rate}%`} value={`$${fmt(retainer.tax)}`} last />
                </>
              )}
            </div>

            <div className="mt-6 rounded-2xl p-6" style={{ backgroundColor: ACCENT }}>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink/70">
                {currentLabel}
              </p>
              <p className="tool-num mt-1 text-5xl font-bold tracking-tighter text-ink">
                ${fmt(currentTotal)}
              </p>
              <div className="mt-4 space-y-1 border-t border-ink/15 pt-4 font-mono text-xs text-ink/80">
                {model === 'horas' && (
                  <>
                    <p>Piso mínimo aceptable: ${fmt(horas.min)}</p>
                    <p>Tarifa efectiva: ${fmt(horas.effRate)}/h</p>
                  </>
                )}
                {model === 'paquete' && (
                  <p>El cliente elige su paquete — verifica que todos cubran tus costos</p>
                )}
                {model === 'valor' && (
                  <>
                    <p>Piso mínimo (costos): ${fmt(valor.min)}</p>
                    <p>Margen: {fmt(valor.marginPct, 0)}% · ${fmt(valor.effRate)}/h</p>
                  </>
                )}
                {model === 'retainer' && (
                  <>
                    <p>Tarifa efectiva: ${fmt(retainer.effRate)}/h</p>
                    {retainer.months > 0 && <p>Contrato proyectado: ${fmt(retainer.contract)}</p>}
                  </>
                )}
              </div>
            </div>

            <button
              onClick={quoteForCurrent}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-ink py-3.5 text-sm font-semibold transition-colors hover:bg-ink hover:text-paper"
            >
              <IconReceipt className="h-4 w-4" />
              Generar orden de servicio
            </button>

            <div className="mt-5 flex items-start gap-2 font-mono text-[11px] leading-relaxed text-inkmuted">
              <span className="mt-0.5 shrink-0"><IconWarn className="h-3.5 w-3.5" /></span>
              <p>
                Los montos en la orden se muestran en dólares. Para el equivalente en bolívares,
                usa el modo avanzado de la calculadora de IVA con la tasa BCV del día.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {showQuote && quoteData && (
        <QuoteModal data={quoteData} onClose={() => setShowQuote(false)} />
      )}
    </BrandShell>
  )
}

function Row({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex justify-between py-3 ${last ? '' : 'border-b border-line'}`}>
      <span className="text-inksoft">{label}</span>
      <span className="tool-num">{value}</span>
    </div>
  )
}
