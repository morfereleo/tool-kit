import { ArrowUpRight } from '@/components/Layout'
import { TOOLS } from '@/lib/tools'

export default function Home() {
  return (
    <main className="pt-14">
      {/* HERO */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 pb-14 pt-16 md:px-8 md:pb-20 md:pt-24">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-inkmuted">
              Herramientas Freelance
            </span>
          </div>

          <h1 className="mt-6 font-grotesk text-[13vw] font-bold leading-[0.85] tracking-tighter md:text-[8.5rem]">
            Caja de
            <br />
            <span className="relative inline-block">
              herramientas
              <span className="absolute -right-6 top-2 hidden rotate-12 rounded-full border-2 border-ink px-3 py-1 font-mono text-xs font-medium uppercase tracking-widest md:inline-block">
                Beta
              </span>
            </span>
          </h1>

          <p className="mt-8 max-w-xl text-balance text-lg leading-relaxed text-inksoft md:text-xl">
            Utilidades rápidas y sin fricción para emprendedores y freelancers:
            calcula impuestos, convierte divisas, optimiza imágenes, genera QR y
            cotiza proyectos como un profesional.
          </p>

          <div className="mt-10 flex flex-wrap gap-2">
            {['Sin registro', 'Sin instalación', 'Tus datos no salen del navegador'].map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-line px-4 py-1.5 text-[13px] font-medium text-inksoft"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* INDEX */}
      <section>
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <p className="border-b border-line py-5 font-mono text-xs uppercase tracking-[0.25em] text-inkmuted">
            Selecciona una herramienta ↓
          </p>

          <ul>
            {TOOLS.map((tool) => (
              <li key={tool.id}>
                <a
                  href={tool.path}
                  className="group relative block overflow-hidden border-b border-line"
                >
                  {/* sweep */}
                  <span
                    className="absolute inset-0 origin-bottom scale-y-0 transition-transform duration-300 ease-out group-hover:scale-y-100"
                    style={{ backgroundColor: tool.accent }}
                  />
                  <span className="relative flex flex-col gap-2 py-6 transition-colors duration-200 group-hover:text-white md:flex-row md:items-center md:gap-8 md:py-8">
                    <span
                      className="font-mono text-sm font-medium md:w-14"
                      style={{ color: tool.accent }}
                    >
                      <span className="transition-colors duration-200 group-hover:text-white">
                        /{tool.num}
                      </span>
                    </span>
                    <span className="flex-1">
                      <span className="block font-grotesk text-2xl font-bold tracking-tight md:text-4xl">
                        {tool.name}
                      </span>
                      <span
                        className="mt-1 block text-sm text-inksoft transition-colors duration-200 group-hover:text-white/80 md:text-base"
                      >
                        {tool.tagline}
                      </span>
                    </span>
                    <span className="hidden transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 md:block">
                      <ArrowUpRight className="h-7 w-7" />
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* NOTE */}
      <section>
        <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
          <div className="grid gap-10 md:grid-cols-12">
            <div className="md:col-span-4">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-inkmuted">
                [ Nota ]
              </p>
            </div>
            <div className="md:col-span-8">
              <p className="font-grotesk text-2xl font-medium leading-snug tracking-tight md:text-3xl">
                Todo corre en tu navegador. Las tasas de cambio se consultan en
                vivo desde fuentes públicas; el resto de herramientas procesan
                tus datos localmente — nada se sube a ningún servidor.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
