import type { Tool } from '@/lib/tools'

export default function ToolHeader({ tool, children }: { tool: Tool; children?: React.ReactNode }) {
  return (
    <div className="border-b border-line">
      <div className="mx-auto max-w-6xl px-5 pb-10 pt-10 md:px-8 md:pt-14">
        <a
          href="#/"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-inkmuted transition-colors hover:text-ink"
        >
          ← Volver al índice
        </a>
        <div className="mt-6 flex items-start gap-4 md:gap-6">
          <span
            className="mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-mono text-sm font-semibold md:h-14 md:w-14"
            style={{ backgroundColor: tool.accent, color: tool.accentInk }}
          >
            {tool.num}
          </span>
          <div>
            <h1 className="font-grotesk text-4xl font-bold tracking-tighter md:text-6xl">
              {tool.name}
            </h1>
            <p className="mt-2 max-w-xl text-balance text-base text-inksoft md:text-lg">
              {tool.tagline}
            </p>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
