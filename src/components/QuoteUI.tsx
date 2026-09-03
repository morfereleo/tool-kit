import type { ReactNode } from 'react'

const ACCENT = '#B45309'

export function NumInput({
  value,
  onChange,
  placeholder = '0',
  dark = false,
  align = 'left',
  id,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  dark?: boolean
  align?: 'left' | 'right'
  id?: string
}) {
  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${dark ? 'field-box-dark' : 'field-box'} font-mono text-base tabular-nums ${
        align === 'right' ? 'text-right' : ''
      }`}
    />
  )
}

export function Step({
  n,
  icon,
  title,
  right,
  color = ACCENT,
  children,
}: {
  n: string
  icon: ReactNode
  title: string
  right?: ReactNode
  color?: string
  children: ReactNode
}) {
  return (
    <section className="border-b border-line px-5 py-10 md:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs" style={{ color }}>
            {n}
          </span>
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: `${color}14`, color }}
          >
            {icon}
          </span>
          <h2 className="font-grotesk text-lg font-bold tracking-tight">{title}</h2>
        </div>
        {right}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  )
}

export function HealthPill({ ok, okText, badText }: { ok: boolean | null; okText: string; badText: string }) {
  if (ok === null) return null
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[11px] font-semibold ${
        ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
      {ok ? okText : badText}
    </span>
  )
}
