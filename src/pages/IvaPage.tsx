import { useEffect, useId, useRef, useState } from 'react'
import BrandShell from '@/components/BrandShell'
import InfoNote from '@/components/InfoNote'
import QuoteModal, { type QuoteData } from '@/components/QuoteModal'
import { TOOLS } from '@/lib/tools'
import { VAT_COUNTRIES, vatCountryName, vatTaxName } from '@/lib/vat'
import { getTaxNote } from '@/lib/taxNotes'
import { fmt } from '@/lib/format'
import { calcIgtf, calcTax, parseAmount, sanitizeAmount } from '@/lib/taxCalc'
import { useVeRates } from '@/hooks/useVeRates'
import { dateLocale, useLang, useT } from '@/lib/i18n'
import posthog from '@/lib/posthog'

const tool = TOOLS.find((t) => t.path === '#/iva')!
const ACCENT = tool.accent
const ACCENT_SOFT = '#9FB2FF'

const LS_KEY = 'adtools-tax-note-seen'
type CalcMode = 'simple' | 'avanzado'
type FxSource = 'USD_BCV' | 'EUR_BCV' | 'USDT' | 'CUSTOM'
type SimpleCur = 'BS' | 'FX'
type AdvItem = { id: number; name: string; amount: string }

const flagUrl = (code: string) =>
  code === 'CUSTOM' ? '' : `https://flagcdn.com/w80/${code.toLowerCase()}.png`

/** Transformación de una tecla del teclado en pantalla sobre el valor actual */
const keyTransform = (key: string) => (prev: string): string => {
  if (key === 'C') return ''
  if (key === '⌫') return prev.slice(0, -1)
  if (key === ',') return prev.includes(',') ? prev : (prev || '0') + ','
  if (key === '0' && prev === '') return '0'
  if (prev === '0') return /^0+$/.test(key) ? prev : key.replace(/^0+/, '') || '0'
  const next = prev + key
  const [int, dec] = next.split(',')
  if (int.length > 12) return prev
  if (dec !== undefined && dec.length > 2) return prev
  return next
}

