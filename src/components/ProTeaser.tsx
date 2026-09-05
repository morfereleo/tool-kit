import { useId, useState } from 'react'
import Modal from '@/components/Modal'
import { useLang, useT } from '@/lib/i18n'
import posthog from '@/lib/posthog'

export type ProFeature = 'branding' | 'proposal_link' | 'esign' | 'dynamic_qr' | 'rate_alerts'

const LS_KEY = 'adtools-pro-waitlist'

const readJoined = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]')
  } catch {
    return []
  }
}

/**
 * Paywall de interés: anuncia una función Pro futura y captura el correo
 * en la lista de espera (POST /api/waitlist). Mide en PostHog qué función
 * despierta interés real antes de construirla.
 */
export default function ProTeaser({
  feature,
  tool,
  accent,
  className = '',
}: {
  feature: ProFeature
  tool: string
  accent: string
  className?: string
}) {
  const t = useT()
  const { lang } = useLang()
  const emailId = useId()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'already' | 'error'>(() =>
    readJoined().includes(feature) ? 'done' : 'idle',
  )

  const openModal = () => {
    posthog.capture('pro_interest', { feature, tool })
    setOpen(true)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState('sending')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), feature, tool, lang }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      posthog.capture('pro_waitlist_joined', { feature, tool, already: data.already })
      try {
        localStorage.setItem(LS_KEY, JSON.stringify([...new Set([...readJoined(), feature])]))
      } catch { /* privado */ }
      setState(data.already ? 'already' : 'done')
    } catch {
      setState('error')
    }
  }

  const joined = state === 'done' || state === 'already'

  return (
    <>
      <button
        onClick={openModal}
        className={`flex w-full items-center justify-between gap-3 rounded-xl border border-dashed px-4 py-3 text-left transition-colors hover:border-solid ${className}`}
        style={{ borderColor: `${accent}59` }}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span aria-hidden>✨</span>
          <span className="truncate text-[13px] font-semibold">{t(`pro.${feature}.t`)}</span>
        </span>
        <span
          className="shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white"
          style={{ backgroundColor: accent }}
        >
          {t('pro.badge')}
        </span>
      </button>

      {open && (
        <Modal
          title={t(`pro.${feature}.t`)}
          subtitle={t('pro.soon')}
          onClose={() => setOpen(false)}
        >
          <div className="p-6">
            <p className="text-[15px] leading-relaxed text-inksoft">{t(`pro.${feature}.d`)}</p>

            {joined ? (
              <p
                className="mt-6 rounded-xl px-4 py-3.5 text-sm font-semibold"
                style={{ backgroundColor: `${accent}1A`, color: accent }}
              >
                {state === 'already' ? t('pro.already') : t('pro.joined')}
              </p>
            ) : (
              <form onSubmit={submit} className="mt-6">
                <label className="field-label" htmlFor={emailId}>
                  {t('pro.email')}
                </label>
                <input
                  id={emailId}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('pro.emailPh')}
                  className="field-box"
                  style={{ '--facc': accent } as React.CSSProperties}
                />
                <button
                  type="submit"
                  disabled={state === 'sending'}
                  className="mt-4 w-full rounded-full py-3.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                  style={{ backgroundColor: accent }}
                >
                  {t('pro.cta')}
                </button>
                {state === 'error' && (
                  <p className="mt-3 text-center text-xs font-semibold text-red-500">{t('pro.error')}</p>
                )}
                <p className="mt-3 text-center font-mono text-[11px] text-inkmuted">{t('pro.note')}</p>
              </form>
            )}
          </div>
        </Modal>
      )}
    </>
  )
}
