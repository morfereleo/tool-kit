import { useCallback, useRef, useState } from 'react'
import BrandShell from '@/components/BrandShell'
import BeforeAfterModal from '@/components/BeforeAfterModal'
import { TOOLS } from '@/lib/tools'
import { fmtBytes } from '@/lib/format'
import { useLang, useT } from '@/lib/i18n'
import posthog from '@/lib/posthog'

const tool = TOOLS[2]
const ACCENT = tool.accent

type Job = {
  id: string
  file: File
  name: string
  originalSize: number
  status: 'pending' | 'done' | 'error'
  webpBlob?: Blob
  webpSize?: number
  preview?: string
  width?: number
  height?: number
}

async function convertToWebP(file: File, quality: number, maxWidth: number): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file)
  let { width, height } = bitmap
  if (maxWidth > 0 && width > maxWidth) {
    height = Math.round((height * maxWidth) / width)
    width = maxWidth
  }
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', quality / 100),
  )
  if (!blob) throw new Error('No se pudo convertir')
  return { blob, width, height }
}

export default function ImagenesPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [quality, setQuality] = useState(82)
  const [maxWidth, setMaxWidth] = useState('0')
  const [dragging, setDragging] = useState(false)
  const [compare, setCompare] = useState<{ job: Job; webpUrl: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const t = useT()
  const { lang } = useLang()

  const openCompare = (job: Job) => {
    if (!job.webpBlob || !job.preview) return
    setCompare({ job, webpUrl: URL.createObjectURL(job.webpBlob) })
  }

  const closeCompare = () => {
    if (compare) URL.revokeObjectURL(compare.webpUrl)
    setCompare(null)
  }

  const addFiles = useCallback((files: FileList | File[]) => {
    const accepted = Array.from(files).filter((f) =>
      ['image/jpeg', 'image/png', 'image/jpg'].includes(f.type),
    )
    if (!accepted.length) return
    const newJobs: Job[] = accepted.map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
      name: file.name.replace(/\.(jpe?g|png)$/i, ''),
      originalSize: file.size,
      status: 'pending',
      preview: URL.createObjectURL(file),
    }))
    setJobs((prev) => [...prev, ...newJobs])
  }, [])

  const processAll = useCallback(async () => {
    const mw = parseInt(maxWidth) || 0
    setJobs((prev) => prev.map((j) => (j.status === 'pending' ? j : j)))
    const pendingJobs = jobs.filter((j) => j.status === 'pending')
    let optimizedCount = 0
    for (const job of pendingJobs) {
      try {
        const { blob, width, height } = await convertToWebP(job.file, quality, mw)
        optimizedCount += 1
        setJobs((prev) =>
          prev.map((j) =>
            j.id === job.id ? { ...j, status: 'done', webpBlob: blob, webpSize: blob.size, width, height } : j,
          ),
        )
      } catch {
        setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: 'error' } : j)))
      }
    }
    if (optimizedCount > 0) {
      posthog.capture('images_optimized', { image_count: optimizedCount, quality, has_max_width: mw > 0 })
    }
  }, [jobs, quality, maxWidth])

  const downloadOne = (job: Job) => {
    if (!job.webpBlob) return
    const url = URL.createObjectURL(job.webpBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${job.name}.webp`
    a.click()
    posthog.capture('optimized_images_downloaded', { download_format: 'webp', image_count: 1 })
    URL.revokeObjectURL(url)
  }

  const downloadAll = async () => {
    const done = jobs.filter((j) => j.status === 'done' && j.webpBlob)
    if (!done.length) return
    if (done.length === 1) return downloadOne(done[0])
    const { default: JSZip } = await import('jszip')
    const zip = new JSZip()
    done.forEach((j) => zip.file(`${j.name}.webp`, j.webpBlob!))
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = lang === 'es' ? 'imagenes-webp.zip' : 'images-webp.zip'
    a.click()
    posthog.capture('optimized_images_downloaded', { download_format: 'zip', image_count: done.length })
    URL.revokeObjectURL(url)
  }

  const totalSaved = jobs
    .filter((j) => j.status === 'done' && j.webpSize != null)
    .reduce((acc, j) => acc + (j.originalSize - (j.webpSize ?? 0)), 0)

  const doneCount = jobs.filter((j) => j.status === 'done').length
  const pendingCount = jobs.filter((j) => j.status === 'pending').length

  return (
    <BrandShell tool={tool}>
      <section className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
        {/* DROPZONE */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            addFiles(e.dataTransfer.files)
          }}
          onClick={() => inputRef.current?.click()}
          className={`group cursor-pointer rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-all md:py-20 ${
            dragging ? 'border-transparent' : 'border-line hover:border-inkmuted'
          }`}
          style={dragging ? { backgroundColor: `${ACCENT}12`, borderColor: ACCENT } : undefined}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full transition-transform group-hover:scale-110"
            style={{ backgroundColor: `${ACCENT}18`, color: ACCENT }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
              <path d="M12 16V4m0 0L7 9m5-5l5 5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 20h16" strokeLinecap="round" />
            </svg>
          </div>
          <p className="mt-5 font-grotesk text-2xl font-bold tracking-tight">
            {dragging ? t('img.dropping') : t('img.drop')}
          </p>
          <p className="mt-2 text-sm text-inksoft">
            {t('img.dropHint')}
          </p>
        </div>

        {/* CONTROLS */}
        {jobs.length > 0 && (
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            <div>
              <label className="field-label">{t('img.quality', { q: quality })}</label>
              <input
                type="range"
                min="30"
                max="100"
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value))}
                className="mt-3 w-full"
                style={{ accentColor: ACCENT }}
              />
              <p className="mt-1 font-mono text-[11px] text-inkmuted">{t('img.qualityHint')}</p>
            </div>
            <div>
              <label className="field-label">{t('img.maxWidth')}</label>
              <input
                type="number"
                min="0"
                step="100"
                value={maxWidth}
                onChange={(e) => setMaxWidth(e.target.value)}
                className="field-box font-mono"
              />
            </div>
            <div className="flex flex-col justify-end gap-2">
              <button
                onClick={processAll}
                disabled={pendingCount === 0}
                className="w-full rounded-full py-3.5 text-sm font-semibold text-white transition-opacity disabled:opacity-30"
                style={{ backgroundColor: ACCENT }}
              >
                {pendingCount > 0
                  ? pendingCount > 1
                    ? t('img.optimizeMany', { n: pendingCount })
                    : t('img.optimizeOne', { n: pendingCount })
                  : t('img.allDone')}
              </button>
              {doneCount > 0 && (
                <button
                  onClick={downloadAll}
                  className="w-full rounded-full border border-ink py-3 text-sm font-semibold transition-colors hover:bg-ink hover:text-paper"
                >
                  {doneCount > 1 ? t('img.downloadZip') : t('img.downloadOne')}
                </button>
              )}
            </div>
          </div>
        )}

        {/* SAVINGS STRIP */}
        {doneCount > 0 && (
          <div
            className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-xl px-6 py-5 text-white"
            style={{ backgroundColor: ACCENT }}
          >
            <p className="font-grotesk text-xl font-bold tracking-tight">
              {fmtBytes(totalSaved)} {t('img.saved')}
            </p>
            <p className="font-mono text-sm text-white/80">
              {doneCount} {doneCount > 1 ? t('img.imagesDone') : t('img.imageDone')}
            </p>
          </div>
        )}

        {/* JOB LIST */}
        {jobs.length > 0 && (
          <ul className="mt-10 border-t border-line">
            {jobs.map((job) => {
              const saving =
                job.status === 'done' && job.webpSize != null
                  ? Math.round((1 - job.webpSize / job.originalSize) * 100)
                  : null
              return (
                <li key={job.id} className="flex items-center gap-3 border-b border-line py-4 sm:gap-4">
                  {job.status === 'done' ? (
                    <button
                      onClick={() => openCompare(job)}
                      className="group relative shrink-0"
                      title={t('img.compare')}
                    >
                      <img
                        src={job.preview}
                        alt=""
                        className="h-12 w-12 rounded-lg border border-line object-cover transition-opacity group-hover:opacity-70"
                      />
                      <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-ink/0 text-paper opacity-0 transition-all group-hover:bg-ink/40 group-hover:opacity-100">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                          <path d="M8 7l-4 5 4 5M16 7l4 5-4 5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </button>
                  ) : (
                    <img
                      src={job.preview}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg border border-line object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{job.name}.webp</p>
                    <p className="font-mono text-xs text-inkmuted">
                      {fmtBytes(job.originalSize)}
                      {job.status === 'done' && job.webpSize != null && (
                        <>
                          {' → '}
                          <span style={{ color: ACCENT }} className="font-semibold">
                            {fmtBytes(job.webpSize)}
                          </span>
                          {job.width && job.height && ` · ${job.width}×${job.height}`}
                        </>
                      )}
                      {job.status === 'pending' && t('img.pending')}
                      {job.status === 'error' && t('img.failed')}
                    </p>
                  </div>
                  {saving != null && (
                    <span
                      className="rounded-full px-3 py-1 font-mono text-xs font-semibold"
                      style={{ backgroundColor: `${ACCENT}18`, color: ACCENT }}
                    >
                      −{saving}%
                    </span>
                  )}
                  {job.status === 'done' && (
                    <button
                      onClick={() => downloadOne(job)}
                      className="shrink-0 rounded-full border border-line px-3 py-2 text-xs font-semibold transition-colors hover:border-ink hover:bg-ink hover:text-paper sm:px-4"
                    >
                      {t('img.download')}
                    </button>
                  )}
                  <button
                    onClick={() => setJobs((prev) => prev.filter((j) => j.id !== job.id))}
                    className="text-inkmuted transition-colors hover:text-ink"
                    aria-label={t('qr.remove')}
                  >
                    ✕
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {jobs.length === 0 && (
          <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
            {[
              { n: '1', t: t('img.step1t'), d: t('img.step1d') },
              { n: '2', t: t('img.step2t'), d: t('img.step2d') },
              { n: '3', t: t('img.step3t'), d: t('img.step3d') },
            ].map((s) => (
              <div key={s.n} className="bg-paper p-6">
                <span className="font-mono text-sm" style={{ color: ACCENT }}>
                  {s.n} —
                </span>
                <p className="mt-2 font-grotesk text-lg font-bold">{s.t}</p>
                <p className="mt-1 text-sm text-inksoft">{s.d}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {compare && (
        <BeforeAfterModal
          originalUrl={compare.job.preview!}
          webpUrl={compare.webpUrl}
          name={`${compare.job.name}.webp`}
          originalSize={compare.job.originalSize}
          webpSize={compare.job.webpSize ?? 0}
          accent={ACCENT}
          onClose={closeCompare}
        />
      )}
    </BrandShell>
  )
}
