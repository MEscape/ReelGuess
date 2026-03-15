'use client'

import Script from 'next/script'
import { useCookieConsent } from '@/features/legal/cookie-consent-context'

declare global {
    interface Window {
        adsbygoogle: object[]
        __adsensePageLevelPushed?: boolean
    }
}

export function ConsentGatedAds() {
    const { consent } = useCookieConsent()

    if (consent === null) return null  // banner not yet answered

    const isPersonalized = consent.advertising === 'personalized'

    return (
        <Script
            id="adsense-script"
            // strategy="afterInteractive" avoids Next.js adding data-nscript attribute
            // which Google AdSense does not support on its loader script.
            strategy="afterInteractive"
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
            data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_ID}
            crossOrigin="anonymous"
            onLoad={() => {
                // Guard: enable_page_level_ads must only be pushed once per page.
                // React Strict Mode (dev) and router refreshes can re-run this callback.
                if (window.__adsensePageLevelPushed) return
                window.__adsensePageLevelPushed = true
                window.adsbygoogle = window.adsbygoogle ?? []
                window.adsbygoogle.push({
                    google_ad_client:      process.env.NEXT_PUBLIC_ADSENSE_ID,
                    enable_page_level_ads: true,
                    ...(isPersonalized ? {} : { requestNonPersonalizedAds: 1 }),
                })
            }}
        />
    )
}