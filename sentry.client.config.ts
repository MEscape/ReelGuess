import * as Sentry from '@sentry/nextjs'

// ─────────────────────────────────────────────────────────────────────────────
// Sentry — Client-side initialization
//
// GDPR / TTDSG compliance:
//   Client-side error tracking (tracing, session replay) involves sending
//   diagnostic data to a third party (Sentry Inc., USA) and therefore
//   requires user consent under Art. 6 Abs. 1 lit. a DSGVO.
//
//   We read the consent state from localStorage synchronously at init time
//   (before any React mounts). If no analytics consent is stored we:
//     - Disable tracing (no performance data sent)
//     - Disable session replay
//     - Block all events via beforeSend → returns null
//
//   The consent gate is also enforced per-event via `beforeSend` as a
//   safety net in case consent changes mid-session.
// ─────────────────────────────────────────────────────────────────────────────

const CONSENT_KEY = 'rg_cookie_consent'

function hasAnalyticsConsent(): boolean {
    try {
        const raw = localStorage.getItem(CONSENT_KEY)
        if (!raw) return false
        const parsed = JSON.parse(raw) as Record<string, unknown>
        return parsed['analytics'] === true
    } catch {
        return false
    }
}

const analyticsAllowed = hasAnalyticsConsent()

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Environment tagging
    environment: process.env.NODE_ENV,
    release:     process.env.NEXT_PUBLIC_APP_VERSION ?? 'development',

    // Tracing — only when consent given
    tracesSampleRate: analyticsAllowed
        ? (process.env.NODE_ENV === 'production' ? 0.1 : 1.0)
        : 0,

    // Session Replay — only when consent given
    replaysSessionSampleRate: analyticsAllowed ? 0.01 : 0,
    replaysOnErrorSampleRate: analyticsAllowed ? 1.0  : 0,

    integrations: analyticsAllowed
        ? [
            Sentry.replayIntegration({
                // Mask all text + block all media by default
                maskAllText:    true,
                blockAllMedia:  true,
            }),
        ]
        : [],

    // Scrub sensitive data from breadcrumbs
    beforeBreadcrumb(breadcrumb) {
        // Don't log XHR bodies — may contain player names
        if (breadcrumb.category === 'xhr') {
            if (breadcrumb.data) delete breadcrumb.data['body']
        }
        return breadcrumb
    },

    beforeSend(event) {
        // Hard gate: re-check consent at send-time in case it was revoked
        if (!hasAnalyticsConsent()) return null

        // Ignore client-side network errors — not actionable
        if (event.exception?.values?.[0]?.type === 'TypeError') {
            const msg = event.exception.values[0].value ?? ''
            if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
                return null
            }
        }
        return event
    },
})
