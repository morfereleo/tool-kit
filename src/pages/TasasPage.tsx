import { useMemo, useState } from 'react'
import BrandShell from '@/components/BrandShell'
import { TOOLS } from '@/lib/tools'
import { fmt } from '@/lib/format'
import { dateLocale, useLang, useT } from '@/lib/i18n'
import { useVeRates, type RateKey } from '@/hooks/useVeRates'
import posthog from '@/lib/posthog'

const tool = TOOLS[1]
const ACCENT = tool.accent

const RATE_META: { key: RateKey; labelKey: string; symbol: string; sourceKey: string }[] = [
  { key: 'USD_BCV', labelKey: 'tasas.usdBcv', symbol: '$', sourceKey: 'tasas.srcBcv' },
  { key: 'EUR_BCV', labelKey: 'tasas.eurBcv', symbol: '€', sourceKey: 'tasas.srcBcv' },
  { key: 'USD_PARALELO', labelKey: 'tasas.usdPar', symbol: '$p', sourceKey: 'tasas.srcPar' },
  { key: 'USDT', labelKey: 'tasas.usdt', symbol: '₮', sourceKey: 'tasas.srcUsdt' },
]

export default function TasasPage() {
  const { rates, deltas, prevAt, status, updatedAt, reload } = useVeRates()
  const [edited, setEdited] = useState<Partial<Record<RateKey, string>>>({})
  const [amount, setAmount] = useState('100')
  const [from, setFrom] = useState<RateKey | 'VES'>('USD_BCV')
  const { lang } = useLang()
  const t = useT()
  const dl = dateLocale(lang)

  const prevLabel = prevAt
    ? new Date(prevAt).toLocaleDateString(dl, { day: '2-digit', month: 'short' })
    : ''

  const getRate = (key: RateKey): number | null => {
    const e = edited[key]
    if (e !== undefined && e !== '') {
      const n = parseFloat(e.replace(',', '.'))
      return isNaN(n) ? null : n
    }
    return rates[key]
  }

  const conversions = useMemo(() => {
    const amt = parseFloat(amount.replace(',', '.')) || 0
    const vesValue = from === 'VES' ? amt : amt * (getRate(from as RateKey) ?? 0)
    return RATE_META.map((m) => {
      const r = getRate(m.key)
      return { ...m, label: t(m.labelKey), value: r && r > 0 ? vesValue / r : null }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, from, rates, edited, lang])

  const fromMeta =
    from === 'VES'
      ? { label: t('tasas.bolivares'), symbol: 'Bs.' }
      : { ...RATE_META.find((m) => m.key === from)!, label: t(RATE_META.find((m) => m.key === from)!.labelKey) }

  return (
    <BrandShell tool={tool}>
      <div className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-5 md:px-8">
          <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-xs ${
              status === 'ok'
                ? 'border-line text-inksoft'
                : status === 'loading'
                  ? 'border-line text-inkmuted'
                  : 'border-red-300 text-red-600'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${status === 'ok' ? 'animate-pulse' : ''}`}
              style={{ backgroundColor: status === 'error' ? '#DC2626' : ACCENT }}
            />
            {status === 'loading' && t('tasas.loading')}
            {status === 'ok' &&
              t('tasas.updated', {
                date: new Date(updatedAt).toLocaleDateString(dl, { day: '2-digit', month: 'short', year: 'numeric' }),
              })}
            {status === 'error' && t('tasas.offline')}
          </span>
          <button
            onClick={() => {
              posthog.capture('rate_data_refreshed')
              reload()
            }}
            className="rounded-full border border-line px-3 py-1.5 font-mono text-xs text-inksoft transition-colors hover:border-ink hover:text-ink"
          >
            {t('tasas.reload')}
          </button>
          </div>
        </div>
      </div>

      {/* RATE BOARD */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
          <p className="field-label">{t('tasas.board')}</p>
          <div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {RATE_META.map((m) => {
              const r = getRate(m.key)
              return (
                <div key={m.key} className="bg-paper p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{t(m.labelKey)}</span>
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ACCENT }} />
                  </div>
                  <div className="relative mt-3">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-inkmuted">
                      Bs.
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      aria-label={t(m.labelKey)}
                      value={edited[m.key] ?? (r != null ? r.toFixed(2) : '')}
                      onChange={(e) => setEdited((p) => ({ ...p, [m.key]: e.target.value }))}
                      placeholder={status === 'loading' ? '…' : '0.00'}
                      className="field-box py-2 pl-12 font-mono text-xl font-semibold tabular-nums"
                    />
                  </div>
                  <p className="mt-2 flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-inkmuted">{t(m.sourceKey)}</span>
                    {(() => {
                      const d = deltas[m.key]
                      if (d == null) return null
                      const up = d > 0.005
                      const down = d < -0.005
                      return (
                        <span
                          title={`${t('tasas.deltaTitle')}${prevLabel ? ` (${prevLabel})` : ''}`}
                          className="rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold tabular-nums"
                          style={{
                            backgroundColor: up ? '#00965E1A' : down ? '#DC26261A' : 'rgb(var(--line) / 0.5)',
                            color: up ? '#00965E' : down ? '#DC2626' : 'rgb(var(--inkmuted))',
                          }}
                        >
                          {up ? '▲' : down ? '▼' : '='} {fmt(Math.abs(d))}%
                        </span>
                      )
                    })()}
                  </p>
                </div>
              )
            })}
          </div>
          {Object.keys(edited).length > 0 && (
            <button
              onClick={() => setEdited({})}
              className="mt-4 font-mono text-xs text-inkmuted underline underline-offset-4 hover:text-ink"
            >
              {t('tasas.reset')}
            </button>
          )}
        </div>
      </section>

      {/* CONVERTER */}
      <section>
        <div className="mx-auto grid max-w-6xl md:grid-cols-2">
          <div className="border-b border-line px-5 py-10 md:border-b-0 md:border-r md:px-8 md:py-14">
            <label htmlFor="tasas-amount" className="field-label">{t('tasas.amount')}</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-lg text-inkmuted">
                {fromMeta.symbol}
              </span>
              <input
                id="tasas-amount"
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="field-box py-4 pl-14 font-mono text-3xl font-semibold tabular-nums"
              />
            </div>

            <p className="field-label mt-10 block">{t('tasas.from')}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[{ key: 'VES' as const, label: t('tasas.bolivares'), symbol: 'Bs.' }, ...RATE_META.map((m) => ({ key: m.key, label: t(m.labelKey), symbol: m.symbol }))].map((m) => (
                <button
                  key={m.key}
                  onClick={() => setFrom(m.key as RateKey | 'VES')}
                  className={`rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-all ${
                    from === m.key
                      ? 'border-transparent text-white'
                      : 'border-line text-inksoft hover:border-inkmuted hover:text-ink'
                  }`}
                  style={from === m.key ? { backgroundColor: ACCENT } : undefined}
                >
                  {m.label}
                  <span className={`block font-mono text-[11px] ${from === m.key ? 'text-white/70' : 'text-inkmuted'}`}>
                    {m.symbol}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="px-5 py-10 md:px-8 md:py-14">
            <p className="field-label">{t('tasas.to')}</p>
            <div className="mt-4 border-y border-line">
              {conversions
                .filter((c) => c.key !== from)
                .map((c) => (
                  <div key={c.key} className="flex items-baseline justify-between border-b border-line py-4 last:border-b-0">
                    <span className="flex items-center gap-2 text-sm text-inksoft">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ACCENT }} />
                      {c.label}
                    </span>
                    <span className="tool-num text-2xl font-semibold">
                      {c.value != null ? fmt(c.value) : '—'}
                      <span className="ml-1.5 text-sm font-normal text-inkmuted">{c.symbol}</span>
                    </span>
                  </div>
                ))}
              <div className="flex items-baseline justify-between py-5">
                <span className="text-sm font-semibold uppercase tracking-[0.15em]">{t('tasas.bolivares')}</span>
                <span className="tool-num text-3xl font-semibold md:text-4xl" style={{ color: ACCENT }}>
                  {(() => {
                    const amt = parseFloat(amount.replace(',', '.')) || 0
                    const ves = from === 'VES' ? amt : amt * (getRate(from as RateKey) ?? 0)
                    return fmt(ves)
                  })()}
                  <span className="ml-2 text-base font-normal text-inkmuted">Bs.</span>
                </span>
              </div>
            </div>
            <p className="mt-6 font-mono text-xs leading-relaxed text-inkmuted">
              {t('tasas.disclaimer')}
            </p>
          </div>
        </div>
      </section>
    </BrandShell>
  )
}
