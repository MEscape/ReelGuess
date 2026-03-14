import * as Sentry from '@sentry/nextjs'

// ─────────────────────────────────────────────────────────────────────────────
// Sentry — Edge Runtime initialization
// Used by Next.js middleware and Edge API routes
// ─────────────────────────────────────────────────────────────────────────────

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    environment:      process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,
})

