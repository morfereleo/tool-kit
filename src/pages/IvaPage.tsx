import { useEffect, useMemo, useRef, useState } from 'react'
import BrandShell from '@/components/BrandShell'
import InfoNote from '@/components/InfoNote'
import QuoteModal, { type QuoteData } from '@/components/QuoteModal'
import { TOOLS } from '@/lib/tools'
import { VAT_COUNTRIES } from '@/lib/vat'
import { getTaxNote } from '@/lib/taxNotes'
import { fmt } from '@/lib/format'
import { useVeRates } from '@/hooks/useVeRates'

const tool = TOOLS[0]
const ACCENT = tool.accent
const ACCENT_SOFT = '#9FB2FF'

const LS_KEY = 'adtools-tax-note-seen'
type CalcMode = 'simple' | 'avanzado'
type AdvSource = 'USD_BCV' | 'EUR_BCV' | 'USDT' | 'CUSTOM'

const flagUrl = (code: string) =>
  code === 'CUSTOM' ? '' : `https://flagcdn.com/w80/${code.toLowerCase()}.png`

/* ————— Country selector with flags ————— */
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
  const ref = useRef<HTMLDivElement>(null)
  const selected = VAT_COUNTRIES.find((c) => c.code === value)
  const isCustom = value === 'CUSTOM'

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
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
            {isCustom ? 'Otro país / tasa libre' : selected?.name}
          </span>
          <span className={`block font-mono text-[11px] ${dark ? 'text-white/40' : 'text-inkmuted'}`}>
            {isCustom ? 'Define tu propio porcentaje' : `${selected?.rate}% ${selected?.taxName}`}
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
        <div className="absolute inset-x-0 top-full z-30 mt-2 max-h-72 overflow-y-auto rounded-xl border border-line bg-paper shadow-xl shadow-ink/5">
          {VAT_COUNTRIES.map((c) => (
            <button
              key={c.code}
              onClick={() => {
                onChange(c.code)
                setOpen(false)
              }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                value === c.code ? 'bg-paper' : 'hover:bg-paper'
              }`}
            >
              <img src={flagUrl(c.code)} alt="" className="h-5 w-7 rounded-[3px] object-cover shadow-sm" />
              <span className="flex-1 text-sm font-medium">{c.name}</span>
              <span className="font-mono text-xs text-inkmuted">
                {c.rate}% {c.taxName}
              </span>
            </button>
          ))}
          <button
            onClick={() => {
              onChange('CUSTOM')
              setOpen(false)
            }}
            className={`flex w-full items-center gap-3 border-t border-line px-4 py-2.5 text-left transition-colors ${
              isCustom ? 'bg-paper' : 'hover:bg-paper'
            }`}
          >
            <span className="flex h-5 w-7 items-center justify-center rounded-[3px] bg-line text-[10px] font-bold text-inksoft">
              %
            </span>
            <span className="flex-1 text-sm font-medium">Otro país / tasa libre</span>
            <span className="font-mono text-xs text-inkmuted">personalizado</span>
          </button>
        </div>
      )}
    </div>
  )
}

/* ————— Shared keypad ————— */
function Keypad({ onPress }: { onPress: (k: string) => void }) {
  const btn =
    'rounded-xl bg-white/5 py-4 font-mono text-xl text-white transition-colors hover:bg-white/15 active:scale-95'
  const util =
    'rounded-xl bg-white/10 py-4 font-mono text-lg font-semibold text-white/80 transition-colors hover:bg-white/20 active:scale-95'
  return (
    <div className="grid grid-cols-4 gap-2 border-t border-white/10 p-4">
      <button onClick={() => onPress('C')} className={util}>C</button>
      <button onClick={() => onPress('⌫')} className={util} aria-label="Borrar">⌫</button>
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
  return (
    <button
      onClick={onToggle}
      className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-white/10 py-2.5 font-mono text-xs text-white/50 transition-colors hover:border-white/25 hover:text-white"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M7 9h.01M11 9h.01M15 9h.01M7 13h.01M11 13h.01M15 13h.01M7 17h10" strokeLinecap="round" />
      </svg>
      {open ? 'Ocultar teclado' : 'Mostrar teclado'}
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
  const [countryCode, setCountryCode] = useState('VE')
  const [customRate, setCustomRate] = useState('')
  const [raw, setRaw] = useState('')
  const [mode, setMode] = useState<'add' | 'extract'>('add')
  const [copied, setCopied] = useState(false)
  const [calcMode, setCalcMode] = useState<CalcMode>('simple')
  const [noteHighlight, setNoteHighlight] = useState(false)
  const [keypadOpen, setKeypadOpen] = useState(false)
  const [igtf, setIgtf] = useState(false)
  // advanced
  const [serviceName, setServiceName] = useState('')
  const [amountUSD, setAmountUSD] = useState('')
  const [advSource, setAdvSource] = useState<AdvSource>('USD_BCV')
  const [customFx, setCustomFx] = useState('')
  const [showQuote, setShowQuote] = useState(false)
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { rates, status, updatedAt, reload } = useVeRates()

  const country = VAT_COUNTRIES.find((c) => c.code === countryCode)
  const isCustom = countryCode === 'CUSTOM'
  const rate = isCustom ? parseFloat(customRate.replace(',', '.')) || 0 : country?.rate ?? 0
  const taxName = isCustom ? 'Impuesto' : country?.taxName ?? 'IVA'
  const currency = isCustom ? '$' : country?.currency ?? '$'

  /* ———— SIMPLE MODE ———— */
  const result = useMemo(() => {
    const base = parseFloat(raw) || 0
    const r = rate / 100
    if (mode === 'add') {
      const tax = base * r
      return { subtotal: base, tax, total: base + tax }
    }
    const subtotal = r === 0 ? base : base / (1 + r)
    return { subtotal, tax: base - subtotal, total: base }
  }, [raw, rate, mode])

  const hasAmount = (parseFloat(raw) || 0) > 0

  /* ———— IGTF (Venezuela: 3% sobre pagos en divisas) ———— */
  const showIgtf = countryCode === 'VE' && igtf
  // En ambos modos, result.total es el monto de la factura con IVA incluido
  const igtfAmount = showIgtf ? result.total * 0.03 : 0
  const grandTotal = result.total + igtfAmount

  useEffect(() => {
    if (hasAmount) {
      try {
        if (!localStorage.getItem(LS_KEY)) setNoteHighlight(true)
      } catch {
        setNoteHighlight(true)
      }
    }
  }, [hasAmount])

  const dismissNote = () => {
    setNoteHighlight(false)
    try {
      localStorage.setItem(LS_KEY, '1')
    } catch { /* privado */ }
  }

  const sanitize = (v: string) => {
    let s = v.replace(/[^0-9.,]/g, '').replace(/\./g, ',')
    const first = s.indexOf(',')
    if (first !== -1) s = s.slice(0, first + 1) + s.slice(first + 1).replace(/,/g, '')
    if (first !== -1) return s
    const [int, dec] = s.split(',')
    if (dec !== undefined) s = `${int},${dec.slice(0, 2)}`
    return s
  }

  const press = (key: string) => {
    setCopied(false)
    setRaw((prev) => {
      if (key === 'C') return ''
      if (key === '⌫') return prev.slice(0, -1)
      if (key === ',') return prev.includes(',') ? prev : (prev || '0') + ','
      const digits = key // '0' | '00' | '000' | '1'..'9'
      if (digits === '0' && prev === '') return '0'
      if (prev === '0' && !digits.startsWith(',')) return digits === '0' ? prev : digits.replace(/^0+/, '') || '0'
      const next = prev + digits
      const [int, dec] = next.split(',')
      if (int.length > 12) return prev
      if (dec !== undefined && dec.length > 2) return prev
      return next
    })
  }

  const copySummary = async () => {
    const lines = [
      mode === 'add'
        ? `Base imponible: ${currency} ${fmt(result.subtotal)}`
        : `Total con impuesto: ${currency} ${fmt(result.total)}`,
      `${taxName} (${rate}%): ${currency} ${fmt(result.tax)}`,
      mode === 'add'
        ? `Total a facturar: ${currency} ${fmt(result.total)}`
        : `Base imponible: ${currency} ${fmt(result.subtotal)}`,
    ]
    if (showIgtf) {
      lines.push(`IGTF (3% divisas): ${currency} ${fmt(igtfAmount)}`)
      lines.push(`Total a pagar: ${currency} ${fmt(grandTotal)}`)
    }
    await navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  /* ———— ADVANCED MODE ———— */
  const advUsd = parseFloat(amountUSD.replace(',', '.')) || 0
  const advRateBs =
    advSource === 'CUSTOM'
      ? parseFloat(customFx.replace(',', '.')) || 0
      : (rates[advSource as 'USD_BCV' | 'EUR_BCV' | 'USDT'] ?? 0)
  const advSubtotalBs = advUsd * advRateBs
  const advTaxBs = advSubtotalBs * (rate / 100)
  const advTotalBs = advSubtotalBs + advTaxBs
  const advValid = advUsd > 0 && advRateBs > 0

  const generateQuote = () => {
    if (!advValid) return
    setQuoteData({
      service: serviceName,
      amountUSD: advUsd,
      rateBs: advRateBs,
      subtotalBs: advSubtotalBs,
      taxBs: advTaxBs,
      totalBs: advTotalBs,
      taxName,
      taxRate: rate,
    })
    setShowQuote(true)
  }

  const fxOptions: { key: AdvSource; label: string; value: number | null }[] = [
    { key: 'USD_BCV', label: '$ BCV', value: rates.USD_BCV },
    { key: 'EUR_BCV', label: '€ BCV', value: rates.EUR_BCV },
    { key: 'USDT', label: 'USDT', value: rates.USDT },
    { key: 'CUSTOM', label: 'Otra', value: null },
  ]

  return (
    <BrandShell tool={tool} soft={ACCENT_SOFT}>

      <section className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
        {/* MODE SWITCH */}
        <div className="mb-10 flex w-fit overflow-hidden rounded-full border border-line">
          {(
            [
              { id: 'simple', label: 'Modo simple' },
              { id: 'avanzado', label: 'Modo avanzado' },
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
                  {isCustom && (
                    <div className="flex items-center gap-3">
                      <span className="shrink-0 font-mono text-xs text-white/40">Tasa %</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={customRate}
                        onChange={(e) => setCustomRate(e.target.value)}
                        placeholder="12.5"
                        className="field-box-dark text-right font-mono text-lg"
                      />
                    </div>
                  )}
                  <div className="flex rounded-xl bg-white/5 p-1">
                    {(
                      [
                        { id: 'add', label: 'Agregar impuesto' },
                        { id: 'extract', label: 'Extraer impuesto' },
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
                  {countryCode === 'VE' && (
                    <button
                      onClick={() => setIgtf(!igtf)}
                      className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition-colors hover:border-white/25"
                    >
                      <span>
                        <span className="block text-[13px] font-semibold text-white">Pago en divisas</span>
                        <span className="block font-mono text-[10px] text-white/40">
                          Suma el IGTF (3%) sobre el total
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
                  )}
                </div>

                {/* display with integrated breakdown */}
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
                      {mode === 'add' ? 'Monto neto' : 'Monto con impuesto'}
                    </span>
                    <span
                      className="rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold"
                      style={{ backgroundColor: `${ACCENT}26`, color: ACCENT_SOFT }}
                    >
                      {taxName} {fmt(rate, rate % 1 ? 2 : 0)}%
                    </span>
                  </div>

                  <div className="mt-2 flex items-baseline justify-end gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 transition-colors focus-within:border-white/35">
                    <span className="font-mono text-xl text-white/40">{currency}</span>
                    <input
                      ref={inputRef}
                      type="text"
                      inputMode="decimal"
                      value={raw}
                      onChange={(e) => setRaw(sanitize(e.target.value))}
                      placeholder="0"
                      className="tool-num w-full border-0 bg-transparent text-right text-6xl font-semibold text-white outline-none placeholder:text-white/15"
                    />
                  </div>

                  {/* montos rápidos */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-white/30">
                      Rápido
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
                        {mode === 'add' ? 'Base imponible' : 'Total con impuesto'}
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
                          IGTF 3% <span className="font-mono text-[10px] text-white/30">divisas</span>
                        </span>
                        <span className="tool-num text-lg" style={{ color: '#F5B301' }}>
                          {currency} {fmt(igtfAmount)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-baseline justify-between py-4">
                      <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/70">
                        {showIgtf ? 'Total a pagar' : mode === 'add' ? 'Total a facturar' : 'Base imponible'}
                      </span>
                      <span className="tool-num text-3xl font-semibold text-white">
                        {fmt(showIgtf ? grandTotal : mode === 'add' ? result.total : result.subtotal)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={copySummary}
                    disabled={!hasAmount}
                    className="mt-4 w-full rounded-full py-3.5 text-sm font-semibold text-white transition-opacity disabled:opacity-30"
                    style={{ backgroundColor: ACCENT }}
                  >
                    {copied ? '✓ Desglose copiado' : 'Copiar desglose'}
                  </button>
                </div>

                {keypadOpen && <Keypad onPress={press} />}
              </div>

              <div className="px-2">
                <KeypadToggle open={keypadOpen} onToggle={() => setKeypadOpen(!keypadOpen)} />
                <p className="mt-2 text-center font-mono text-[11px] text-inkmuted">
                  Toca el monto y escribe directamente — el teclado es opcional
                </p>
              </div>
            </div>

            {/* right: note + disclaimer */}
            <div className="flex flex-col justify-center gap-8">
              <InfoNote
                note={getTaxNote(countryCode, country?.name ?? 'tu país', taxName, rate)}
                mode={mode}
                highlight={noteHighlight}
                onDismiss={dismissNote}
                accent={ACCENT}
              />
              <p className="font-mono text-xs leading-relaxed text-inkmuted">
                * Tasas generales vigentes en {isCustom ? 'tasa personalizada' : country?.name}. Algunos
                productos o servicios pueden tener tasas reducidas o exoneraciones según la legislación local.
                {showIgtf &&
                  ' El IGTF (3%) aplica a pagos en moneda extranjera y se calcula sobre el total de la factura.'}
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
                  {isCustom && (
                    <div className="flex items-center gap-3">
                      <span className="shrink-0 font-mono text-xs text-white/40">Tasa %</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={customRate}
                        onChange={(e) => setCustomRate(e.target.value)}
                        placeholder="12.5"
                        className="field-box-dark text-right font-mono text-lg"
                      />
                    </div>
                  )}
                </div>

                {/* service + amount + fx */}
                <div className="space-y-5 p-5">
                  <div>
                    <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
                      Nombre del servicio
                    </span>
                    <input
                      type="text"
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                      placeholder="Ej. Diseño de logo + manual de marca"
                      className="field-box-dark mt-2 text-base"
                    />
                  </div>

                  <div>
                    <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
                      Monto que cobras ($)
                    </span>
                    <div className="mt-2 flex items-baseline justify-end gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 transition-colors focus-within:border-white/35">
                      <span className="font-mono text-xl text-white/40">$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={amountUSD}
                        onChange={(e) => setAmountUSD(sanitize(e.target.value))}
                        placeholder="0"
                        className="tool-num w-full border-0 bg-transparent text-right text-5xl font-semibold text-white outline-none placeholder:text-white/15"
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-white/30">
                        Rápido
                      </span>
                      {[10, 25, 50, 100, 300].map((v) => (
                        <button
                          key={v}
                          onClick={() => setAmountUSD(String(v))}
                          className={`rounded-full px-3.5 py-1.5 font-mono text-xs transition-all active:scale-95 ${
                            amountUSD === String(v)
                              ? 'text-white'
                              : 'bg-white/5 text-white/60 hover:bg-white/15 hover:text-white'
                          }`}
                          style={amountUSD === String(v) ? { backgroundColor: ACCENT } : undefined}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* fx source */}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
                        Tasa de cambio (Bs/$)
                      </span>
                      <button
                        onClick={reload}
                        className="flex items-center gap-1.5 font-mono text-[10px] text-white/40 transition-colors hover:text-white"
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${status === 'ok' ? 'animate-pulse' : ''}`}
                          style={{ backgroundColor: status === 'error' ? '#F87171' : ACCENT_SOFT }}
                        />
                        {status === 'loading'
                          ? 'Consultando…'
                          : status === 'ok'
                            ? `BCV en vivo · ${new Date(updatedAt).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })}`
                            : 'Sin conexión'}
                      </button>
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-1.5">
                      {fxOptions.map((o) => (
                        <button
                          key={o.key}
                          onClick={() => setAdvSource(o.key)}
                          className={`rounded-lg px-2 py-2.5 text-center transition-all ${
                            advSource === o.key ? 'text-white' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'
                          }`}
                          style={advSource === o.key ? { backgroundColor: ACCENT } : undefined}
                        >
                          <span className="block text-[12px] font-semibold">{o.label}</span>
                          <span className={`block font-mono text-[10px] ${advSource === o.key ? 'text-white/70' : 'text-white/30'}`}>
                            {o.value != null ? fmt(o.value, 0) : '—'}
                          </span>
                        </button>
                      ))}
                    </div>
                    {advSource === 'CUSTOM' && (
                      <div className="mt-2 flex items-center gap-3">
                        <span className="shrink-0 font-mono text-xs text-white/40">Bs.</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={customFx}
                          onChange={(e) => setCustomFx(e.target.value)}
                          placeholder="Ingresa tu tasa"
                          className="field-box-dark text-right font-mono text-lg"
                        />
                      </div>
                    )}
                  </div>

                  {/* breakdown */}
                  <div className="rounded-2xl bg-white/5 px-5 py-2">
                    <div className="flex items-baseline justify-between border-b border-white/10 py-3">
                      <span className="text-[13px] text-white/50">Base imponible</span>
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
                        Total a facturar
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
                    Generar orden de servicio
                  </button>
                </div>

                {keypadOpen && (
                  <Keypad
                    onPress={(k) => {
                      setAmountUSD((prev) => {
                        if (k === 'C') return ''
                        if (k === '⌫') return prev.slice(0, -1)
                        if (k === ',') return prev.includes(',') ? prev : (prev || '0') + ','
                        if (k === '0' && prev === '') return '0'
                        if (prev === '0') return k === '0' ? prev : k.replace(/^0+/, '') || '0'
                        const next = prev + k
                        const [int, dec] = next.split(',')
                        if (int.length > 12) return prev
                        if (dec !== undefined && dec.length > 2) return prev
                        return next
                      })
                    }}
                  />
                )}
              </div>

              <div className="px-2">
                <KeypadToggle open={keypadOpen} onToggle={() => setKeypadOpen(!keypadOpen)} />
              </div>
            </div>

            {/* right: info */}
            <div className="flex flex-col justify-center gap-8">
              <InfoNote
                note={getTaxNote(countryCode, country?.name ?? 'tu país', taxName, rate)}
                mode="add"
                highlight={noteHighlight}
                onDismiss={dismissNote}
                accent={ACCENT}
              />
              <p className="font-mono text-xs leading-relaxed text-inkmuted">
                * El total en bolívares se calcula con la tasa seleccionada y el {taxName} del país.
                Las tasas BCV se consultan en vivo (misma fuente que el conversor, herramienta 02) —
                verifica la tasa del día antes de enviar la orden a tu cliente.
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
