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
import { useT } from '@/lib/i18n'
import posthog from '@/lib/posthog'

const tool = TOOLS[4]
const ACCENT = tool.accent
const STEP_COLOR = '#B45309'

type ModelId = 'horas' | 'paquete' | 'valor' | 'retainer'

let uid = 1
const nextId = () => uid++

/* labels are i18n keys, resolved with t() at render time */
const COMPLEXITY = [
  { value: '0.8', label: 'sv.cx1' },
  { value: '1', label: 'sv.cx2' },
  { value: '1.2', label: 'sv.cx3' },
  { value: '1.5', label: 'sv.cx4' },
]

/* name/short/desc/best are i18n keys, resolved with t() at render time */
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
    name: 'sv.m.horas.name',
    short: 'sv.m.horas.short',
    desc: 'sv.m.horas.desc',
    best: 'sv.m.horas.best',
    icon: <IconClock />,
  },
  {
    id: 'paquete',
    num: 'B',
    name: 'sv.m.paquete.name',
    short: 'sv.m.paquete.short',
    desc: 'sv.m.paquete.desc',
    best: 'sv.m.paquete.best',
    icon: <IconBox />,
  },
  {
    id: 'valor',
    num: 'C',
    name: 'sv.m.valor.name',
    short: 'sv.m.valor.short',
    desc: 'sv.m.valor.desc',
    best: 'sv.m.valor.best',
    icon: <IconGem />,
  },
  {
    id: 'retainer',
    num: 'D',
    name: 'sv.m.retainer.name',
    short: 'sv.m.retainer.short',
    desc: 'sv.m.retainer.desc',
    best: 'sv.m.retainer.best',
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

/* Los nombres por defecto se generan con el idioma activo al crear la cotización;
   una vez guardados en localStorage son datos del usuario. */
type TFn = ReturnType<typeof useT>

const defaultPhases = (t: TFn): Phase[] => [
  { id: nextId(), name: t('sv.d.phase1'), hours: '4', factor: '1' },
  { id: nextId(), name: t('sv.d.phase2'), hours: '20', factor: '1' },
  { id: nextId(), name: t('sv.d.phase3'), hours: '6', factor: '1.2' },
]

const defaultCosts = (t: TFn): Cost[] => [{ id: nextId(), name: t('sv.d.cost'), amount: '30' }]

const defaultTiers = (t: TFn): Tier[] => [
  { id: nextId(), name: t('sv.d.tier1'), price: '300', features: [t('sv.d.f1'), t('sv.d.f2')], hours: '15' },
  { id: nextId(), name: t('sv.d.tier2'), price: '550', features: [t('sv.d.f3'), t('sv.d.f4'), t('sv.d.f5')], hours: '25' },
  { id: nextId(), name: t('sv.d.tier3'), price: '900', features: [t('sv.d.f6'), t('sv.d.f7'), t('sv.d.f8')], hours: '40' },
]

export default function ServiciosPage() {
  const t = useT()
  const [model, setModel] = useState<ModelId>('horas')
  const [countryCode, setCountryCode] = useState('VE')
  const [showQuote, setShowQuote] = useState(false)
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null)

  const base = useBaseRate()
  const country = VAT_COUNTRIES.find((c) => c.code === countryCode)!

  /* ——— MODELO A: horas ——— */
  const [phases, setPhases] = useState<Phase[]>(() => defaultPhases(t))
  const [costs, setCosts] = useState<Cost[]>(() => defaultCosts(t))
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
  const [tiers, setTiers] = useState<Tier[]>(() => defaultTiers(t))
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
    posthog.capture('service_order_generated', { source: 'pricing_tool', pricing_model: model })
    setQuoteData(data)
    setShowQuote(true)
  }

  const quoteForCurrent = () => {
    if (model === 'horas') {
      openQuote({
        service: t('sv.q.horas', { h: fmt(horas.totalHours, 1) }),
        amountUSD: horas.net, rateBs: 1, subtotalBs: horas.net,
        taxBs: horas.tax, totalBs: horas.total, taxName: country.taxName, taxRate: country.rate,
      })
    } else if (model === 'paquete') {
      const tier = paquete[1] ?? paquete[0] // Estándar o el primero
      if (!tier) return
      openQuote({
        service: t('sv.q.paquete', { name: tier.name, feat: tier.features.join(' · ') }),
        amountUSD: tier.priceNum, rateBs: 1, subtotalBs: tier.priceNum,
        taxBs: tier.tax, totalBs: tier.total, taxName: country.taxName, taxRate: country.rate,
      })
    } else if (model === 'valor') {
      openQuote({
        service: t('sv.q.valor'),
        amountUSD: valor.price, rateBs: 1, subtotalBs: valor.price,
        taxBs: valor.tax, totalBs: valor.total, taxName: country.taxName, taxRate: country.rate,
      })
    } else {
      openQuote({
        service: retainer.months > 0
          ? t('sv.q.retainer', { h: fmt(retainer.hours, 0), m: retainer.months })
          : t('sv.q.retainerShort', { h: fmt(retainer.hours, 0) }),
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
    posthog.capture('quote_saved', { pricing_model: model, is_existing_quote: Boolean(openDocId) })
    setOpenDocId(id)
    setDocName(openDocId ? docName || name : name)
  }

  const handleLoad = (id: string) => {
    const d = docs.find((x) => x.id === id)
    if (d) applyPayload(d.payload, d.id, d.name)
  }

  const handleNew = () => {
    setModel('horas'); setCountryCode('VE')
    setPhases(defaultPhases(t)); setCosts(defaultCosts(t))
    setRisk('10'); setProfit('20')
    setTiers(defaultTiers(t)); setPkgCosts('30')
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
    model === 'horas' ? t('sv.lbl.horas')
    : model === 'paquete' ? t('sv.lbl.paquete')
    : model === 'valor' ? t('sv.lbl.valor')
    : t('sv.lbl.retainer')

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
            saveLabel={t('sv.saveLabel')}
            listLabel={t('sv.listLabel')}
            placeholder={t('docs.placeholder')}
          />
          {docName && openDocId && (
            <p className="mt-2 font-mono text-[11px] text-inkmuted">
              {t('docs.editing')} <span className="font-semibold text-inksoft">{docName}</span> {t('docs.unsaved')}
            </p>
          )}
        </div>
      </section>

      {/* ————— MODEL SELECTOR ————— */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-10 md:px-8">
          <p className="field-label">{t('sv.pick')}</p>
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
                  <p className="mt-4 font-grotesk text-base font-bold tracking-tight">{t(m.name)}</p>
                  <p className={`mt-1 text-[13px] leading-snug ${active ? 'text-white/60' : 'text-inksoft'}`}>
                    {t(m.desc)}
                  </p>
                  <p className={`mt-3 font-mono text-[10px] uppercase tracking-wider ${active ? 'text-white/40' : 'text-inkmuted'}`}>
                    → {t(m.best)}
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
          <Step n="01" icon={<IconWallet />} title={t('sv.base')}>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="field-label" htmlFor="sv-monthly-goal">{t('sv.income')}</label>
                <NumInput id="sv-monthly-goal" value={base.monthlyGoal} onChange={base.setMonthlyGoal} />
              </div>
              <div>
                <label className="field-label" htmlFor="sv-billable-hours">{t('sv.billable')}</label>
                <NumInput id="sv-billable-hours" value={base.billableHours} onChange={base.setBillableHours} />
              </div>
              <div>
                <label className="field-label" htmlFor="sv-rate-override">{t('sv.rateOverride')}</label>
                <NumInput id="sv-rate-override" value={base.rateOverride} onChange={base.setRateOverride} placeholder={fmt(base.baseRate)} />
              </div>
              <div>
                <label className="field-label" htmlFor="sv-country-tax">{t('sv.countryTax')}</label>
                <select
                  id="sv-country-tax"
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
              {t('sv.suggestedRate')} <span className="font-semibold text-ink">${fmt(base.rate)}{t('sv.perHour')}</span>
              {base.rateOverride && t('sv.customized')}{t('sv.weeksNote')}
            </p>
          </Step>

          {/* ————— MODELO A ————— */}
          {model === 'horas' && (
            <>
              <Step n="02" icon={<IconStack />} title={t('sv.phases')} right={<span className="font-mono text-xs text-inkmuted">{fmt(horas.effHours, 1)} {t('sv.effHours')}</span>}>
                <div className="space-y-4">
                  {phases.map((p) => (
                    <div key={p.id} className="grid grid-cols-[1fr_auto] items-end gap-3 sm:grid-cols-[1fr_90px_150px_auto_auto]">
                      <input
                        value={p.name}
                        onChange={(e) => setPhases((prev) => prev.map((x) => (x.id === p.id ? { ...x, name: e.target.value } : x)))}
                        placeholder={t('sv.phasePh')}
                        className="field-box py-2 text-sm"
                      />
                      <div>
                        <label className="field-label sm:hidden" htmlFor={`sv-phase-${p.id}-hours`}>{t('sv.hours')}</label>
                        <NumInput id={`sv-phase-${p.id}-hours`} value={p.hours} onChange={(v) => setPhases((prev) => prev.map((x) => (x.id === p.id ? { ...x, hours: v } : x)))} />
                      </div>
                      <select
                        value={p.factor}
                        onChange={(e) => setPhases((prev) => prev.map((x) => (x.id === p.id ? { ...x, factor: e.target.value } : x)))}
                        className="field-box py-2 font-mono text-sm"
                      >
                        {COMPLEXITY.map((c) => <option key={c.value} value={c.value}>{t(c.label)}</option>)}
                      </select>
                      <span className="hidden py-1.5 font-mono text-sm tabular-nums text-inksoft sm:block">
                        ${fmt((parseFloat(p.hours.replace(',', '.')) || 0) * (parseFloat(p.factor.replace(',', '.')) || 1) * base.rate)}
                      </span>
                      <button
                        onClick={() => setPhases((prev) => prev.filter((x) => x.id !== p.id))}
                        className="py-1.5 text-inkmuted hover:text-ink" aria-label={t('sv.delPhase')}
                      >✕</button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setPhases((prev) => [...prev, { id: nextId(), name: '', hours: '', factor: '1' }])}
                  className="mt-5 rounded-full border border-dashed border-inkmuted px-5 py-2 text-sm font-medium text-inksoft transition-colors hover:border-ink hover:text-ink"
                >
                  {t('sv.addPhase')}
                </button>
              </Step>

              <Step n="03" icon={<IconReceipt />} title={t('sv.directCosts')}>
                <div className="space-y-4">
                  {costs.map((c) => (
                    <div key={c.id} className="grid grid-cols-[1fr_auto] items-end gap-3 sm:grid-cols-[1fr_120px_auto]">
                      <input
                        value={c.name}
                        onChange={(e) => setCosts((prev) => prev.map((x) => (x.id === c.id ? { ...x, name: e.target.value } : x)))}
                        placeholder={t('sv.costPh')}
                        className="field-box py-2 text-sm"
                      />
                      <NumInput value={c.amount} onChange={(v) => setCosts((prev) => prev.map((x) => (x.id === c.id ? { ...x, amount: v } : x)))} />
                      <button
                        onClick={() => setCosts((prev) => prev.filter((x) => x.id !== c.id))}
                        className="py-1.5 text-inkmuted hover:text-ink" aria-label={t('sv.delCost')}
                      >✕</button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setCosts((prev) => [...prev, { id: nextId(), name: '', amount: '' }])}
                  className="mt-5 rounded-full border border-dashed border-inkmuted px-5 py-2 text-sm font-medium text-inksoft transition-colors hover:border-ink hover:text-ink"
                >
                  {t('sv.addCost')}
                </button>
              </Step>

              <Step n="04" icon={<IconShield />} title={t('sv.contingency')}>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="field-label" htmlFor="sv-risk">{t('sv.risk')}</label>
                    <NumInput id="sv-risk" value={risk} onChange={setRisk} />
                    <p className="mt-1 font-mono text-[10px] text-inkmuted">{t('sv.riskHint')}</p>
                  </div>
                  <div>
                    <label className="field-label" htmlFor="sv-profit">{t('sv.profit')}</label>
                    <NumInput id="sv-profit" value={profit} onChange={setProfit} />
                    <p className="mt-1 font-mono text-[10px] text-inkmuted">{t('sv.profitHint')}</p>
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
                title={t('sv.pkgs')}
                right={
                  <HealthPill
                    ok={paquete.length ? paquete.every((p) => p.healthy) : null}
                    okText={t('sv.marginsOk')}
                    badText={t('sv.marginsBad')}
                  />
                }
              >
                <div className="grid gap-4 lg:grid-cols-3">
                  {paquete.map((pk, i) => (
                    <div key={pk.id} className={`rounded-2xl border p-5 ${i === 1 ? 'border-ink' : 'border-line'}`}>
                      <div className="flex items-center justify-between">
                        <input
                          value={pk.name}
                          onChange={(e) => setTiers((prev) => prev.map((x) => (x.id === pk.id ? { ...x, name: e.target.value } : x)))}
                          className="field-box w-32 px-3 py-1.5 font-grotesk text-base font-bold"
                        />
                        {i === 1 && (
                          <span className="rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold text-ink" style={{ backgroundColor: ACCENT }}>
                            {t('sv.popular')}
                          </span>
                        )}
                        {tiers.length > 1 && (
                          <button
                            onClick={() => setTiers((prev) => prev.filter((x) => x.id !== pk.id))}
                            className="text-inkmuted hover:text-ink" aria-label={t('sv.delPkg')}
                          >✕</button>
                        )}
                      </div>

                      <div className="relative mt-3">
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-lg text-inkmuted">$</span>
                        <input
                          type="text" inputMode="decimal" value={pk.price}
                          onChange={(e) => setTiers((prev) => prev.map((x) => (x.id === pk.id ? { ...x, price: e.target.value } : x)))}
                          placeholder="0"
                          className="field-box tool-num py-2 pl-9 text-2xl font-semibold"
                        />
                      </div>

                      <div className="mt-4 space-y-2">
                        {pk.features.map((f, fi) => (
                          <div key={fi} className="flex items-center gap-2">
                            <span style={{ color: STEP_COLOR }}><IconCheck /></span>
                            <input
                              value={f}
                              onChange={(e) =>
                                setTiers((prev) =>
                                  prev.map((x) =>
                                    x.id === pk.id
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
                                    x.id === pk.id ? { ...x, features: x.features.filter((_, yi) => yi !== fi) } : x,
                                  ),
                                )
                              }
                              className="text-inkmuted hover:text-ink" aria-label={t('sv.delFeature')}
                            >✕</button>
                          </div>
                        ))}
                        <button
                          onClick={() =>
                            setTiers((prev) =>
                              prev.map((x) => (x.id === pk.id ? { ...x, features: [...x.features, ''] } : x)),
                            )
                          }
                          className="mt-1 font-mono text-[11px] text-inkmuted underline underline-offset-4 hover:text-ink"
                        >
                          {t('sv.addFeature')}
                        </button>
                      </div>

                      <div className="mt-4 border-t border-line pt-3">
                        <label className="field-label" htmlFor={`sv-tier-${pk.id}-hours`}>{t('sv.pkgHours')}</label>
                        <NumInput id={`sv-tier-${pk.id}-hours`} value={pk.hours} onChange={(v) => setTiers((prev) => prev.map((x) => (x.id === pk.id ? { ...x, hours: v } : x)))} />
                      </div>

                      <div className="mt-4 rounded-xl bg-paper p-3 font-mono text-[11px] leading-relaxed">
                        <p className="flex justify-between"><span className="text-inkmuted">{t('sv.internalCost')}</span><span>${fmt(pk.cost)}</span></p>
                        <p className="flex justify-between">
                          <span className="text-inkmuted">{t('sv.margin')}</span>
                          <span className={pk.healthy ? 'text-emerald-600' : 'text-red-500'}>
                            {fmt(pk.marginPct, 0)}%
                          </span>
                        </p>
                        <p className="flex justify-between"><span className="text-inkmuted">{t('sv.effRateH')}</span><span>${fmt(pk.effRate)}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
                {tiers.length < 3 && (
                  <button
                    onClick={() => setTiers((prev) => [...prev, { id: nextId(), name: t('sv.newPkg'), price: '', features: [''], hours: '' }])}
                    className="mt-5 rounded-full border border-dashed border-inkmuted px-5 py-2 text-sm font-medium text-inksoft transition-colors hover:border-ink hover:text-ink"
                  >
                    {t('sv.addPkg')}
                  </button>
                )}
              </Step>

              <Step n="03" icon={<IconReceipt />} title={t('sv.pkgCosts')}>
                <div className="max-w-xs">
                  <label className="field-label" htmlFor="sv-pkg-costs">{t('sv.pkgCostsLabel')}</label>
                  <NumInput id="sv-pkg-costs" value={pkgCosts} onChange={setPkgCosts} />
                </div>
                <p className="mt-3 font-mono text-[11px] leading-relaxed text-inkmuted">
                  {t('sv.pkgCostsNote')}
                </p>
              </Step>
            </>
          )}

          {/* ————— MODELO C ————— */}
          {model === 'valor' && (
            <>
              <Step n="02" icon={<IconTrend />} title={t('sv.impact')}>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="field-label" htmlFor="sv-impact-value">{t('sv.impactValue')}</label>
                    <NumInput id="sv-impact-value" value={impact} onChange={setImpact} />
                    <p className="mt-1 font-mono text-[10px] text-inkmuted">
                      {t('sv.impactHint')}
                    </p>
                  </div>
                  <div>
                    <label className="field-label" htmlFor="sv-share">{t('sv.share', { s: share })}</label>
                    <input
                      id="sv-share"
                      type="range" min="5" max="30" value={share}
                      onChange={(e) => setShare(e.target.value)}
                      className="mt-3 w-full" style={{ accentColor: STEP_COLOR }}
                    />
                    <p className="mt-1 font-mono text-[10px] text-inkmuted">
                      {t('sv.shareHint')}
                    </p>
                  </div>
                </div>
                <div className="mt-6 rounded-2xl border border-line bg-paper p-5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-inkmuted">{t('sv.suggestedByValue')}</p>
                  <p className="tool-num mt-1 text-4xl font-semibold">${fmt(valor.suggested)}</p>
                </div>
              </Step>

              <Step
                n="03"
                icon={<IconTag />}
                title={t('sv.finalPrice')}
                right={<HealthPill ok={valor.price > 0 ? valor.healthy : null} okText={t('sv.marginOk')} badText={t('sv.marginBad')} />}
              >
                <div className="grid gap-6 sm:grid-cols-3">
                  <div>
                    <label className="field-label" htmlFor="sv-your-price">{t('sv.yourPrice')}</label>
                    <NumInput id="sv-your-price" value={valPrice} onChange={setValPrice} placeholder={fmt(valor.suggested, 0)} />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="sv-val-hours">{t('sv.estHours')}</label>
                    <NumInput id="sv-val-hours" value={valHours} onChange={setValHours} />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="sv-val-costs">{t('sv.directCostsUsd')}</label>
                    <NumInput id="sv-val-costs" value={valCosts} onChange={setValCosts} />
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-3 font-mono text-xs">
                  <span className="rounded-full bg-paper px-3 py-1.5 text-inksoft">
                    {t('sv.internalCost')}: ${fmt(valor.cost)}
                  </span>
                  <span className="rounded-full bg-paper px-3 py-1.5 text-inksoft">
                    {t('sv.margin')}: <span className={valor.healthy ? 'text-emerald-600' : 'text-red-500'}>{fmt(valor.marginPct, 0)}%</span>
                  </span>
                  <span className="rounded-full bg-paper px-3 py-1.5 text-inksoft">
                    {t('sv.effPill', { v: fmt(valor.effRate) })}
                  </span>
                </div>
              </Step>
            </>
          )}

          {/* ————— MODELO D ————— */}
          {model === 'retainer' && (
            <>
              <Step n="02" icon={<IconRepeat />} title={t('sv.retAgreement')}>
                <div className="grid gap-6 sm:grid-cols-3">
                  <div>
                    <label className="field-label" htmlFor="sv-ret-hours">{t('sv.retHours')}</label>
                    <NumInput id="sv-ret-hours" value={retHours} onChange={setRetHours} />
                    <p className="mt-1 font-mono text-[10px] text-inkmuted">
                      {t('sv.retGross', { v: fmt(retainer.gross) })}
                    </p>
                  </div>
                  <div>
                    <label className="field-label" htmlFor="sv-ret-discount">{t('sv.retDiscount', { d: retDiscount })}</label>
                    <input
                      id="sv-ret-discount"
                      type="range" min="0" max="25" value={retDiscount}
                      onChange={(e) => setRetDiscount(e.target.value)}
                      className="mt-3 w-full" style={{ accentColor: STEP_COLOR }}
                    />
                    <p className="mt-1 font-mono text-[10px] text-inkmuted">
                      {t('sv.retDiscountHint')}
                    </p>
                  </div>
                  <div>
                    <label className="field-label" htmlFor="sv-ret-months">{t('sv.retMonths')}</label>
                    <NumInput id="sv-ret-months" value={retMonths} onChange={setRetMonths} />
                    <p className="mt-1 font-mono text-[10px] text-inkmuted">{t('sv.retMonthsHint')}</p>
                  </div>
                </div>
              </Step>

              <Step n="03" icon={<IconSpark />} title={t('sv.retIncludes')}>
                <p className="max-w-lg text-sm leading-relaxed text-inksoft">
                  {t('sv.retIncludesText')}
                </p>
              </Step>
            </>
          )}
        </div>

        {/* ————— RIGHT: sticky result ————— */}
        <aside className="border-t border-line lg:border-l lg:border-t-0">
          <div className="sticky top-14 px-5 py-10 md:px-8">
            <p className="field-label">{t('sv.result', { model: t(MODELS.find((m) => m.id === model)?.name ?? '') })}</p>

            {/* breakdown per model */}
            <div className="mt-4 border-y border-line text-sm">
              {model === 'horas' && (
                <>
                  <Row label={t('sv.labor', { h: fmt(horas.rows.reduce((a, p) => a + p.h * p.f, 0), 1) })} value={`$${fmt(horas.labor)}`} />
                  <Row label={t('sv.directCosts')} value={`$${fmt(horas.directCosts)}`} />
                  <Row label={t('sv.contingencyRow', { r: risk })} value={`$${fmt(horas.riskAmt)}`} />
                  <Row label={t('sv.marginRow', { p: profit })} value={`$${fmt(horas.profitAmt)}`} />
                  <Row label={`${country.taxName} ${country.rate}%`} value={`$${fmt(horas.tax)}`} last />
                </>
              )}
              {model === 'paquete' && paquete.map((pk) => (
                <Row
                  key={pk.id}
                  label={`${pk.name}${pk.healthy ? '' : ' ⚠'}`}
                  value={`$${fmt(pk.priceNum)} + ${country.taxName}`}
                />
              ))}
              {model === 'valor' && (
                <>
                  <Row label={t('sv.suggestedValueRow')} value={`$${fmt(valor.suggested)}`} />
                  <Row label={t('sv.yourPriceRow')} value={`$${fmt(valor.price)}`} />
                  <Row label={`${country.taxName} ${country.rate}%`} value={`$${fmt(valor.tax)}`} last />
                </>
              )}
              {model === 'retainer' && (
                <>
                  <Row label={`${fmt(retainer.hours, 0)} h × $${fmt(base.rate)}`} value={`$${fmt(retainer.gross)}`} />
                  <Row label={t('sv.discountRow', { d: retainer.discountPct })} value={`−$${fmt(retainer.gross - retainer.monthly)}`} />
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
                    <p>{t('sv.floor', { v: fmt(horas.min) })}</p>
                    <p>{t('sv.effRate', { v: fmt(horas.effRate) })}</p>
                  </>
                )}
                {model === 'paquete' && (
                  <p>{t('sv.pkgNote')}</p>
                )}
                {model === 'valor' && (
                  <>
                    <p>{t('sv.floorCosts', { v: fmt(valor.min) })}</p>
                    <p>{t('sv.margin')}: {fmt(valor.marginPct, 0)}% · ${fmt(valor.effRate)}/h</p>
                  </>
                )}
                {model === 'retainer' && (
                  <>
                    <p>{t('sv.effRate', { v: fmt(retainer.effRate) })}</p>
                    {retainer.months > 0 && <p>{t('sv.contract', { v: fmt(retainer.contract) })}</p>}
                  </>
                )}
              </div>
            </div>

            <button
              onClick={quoteForCurrent}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-ink py-3.5 text-sm font-semibold transition-colors hover:bg-ink hover:text-paper"
            >
              <IconReceipt className="h-4 w-4" />
              {t('iva.generate')}
            </button>

            <div className="mt-5 flex items-start gap-2 font-mono text-[11px] leading-relaxed text-inkmuted">
              <span className="mt-0.5 shrink-0"><IconWarn className="h-3.5 w-3.5" /></span>
              <p>
                {t('sv.warn')}
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
