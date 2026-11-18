import posthog from 'posthog-js'

// Acepta ambos nombres de variable (el proyecto de Vercel usa _KEY).
const projectToken =
  import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN ||
  import.meta.env.VITE_PUBLIC_POSTHOG_KEY
// En producción los eventos pasan por el reverse proxy de vercel.json (/kxq),
// así los bloqueadores de anuncios no los descartan. En dev, directo a US.
const host =
  import.meta.env.VITE_PUBLIC_POSTHOG_HOST ||
  (import.meta.env.PROD ? '/kxq' : 'https://us.i.posthog.com')

if (!projectToken) {
  if (import.meta.env.DEV) {
    console.warn(
      'PostHog sin configurar (falta VITE_PUBLIC_POSTHOG_PROJECT_TOKEN o VITE_PUBLIC_POSTHOG_KEY): los eventos no se registran.',
    )
  }
} else {
  posthog.init(projectToken, {
    api_host: host,
    ui_host: 'https://us.posthog.com',
    defaults: '2026-01-30',
    // Analítica de uso, no de contenido: nunca grabamos sesiones ni el
    // texto que el usuario escribe (montos, clientes, documentos).
    disable_session_recording: true,
    autocapture: {
      element_allowlist: ['a', 'button'],
    },
  })
}

export default posthog
