'use client'

// ─────────────────────────────────────────────────────────────────────────────
// ConsentGatedSentry
//
// Sentry's client config reads localStorage at boot time. If the user gives
// analytics consent AFTER the initial page load, this component triggers a
// Sentry re-init so tracing activates without a page reload.
//
// It also handles the reverse: if the user revokes consent, beforeSend in
// sentry.client.config.ts already blocks all events — no extra action needed.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react'
import { useCookieConsent }  from './cookie-consent-context'

export function ConsentGatedSentry() {
    const { consent }   = useCookieConsent()
    const prevConsent   = useRef(consent?.analytics)

    useEffect(() => {
        // Only act when analytics consent transitions from false/null → true
        if (consent?.analytics && !prevConsent.current) {
            // Dynamically re-initialize Sentry with full config now that consent is given
            import('@sentry/nextjs').then((Sentry) => {
                Sentry.init({
                    dsn:              process.env.NEXT_PUBLIC_SENTRY_DSN,
                    environment:      process.env.NODE_ENV,
                    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
                    replaysSessionSampleRate: 0.01,
                    replaysOnErrorSampleRate: 1.0,
                    integrations: [
                        Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
                    ],
                    beforeSend(event) {
                        // Always re-check live consent
                        try {
                            const raw    = localStorage.getItem('rg_cookie_consent')
                            const parsed = raw ? JSON.parse(raw) as Record<string, unknown> : null
                            if (parsed?.['analytics'] !== true) return null
                        } catch { return null }
                        return event
                    },
                })
            }).catch(() => { /* Sentry unavailable — silent */ })
        }
        prevConsent.current = consent?.analytics
    }, [consent?.analytics])

    return null
}

