// https://docs.sentry.io/platforms/javascript/guides/nextjs/
import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || ''

export function register() {
  if (!SENTRY_DSN) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[Sentry] DSN not configured — skipping initialization')
    }
    return
  }

  Sentry.init({
    dsn: SENTRY_DSN,

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 0,

    // Session replay (errors only in production)
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: process.env.NODE_ENV === 'production' ? 1.0 : 0,

    // Environment tag
    environment: process.env.NODE_ENV || 'development',
  })
}
