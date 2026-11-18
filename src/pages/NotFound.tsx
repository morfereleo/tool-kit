import { TOOLS, toolText } from '@/lib/tools'
import { useLang, useT } from '@/lib/i18n'

export default function NotFound() {
  const { lang } = useLang()
  const t = useT()
  return (
    <main className="pt-14">
      <section className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-inkmuted">{t('nf.kicker')}</p>
        <h1 className="mt-6 font-grotesk text-5xl font-bold tracking-tighter md:text-7xl">{t('nf.title')}</h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-inksoft">{t('nf.sub')}</p>

        <ul className="mt-10 grid gap-2 sm:grid-cols-2">
          {TOOLS.map((tool) => (
            <li key={tool.id}>
              <a
                href={tool.path}
                className="flex items-center gap-3 rounded-xl border border-line px-4 py-3 transition-colors hover:border-inkmuted"
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: tool.accent }} />
                <span className="font-semibold">{toolText(tool, lang).name}</span>
              </a>
            </li>
          ))}
        </ul>

        <a href="/" className="mt-10 inline-block font-mono text-sm text-inksoft underline underline-offset-4 hover:text-ink">
          {t('nf.home')}
        </a>
      </section>
    </main>
  )
}
