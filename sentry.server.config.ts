import * as Sentry from '@sentry/nextjs'

// ─────────────────────────────────────────────────────────────────────────────
// Sentry — Server-side initialization
// ─────────────────────────────────────────────────────────────────────────────

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    environment: process.env.NODE_ENV,
    release:     process.env.NEXT_PUBLIC_APP_VERSION ?? 'development',

    // Lower sample rate on server — API routes fire frequently
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,

    // Do not send PII — player names are ephemeral session data
    beforeSend(event) {
        // Strip user.ip_address — GDPR compliance
        if (event.user) delete event.user['ip_address']
        return event
    },
})

