import posthog from 'posthog-js'

// Acepta ambos nombres de variable (el proyecto de Vercel usa _KEY);
// el host por defecto es PostHog Cloud US.
const projectToken =
  import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN ||
  import.meta.env.VITE_PUBLIC_POSTHOG_KEY
const host = import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'

if (!projectToken) {
  if (import.meta.env.DEV) {
    console.warn(
      'PostHog sin configurar (falta VITE_PUBLIC_POSTHOG_PROJECT_TOKEN o VITE_PUBLIC_POSTHOG_KEY): los eventos no se registran.',
    )
  }
} else {
  posthog.init(projectToken, {
    api_host: host,
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