/* ————— Country selector with flags (combobox ARIA select-only) ————— */
function CountrySelect({
  value,
  onChange,
  dark = false,
}: {
  value: string
  onChange: (code: string) => void
  dark?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const listId = useId()
  const t = useT()
  const { lang } = useLang()
  const selected = VAT_COUNTRIES.find((c) => c.code === value)
  const isCustom = value === 'CUSTOM'

  // opciones en orden de render: países + "tasa libre" al final
  const codes = [...VAT_COUNTRIES.map((c) => c.code), 'CUSTOM']
  const optId = (i: number) => `${listId}-opt-${codes[i]}`

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  useEffect(() => {
    if (open) document.getElementById(optId(activeIdx))?.scrollIntoView({ block: 'nearest' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeIdx])

  const openList = () => {
    const cur = codes.indexOf(value)
    setActiveIdx(cur === -1 ? 0 : cur)
    setOpen(true)
  }

  const select = (code: string) => {
    onChange(code)
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        openList()
      }
      return
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIdx((i) => Math.min(codes.length - 1, i + 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIdx((i) => Math.max(0, i - 1))
        break
      case 'Home':
        e.preventDefault()
        setActiveIdx(0)
        break
      case 'End':
        e.preventDefault()
        setActiveIdx(codes.length - 1)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        select(codes[activeIdx])
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        break
      case 'Tab':
        setOpen(false)
        break
    }
  }

  const optionClass = (idx: number, extra = '') =>
    `flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
      idx === activeIdx ? 'bg-line/60' : 'hover:bg-line/40'
    } ${extra}`

  return (
    <div ref={ref} className="relative">
      <button
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        aria-activedescendant={open ? optId(activeIdx) : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
          dark
            ? 'border-white/10 bg-white/5 hover:border-white/25'
            : 'border-line bg-paper hover:border-inkmuted'
        }`}
      >
        {!isCustom && selected ? (
          <img src={flagUrl(selected.code)} alt="" className="h-5 w-7 rounded-[3px] object-cover shadow-sm" />
        ) : (
          <span className="flex h-5 w-7 items-center justify-center rounded-[3px] bg-line text-[10px] font-bold text-inksoft">
            %
          </span>
        )}
        <span className="flex-1">
          <span className={`block text-sm font-semibold ${dark ? 'text-white' : ''}`}>
            {isCustom || !selected ? t('iva.otherCountry') : vatCountryName(selected, lang)}
          </span>
          <span className={`block font-mono text-[11px] ${dark ? 'text-white/40' : 'text-inkmuted'}`}>
            {isCustom || !selected
              ? t('iva.otherCountrySub')
              : `${selected.rate}% ${vatTaxName(selected, lang)}`}
          </span>
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''} ${dark ? 'text-white/40' : 'text-inkmuted'}`}
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-30 mt-2 max-h-72 overflow-y-auto rounded-xl border border-line bg-paper shadow-xl shadow-ink/5"
        >
          {VAT_COUNTRIES.map((c, i) => (
            <button
              key={c.code}
              id={optId(i)}
              role="option"
              aria-selected={value === c.code}
              tabIndex={-1}
              onClick={() => select(c.code)}
              onMouseEnter={() => setActiveIdx(i)}
              className={optionClass(i)}
            >
              <img src={flagUrl(c.code)} alt="" className="h-5 w-7 rounded-[3px] object-cover shadow-sm" />
              <span className="flex-1 text-sm font-medium">{vatCountryName(c, lang)}</span>
              <span className="font-mono text-xs text-inkmuted">
                {c.rate}% {vatTaxName(c, lang)}
              </span>
            </button>
          ))}
          <button
            id={optId(codes.length - 1)}
            role="option"
            aria-selected={isCustom}
            tabIndex={-1}
            onClick={() => select('CUSTOM')}
            onMouseEnter={() => setActiveIdx(codes.length - 1)}
            className={optionClass(codes.length - 1, 'border-t border-line')}
          >
            <span className="flex h-5 w-7 items-center justify-center rounded-[3px] bg-line text-[10px] font-bold text-inksoft">
              %
            </span>
            <span className="flex-1 text-sm font-medium">{t('iva.otherCountry')}</span>
            <span className="font-mono text-xs text-inkmuted">{t('iva.customTag')}</span>
          </button>
        </div>
      )}
    </div>
  )
}

/* ————— Shared keypad ————— */
function Keypad({ onPress }: { onPress: (k: string) => void }) {
  const t = useT()
  const btn =
    'rounded-xl bg-white/5 py-4 font-mono text-xl text-white transition-colors hover:bg-white/15 active:scale-95'
  const util =
    'rounded-xl bg-white/10 py-4 font-mono text-lg font-semibold text-white/80 transition-colors hover:bg-white/20 active:scale-95'
  return (
    <div className="grid grid-cols-4 gap-2 border-t border-white/10 p-4">
      <button onClick={() => onPress('C')} className={util}>C</button>
      <button onClick={() => onPress('⌫')} className={util} aria-label={t('iva.delete')}>⌫</button>
      <button onClick={() => onPress(',')} className={btn}>,</button>
      <button onClick={() => onPress('00')} className={btn}>00</button>
      {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map((k) => (
        <button key={k} onClick={() => onPress(k)} className={btn}>{k}</button>
      ))}
      <button onClick={() => onPress('0')} className={`${btn} col-span-2`}>0</button>
      <button onClick={() => onPress('000')} className={btn}>000</button>
    </div>
  )
}

