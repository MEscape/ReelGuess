'use client'

import Script from 'next/script'
import { useCookieConsent } from '@/features/legal/cookie-consent-context'

declare global {
    interface Window { adsbygoogle: object[] }
}

export function ConsentGatedAds() {
    const { consent } = useCookieConsent()

    if (consent === null) return null  // banner not yet answered

    const isPersonalized = consent.advertising === 'personalized'

    return (
        <Script
            id="adsense-script"
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
            data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_ID}
            strategy="lazyOnload"
            crossOrigin="anonymous"
            onLoad={() => {
                window.adsbygoogle = window.adsbygoogle ?? []
                window.adsbygoogle.push({
                    google_ad_client:            process.env.NEXT_PUBLIC_ADSENSE_ID,
                    enable_page_level_ads:       true,
                    ...(isPersonalized ? {} : { requestNonPersonalizedAds: 1 }),
                })
            }}
        />
    )
}