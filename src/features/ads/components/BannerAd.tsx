'use client'

import React, { useEffect, useRef } from 'react'
import { useCookieConsent } from '@/features/legal/cookie-consent-context'
import { useAdBlockDetection } from '../hooks/use-ad-block-detection'
import { ADSENSE_PUBLISHER_ID, getSlot } from '@/lib/ads/config'
import type { AdPlacement } from '@/lib/ads/types'

type Props = {
    placement: Extract<AdPlacement, `banner-${string}`>
    format?:   'auto' | 'rectangle' | 'horizontal'
    className?: string
}

export function BannerAd({ placement, format = 'auto', className = '' }: Props) {
    const { consent }    = useCookieConsent()
    const { isBlocked }  = useAdBlockDetection()
    const insRef         = useRef<HTMLModElement>(null)
    const pushed         = useRef(false)

    // consent is ConsentState | null — no optional chain needed
    const hasConsent     = consent !== null
    const isPersonalized = consent?.advertising === 'personalized'
    const hasPublisherId = Boolean(ADSENSE_PUBLISHER_ID)
    const slot           = hasConsent && hasPublisherId ? getSlot(placement) : null

    useEffect(() => {
        if (!slot || isBlocked || pushed.current || !insRef.current) return
        try {
            window.adsbygoogle = window.adsbygoogle ?? []
            window.adsbygoogle.push({})
            pushed.current = true
        } catch { /* ignore */ }
    }, [slot, isBlocked])

    return (
        <div
            className={`ad-banner-slot ${className}`}
            aria-hidden={!hasConsent}
            style={{ minHeight: 'var(--ad-banner-h, 90px)', width: '100%' }}
        >
            {slot && !isBlocked && (
                <ins
                    ref={insRef}
                    className="adsbygoogle"
                    style={{ display: 'block', width: '100%', height: '100%' }}
                    data-ad-client={ADSENSE_PUBLISHER_ID}
                    data-ad-slot={slot.slotId}
                    data-ad-format={format}
                    data-full-width-responsive="true"
                    // NPA is handled globally by ConsentGatedAds via requestNonPersonalizedAds.
                    // Per-slot we only need to signal whether the user consented to personalization.
                    data-npa={isPersonalized ? '0' : '1'}
                />
            )}
        </div>
    )
}