import * as Sentry from '@sentry/nextjs'

// ─────────────────────────────────────────────────────────────────────────────
// Sentry — Client-side initialization
// ─────────────────────────────────────────────────────────────────────────────

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Environment tagging
    environment: process.env.NODE_ENV,
    release:     process.env.NEXT_PUBLIC_APP_VERSION ?? 'development',

    // Tracing — capture 10% in production, 100% in dev
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Session Replay — 1% all sessions, 100% on error
    replaysSessionSampleRate: 0.01,
    replaysOnErrorSampleRate: 1.0,

    // Only load Session Replay in browsers (not SSR)
    integrations: [
        Sentry.replayIntegration({
            // Mask all text + block all media by default
            maskAllText:    true,
            blockAllMedia:  true,
        }),
    ],

    // Scrub sensitive data from breadcrumbs
    beforeBreadcrumb(breadcrumb) {
        // Don't log XHR bodies — may contain player names
        if (breadcrumb.category === 'xhr') {
            if (breadcrumb.data) delete breadcrumb.data['body']
        }
        return breadcrumb
    },

    // Filter out known non-actionable errors
    beforeSend(event) {
        // Ignore network errors that are user-side issues
        if (event.exception?.values?.[0]?.type === 'TypeError') {
            const msg = event.exception.values[0].value ?? ''
            if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
                return null
            }
        }
        return event
    },
})

