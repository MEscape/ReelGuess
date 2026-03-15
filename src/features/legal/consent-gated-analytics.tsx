'use client'

// ─────────────────────────────────────────────────────────────────────────────
// ConsentGatedAnalytics — only loads Vercel Analytics after user opts in.
// ─────────────────────────────────────────────────────────────────────────────

import { Analytics }     from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { useCookieConsent } from './cookie-consent-context'

export function ConsentGatedAnalytics() {
    const { consent } = useCookieConsent()

    if (!consent?.analytics) return null

    return (
        <>
            <Analytics />
            <SpeedInsights />
        </>
    )
}