/* ————— Keypad toggle ————— */
function KeypadToggle({
  open,
  onToggle,
}: {
  open: boolean
  onToggle: () => void
}) {
  const t = useT()
  return (
    <button
      onClick={onToggle}
      className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-white/10 py-2.5 font-mono text-xs text-white/50 transition-colors hover:border-white/25 hover:text-white"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M7 9h.01M11 9h.01M15 9h.01M7 13h.01M11 13h.01M15 13h.01M7 17h10" strokeLinecap="round" />
      </svg>
      {open ? t('iva.keypadHide') : t('iva.keypadShow')}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}
      >
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

export default function IvaPage() {
  const t = useT()
  const { lang } = useLang()
  const [countryCode, setCountryCode] = useState('VE')
  const [customRate, setCustomRate] = useState('')
  const [raw, setRaw] = useState('')
  const [mode, setMode] = useState<'add' | 'extract'>('add')
  const [copied, setCopied] = useState(false)
  const [calcMode, setCalcMode] = useState<CalcMode>('simple')
  const [noteSeen, setNoteSeen] = useState(() => {
    try {
      return !!localStorage.getItem(LS_KEY)
    } catch {
      return false
    }
  })
  const [keypadOpen, setKeypadOpen] = useState(false)
  const [igtf, setIgtf] = useState(false)
  const [simpleCur, setSimpleCur] = useState<SimpleCur>('BS')
  // shared fx (simple VE + advanced)
  const [fxSource, setFxSource] = useState<FxSource>('USD_BCV')
  const [customFx, setCustomFx] = useState('')
  // advanced
  const [serviceName, setServiceName] = useState('')
  const [advItems, setAdvItems] = useState<AdvItem[]>([{ id: 1, name: '', amount: '' }])
  const [activeItemId, setActiveItemId] = useState(1)
  const nextItemId = useRef(2)
  const [showQuote, setShowQuote] = useState(false)
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { rates, status, updatedAt, reload } = useVeRates()

  const country = VAT_COUNTRIES.find((c) => c.code === countryCode)
  const isCustom = countryCode === 'CUSTOM'
  const isVE = countryCode === 'VE'
  const rate = isCustom ? parseAmount(customRate) : country?.rate ?? 0
  const taxName = isCustom || !country ? t('iva.customTax') : vatTaxName(country, lang)
  const countryName = isCustom || !country ? t('iva.customCountry') : vatCountryName(country, lang)
  const currency = isCustom ? '$' : country?.currency ?? '$'

  /* ———— FX (shared) ———— */
  const fxRate = fxSource === 'CUSTOM' ? parseAmount(customFx) : rates[fxSource] ?? 0
  const fxSymbol = fxSource === 'EUR_BCV' ? '€' : '$'
  const fxOptions: { key: FxSource; label: string; value: number | null }[] = [
    { key: 'USD_BCV', label: '$ BCV', value: rates.USD_BCV },
    { key: 'EUR_BCV', label: '€ BCV', value: rates.EUR_BCV },
    { key: 'USDT', label: 'USDT', value: rates.USDT },
    { key: 'CUSTOM', label: t('iva.fxOther'), value: null },
  ]

  /* ———— SIMPLE MODE ———— */
  const simpleFx = isVE && simpleCur === 'FX'
  const inputAmount = parseAmount(raw)
  const baseAmount = simpleFx ? inputAmount * fxRate : inputAmount
  const result = calcTax(baseAmount, rate, mode)
  const hasAmount = inputAmount > 0

  /* ———— IGTF (Venezuela: 3% sobre pagos en divisas) ———— */
  const showIgtf = isVE && igtf
  // En ambos modos, result.total es el monto de la factura con IVA incluido
  const igtfAmount = showIgtf ? calcIgtf(result.total) : 0
  const grandTotal = result.total + igtfAmount

  // moneda en la que se muestra el desglose y símbolo del campo de entrada
  const inputSymbol = simpleFx ? fxSymbol : currency
  const totalShown = showIgtf ? grandTotal : mode === 'add' ? result.total : result.subtotal
  const canConvert = isVE && fxRate > 0
  const inputEquiv = canConvert && hasAmount
    ? simpleFx
      ? `Bs. ${fmt(inputAmount * fxRate)}`
      : `${fxSymbol} ${fmt(inputAmount / fxRate)}`
    : null
  const totalEquiv = canConvert && hasAmount ? `${fxSymbol} ${fmt(totalShown / fxRate)}` : null

  // la nota fiscal se resalta al escribir el primer monto, hasta que el usuario la cierra
  const noteHighlight = !noteSeen && hasAmount

  const dismissNote = () => {
    setNoteSeen(true)
    try {
      localStorage.setItem(LS_KEY, '1')
    } catch { /* privado */ }
  }

  const copySummary = async () => {
    const lines = [
      mode === 'add'
        ? `${t('iva.taxableBase')}: ${currency} ${fmt(result.subtotal)}`
        : `${t('iva.totalWithTax')}: ${currency} ${fmt(result.total)}`,
      `${taxName} (${rate}%): ${currency} ${fmt(result.tax)}`,
      mode === 'add'
        ? `${t('iva.totalToInvoice')}: ${currency} ${fmt(result.total)}`
        : `${t('iva.taxableBase')}: ${currency} ${fmt(result.subtotal)}`,
    ]
    if (showIgtf) {
      lines.push(`${t('iva.igtfLine')}: ${currency} ${fmt(igtfAmount)}`)
      lines.push(`${t('iva.totalToPay')}: ${currency} ${fmt(grandTotal)}`)
    }
    if (totalEquiv) {
      lines.push(t('iva.copyEquiv', { v: totalEquiv, r: fmt(fxRate) }))
    }
    await navigator.clipboard.writeText(lines.join('\n'))
    posthog.capture('tax_summary_copied', { calculator_mode: 'simple', tax_mode: mode, includes_igtf: showIgtf })
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  const pressSimple = (key: string) => {
    setCopied(false)
    setRaw(keyTransform(key))
  }

  /* ———— ADVANCED MODE ———— */
  const setItemAmount = (id: number, updater: (prev: string) => string) => {
    setAdvItems((items) =>
      items.map((it) => (it.id === id ? { ...it, amount: updater(it.amount) } : it)),
    )
  }
  const setItemName = (id: number, name: string) => {
    setAdvItems((items) => items.map((it) => (it.id === id ? { ...it, name } : it)))
  }
  const addItem = () => {
    const id = nextItemId.current++
    setAdvItems((items) => [...items, { id, name: '', amount: '' }])
    setActiveItemId(id)
  }
  const removeItem = (id: number) => {
    setAdvItems((items) => {
      const next = items.filter((it) => it.id !== id)
      if (id === activeItemId && next.length) setActiveItemId(next[next.length - 1].id)
      return next.length ? next : items
    })
  }

  const advUsd = advItems.reduce((sum, it) => sum + parseAmount(it.amount), 0)
  const advRateBs = fxRate
  const advCalc = calcTax(advUsd * advRateBs, rate, 'add')
  const advSubtotalBs = advCalc.subtotal
  const advTaxBs = advCalc.tax
  const advTotalBs = advCalc.total
  const advValid = advUsd > 0 && advRateBs > 0

  const pressAdvanced = (key: string) => setItemAmount(activeItemId, keyTransform(key))

  const generateQuote = () => {
    if (!advValid) return
    const items = advItems
      .map((it) => ({ name: it.name.trim(), amount: parseAmount(it.amount) }))
      .filter((it) => it.amount > 0)
    posthog.capture('service_order_generated', {
      source: 'tax_calculator',
      tax_rate: rate,
      item_count: items.length,
    })
    setQuoteData({
      service: serviceName,
      amountUSD: advUsd,
      rateBs: advRateBs,
      subtotalBs: advSubtotalBs,
      taxBs: advTaxBs,
      totalBs: advTotalBs,
      taxName,
      taxRate: rate,
      items: items.length > 1 ? items : undefined,
    })
    setShowQuote(true)
  }

  /* ———— shared UI blocks ———— */
  const customRateRow = isCustom && (
    <div className="flex items-center gap-3">
      <span className="shrink-0 font-mono text-xs text-white/40">{t('iva.ratePct')}</span>
      <input
        type="text"
        inputMode="decimal"
        value={customRate}
        onChange={(e) => setCustomRate(e.target.value)}
        placeholder="12.5"
        className="field-box-dark text-right font-mono text-lg"
      />
    </div>
  )

  const fxStatusButton = (
    <button
      onClick={reload}
      className="flex items-center gap-1.5 font-mono text-[10px] text-white/40 transition-colors hover:text-white"
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${status === 'ok' ? 'animate-pulse' : ''}`}
        style={{ backgroundColor: status === 'error' ? '#F87171' : ACCENT_SOFT }}
      />
      {status === 'loading'
        ? t('iva.fxLoading')
        : status === 'ok'
          ? t('iva.fxLive', {
              date: new Date(updatedAt).toLocaleDateString(dateLocale(lang), { day: '2-digit', month: 'short' }),
            })
          : t('iva.fxOffline')}
    </button>
  )

  const fxSelector = (
    <div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
          {t('iva.fxRate')}
        </span>
        {fxStatusButton}
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {fxOptions.map((o) => (
          <button
            key={o.key}
            onClick={() => setFxSource(o.key)}
            className={`rounded-lg px-2 py-2.5 text-center transition-all ${
              fxSource === o.key ? 'text-white' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'
            }`}
            style={fxSource === o.key ? { backgroundColor: ACCENT } : undefined}
          >
            <span className="block text-[12px] font-semibold">{o.label}</span>
            <span className={`block font-mono text-[10px] ${fxSource === o.key ? 'text-white/70' : 'text-white/30'}`}>
              {o.value != null ? fmt(o.value) : '—'}
            </span>
          </button>
        ))}
      </div>
      {fxSource === 'CUSTOM' && (
        <div className="mt-2 flex items-center gap-3">
          <span className="shrink-0 font-mono text-xs text-white/40">Bs.</span>
          <input
            type="text"
            inputMode="decimal"
            value={customFx}
            onChange={(e) => setCustomFx(e.target.value)}
            placeholder={t('iva.fxCustomPh')}
            className="field-box-dark text-right font-mono text-lg"
          />
        </div>
      )}
    </div>
  )

  return (
    <BrandShell tool={tool} soft={ACCENT_SOFT}>

      <section className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
        {/* MODE SWITCH */}
        <div className="mb-10 flex w-fit overflow-hidden rounded-full border border-line">
          {(
            [
              { id: 'simple', label: t('iva.simple') },
              { id: 'avanzado', label: t('iva.advanced') },
            ] as { id: CalcMode; label: string }[]
          ).map((m) => (
            <button
              key={m.id}
              onClick={() => setCalcMode(m.id)}
              className={`px-6 py-2.5 text-sm font-semibold transition-colors ${
                calcMode === m.id ? 'text-white' : 'text-inksoft hover:text-ink'
              }`}
              style={calcMode === m.id ? { backgroundColor: ACCENT } : undefined}
            >
              {m.label}
            </button>
          ))}
        </div>

        {calcMode === 'simple' ? (
          /* ———————————— SIMPLE: unified calculator ———————————— */
          <div className="grid gap-10 lg:grid-cols-[560px_1fr]">
            <div>
              <div
                className="overflow-hidden rounded-3xl shadow-2xl shadow-ink/20"
                style={{ '--facc': ACCENT_SOFT, backgroundColor: 'var(--dark-panel, #292119)' } as React.CSSProperties}
              >
                {/* header: country + mode */}
                <div className="space-y-4 p-5 pb-0">
                  <CountrySelect dark value={countryCode} onChange={setCountryCode} />
                  {customRateRow}
                  <div className="flex rounded-xl bg-white/5 p-1">
                    {(
                      [
                        { id: 'add', label: t('iva.addTax') },
                        { id: 'extract', label: t('iva.extractTax') },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setMode(m.id)}
                        className={`flex-1 rounded-lg py-2.5 text-[13px] font-semibold transition-all ${
                          mode === m.id ? 'text-white' : 'text-white/40 hover:text-white/70'
                        }`}
                        style={mode === m.id ? { backgroundColor: ACCENT } : undefined}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                  {isVE && (
                    <>
                      {/* moneda del monto: Bs o divisa */}
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
                          {t('iva.amountCurrency')}
                        </span>
                        <div className="flex rounded-xl bg-white/5 p-1">
                          {(
                            [
                              { id: 'BS', label: 'Bs.' },
                              { id: 'FX', label: fxSymbol },
                            ] as { id: SimpleCur; label: string }[]
                          ).map((c) => (
                            <button
                              key={c.id}
                              onClick={() => setSimpleCur(c.id)}
                              className={`rounded-lg px-5 py-2 text-[13px] font-semibold transition-all ${
                                simpleCur === c.id ? 'text-white' : 'text-white/40 hover:text-white/70'
                              }`}
                              style={simpleCur === c.id ? { backgroundColor: ACCENT } : undefined}
                            >
                              {c.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      {fxSelector}
                      <button
                        onClick={() => setIgtf(!igtf)}
                        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition-colors hover:border-white/25"
                      >
                        <span>
                          <span className="block text-[13px] font-semibold text-white">{t('iva.foreignPayment')}</span>
                          <span className="block font-mono text-[10px] text-white/40">
                            {t('iva.igtfHint')}
                          </span>
                        </span>
                        <span
                          className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
                          style={{ backgroundColor: igtf ? ACCENT : 'rgba(255,255,255,0.12)' }}
                        >
                          <span
                            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${igtf ? 'left-[22px]' : 'left-0.5'}`}
                          />
                        </span>
                      </button>
                    </>
                  )}
                </div>

                {/* display with integrated breakdown */}
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
                      {mode === 'add' ? t('iva.netAmount') : t('iva.grossAmount')}
                    </span>
                    <span
                      className="rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold"
                      style={{ backgroundColor: `${ACCENT}26`, color: ACCENT_SOFT }}
                    >
                      {taxName} {fmt(rate, rate % 1 ? 2 : 0)}%
                    </span>
                  </div>

                  <div className="mt-2 flex items-baseline justify-end gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 transition-colors focus-within:border-white/35">
                    <span className="font-mono text-xl text-white/40">{inputSymbol}</span>
                    <input
                      ref={inputRef}
                      type="text"
                      inputMode="decimal"
                      value={raw}
                      onChange={(e) => setRaw(sanitizeAmount(e.target.value))}
                      placeholder="0"
                      className="tool-num w-full border-0 bg-transparent text-right text-6xl font-semibold text-white outline-none placeholder:text-white/15"
                    />
                  </div>
                  {inputEquiv && (
                    <p className="mt-1.5 text-right font-mono text-xs text-white/40">
                      ≈ {inputEquiv} · {t('iva.rateTag', { r: fmt(fxRate) })}
                    </p>
                  )}

                  {/* montos rápidos */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-white/30">
                      {t('iva.quick')}
                    </span>
                    {[5, 10, 20, 50, 100, 200].map((v) => (
                      <button
                        key={v}
                        onClick={() => setRaw(String(v))}
                        className={`rounded-full px-3.5 py-1.5 font-mono text-xs transition-all active:scale-95 ${
                          raw === String(v)
                            ? 'text-white'
                            : 'bg-white/5 text-white/60 hover:bg-white/15 hover:text-white'
                        }`}
                        style={raw === String(v) ? { backgroundColor: ACCENT } : undefined}
                      >
                        {v}
                      </button>
                    ))}
                  </div>

                  {/* breakdown inside calculator */}
                  <div className="mt-5 rounded-2xl bg-white/5 px-5 py-2">
                    <div className="flex items-baseline justify-between border-b border-white/10 py-3">
                      <span className="text-[13px] text-white/50">
                        {mode === 'add' ? t('iva.taxableBase') : t('iva.totalWithTax')}
                      </span>
                      <span className="tool-num text-lg text-white">
                        {currency} {fmt(mode === 'add' ? result.subtotal : result.total)}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between border-b border-white/10 py-3">
                      <span className="flex items-center gap-2 text-[13px] text-white/50">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ACCENT_SOFT }} />
                        {taxName} {fmt(rate, rate % 1 ? 2 : 0)}%
                      </span>
                      <span className="tool-num text-lg" style={{ color: ACCENT_SOFT }}>
                        {currency} {fmt(result.tax)}
                      </span>
                    </div>
                    {showIgtf && (
                      <div className="flex items-baseline justify-between border-b border-white/10 py-3">
                        <span className="flex items-center gap-2 text-[13px] text-white/50">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#F5B301' }} />
                          IGTF 3% <span className="font-mono text-[10px] text-white/30">{t('iva.fx')}</span>
                        </span>
                        <span className="tool-num text-lg" style={{ color: '#F5B301' }}>
                          {currency} {fmt(igtfAmount)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-baseline justify-between py-4">
                      <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/70">
                        {showIgtf ? t('iva.totalToPay') : mode === 'add' ? t('iva.totalToInvoice') : t('iva.taxableBase')}
                      </span>
                      <span className="text-right">
                        <span className="tool-num block text-3xl font-semibold text-white">
                          {fmt(totalShown)}
                        </span>
                        {totalEquiv && (
                          <span className="block font-mono text-xs text-white/40">≈ {totalEquiv}</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={copySummary}
                    disabled={!hasAmount}
                    className="mt-4 w-full rounded-full py-3.5 text-sm font-semibold text-white transition-opacity disabled:opacity-30"
                    style={{ backgroundColor: ACCENT }}
                  >
                    {copied ? t('iva.copied') : t('iva.copy')}
                  </button>
                </div>

                {keypadOpen && <Keypad onPress={pressSimple} />}
              </div>

              <div className="px-2">
                <KeypadToggle open={keypadOpen} onToggle={() => setKeypadOpen(!keypadOpen)} />
                <p className="mt-2 text-center font-mono text-[11px] text-inkmuted">
                  {t('iva.keypadNote')}
                </p>
              </div>
            </div>

            {/* right: note + disclaimer */}
            <div className="flex flex-col justify-center gap-8">
              <InfoNote
                note={getTaxNote(countryCode, countryName, taxName, rate, lang)}
                mode={mode}
                highlight={noteHighlight}
                onDismiss={dismissNote}
                accent={ACCENT}
              />
              <p className="font-mono text-xs leading-relaxed text-inkmuted">
                {t('iva.disclaimer', { country: countryName })}
                {showIgtf && t('iva.igtfDisclaimer')}
              </p>
            </div>
          </div>
        ) : (
          /* ———————————— ADVANCED: unified calculator ———————————— */
          <div className="grid gap-10 lg:grid-cols-[560px_1fr]">
            <div>
              <div
                className="overflow-hidden rounded-3xl shadow-2xl shadow-ink/20"
                style={{ '--facc': ACCENT_SOFT, backgroundColor: 'var(--dark-panel, #292119)' } as React.CSSProperties}
              >
                <div className="space-y-4 p-5 pb-0">
                  <CountrySelect dark value={countryCode} onChange={setCountryCode} />
                  {customRateRow}
                </div>

                {/* service + amounts + fx */}
                <div className="space-y-5 p-5">
                  <div>
                    <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
                      {t('iva.serviceName')}
                    </span>
                    <input
                      type="text"
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                      placeholder={t('iva.servicePh')}
                      className="field-box-dark mt-2 text-base"
                    />
                  </div>

                  <div>
                    <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
                      {advItems.length > 1 ? t('iva.amountsCharge') : t('iva.amountCharge')}
                    </span>
                    <div className="mt-2 space-y-2">
                      {advItems.map((it) => (
                        <div key={it.id} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={it.name}
                            onChange={(e) => setItemName(it.id, e.target.value)}
                            placeholder={t('iva.itemPh')}
                            className="field-box-dark min-w-0 flex-1 text-sm"
                          />
                          <div
                            className={`flex w-36 shrink-0 items-baseline gap-1.5 rounded-xl border bg-white/[0.06] px-3 py-2 transition-colors focus-within:border-white/35 ${
                              activeItemId === it.id ? 'border-white/25' : 'border-white/10'
                            }`}
                          >
                            <span className="font-mono text-sm text-white/40">$</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={it.amount}
                              onFocus={() => setActiveItemId(it.id)}
                              onChange={(e) => setItemAmount(it.id, () => sanitizeAmount(e.target.value))}
                              placeholder="0"
                              className="tool-num w-full border-0 bg-transparent text-right text-xl font-semibold text-white outline-none placeholder:text-white/15"
                            />
                          </div>
                          {advItems.length > 1 && (
                            <button
                              onClick={() => removeItem(it.id)}
                              aria-label={t('iva.removeItem')}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <button
                        onClick={addItem}
                        className="rounded-full border border-white/10 px-4 py-2 font-mono text-xs text-white/60 transition-colors hover:border-white/25 hover:text-white"
                      >
                        {t('iva.addItem')}
                      </button>
                      {advItems.length > 1 && (
                        <span className="font-mono text-xs text-white/50">
                          {t('iva.itemsTotal')}: <span className="text-white">$ {fmt(advUsd)}</span>
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-white/30">
                        {t('iva.quick')}
                      </span>
                      {[10, 25, 50, 100, 300].map((v) => (
                        <button
                          key={v}
                          onClick={() => setItemAmount(activeItemId, () => String(v))}
                          className="rounded-full bg-white/5 px-3.5 py-1.5 font-mono text-xs text-white/60 transition-all hover:bg-white/15 hover:text-white active:scale-95"
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* fx source */}
                  {fxSelector}

                  {/* breakdown */}
                  <div className="rounded-2xl bg-white/5 px-5 py-2">
                    <div className="flex items-baseline justify-between border-b border-white/10 py-3">
                      <span className="text-[13px] text-white/50">{t('iva.taxableBase')}</span>
                      <span className="tool-num text-lg text-white">Bs. {fmt(advSubtotalBs)}</span>
                    </div>
                    <div className="flex items-baseline justify-between border-b border-white/10 py-3">
                      <span className="flex items-center gap-2 text-[13px] text-white/50">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ACCENT_SOFT }} />
                        {taxName} {fmt(rate, rate % 1 ? 2 : 0)}%
                      </span>
                      <span className="tool-num text-lg" style={{ color: ACCENT_SOFT }}>
                        Bs. {fmt(advTaxBs)}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between py-4">
                      <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/70">
                        {t('iva.totalToInvoice')}
                      </span>
                      <span className="tool-num text-3xl font-semibold text-white">
                        {fmt(advTotalBs)}
                        <span className="ml-1.5 text-sm font-normal text-white/40">Bs.</span>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={generateQuote}
                    disabled={!advValid}
                    className="w-full rounded-full py-4 text-sm font-semibold text-white transition-opacity disabled:opacity-30"
                    style={{ backgroundColor: ACCENT }}
                  >
                    {t('iva.generate')}
                  </button>
                </div>

                {keypadOpen && <Keypad onPress={pressAdvanced} />}
              </div>

              <div className="px-2">
                <KeypadToggle open={keypadOpen} onToggle={() => setKeypadOpen(!keypadOpen)} />
              </div>
            </div>

            {/* right: info */}
            <div className="flex flex-col justify-center gap-8">
              <InfoNote
                note={getTaxNote(countryCode, countryName, taxName, rate, lang)}
                mode="add"
                highlight={noteHighlight}
                onDismiss={dismissNote}
                accent={ACCENT}
              />
              <p className="font-mono text-xs leading-relaxed text-inkmuted">
                {t('iva.advDisclaimer', { taxName })}
              </p>
            </div>
          </div>
        )}
      </section>

      {showQuote && quoteData && (
        <QuoteModal data={quoteData} onClose={() => setShowQuote(false)} />
      )}
    </BrandShell>
  )
}
