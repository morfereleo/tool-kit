import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LangProvider } from '@/lib/i18n'
import { PostHogErrorBoundary, PostHogProvider } from '@posthog/react'
import posthog from '@/lib/posthog'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PostHogProvider client={posthog}>
      <PostHogErrorBoundary>
        <LangProvider>
          <App />
        </LangProvider>
      </PostHogErrorBoundary>
    </PostHogProvider>
  </StrictMode>,
)
