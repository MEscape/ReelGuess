'use client'

import { useCallback, useState } from 'react'
import { useCookieConsent } from '@/features/legal/cookie-consent-context'
import { FrequencyManager } from '@/lib/ads/frequency-manager'
import type { AdPlacement } from '@/lib/ads/types'

export type UseAdsReturn = {
    hasAdConsent:        boolean
    isPersonalized:      boolean
    canShowInterstitial: boolean
    canShowBanner:       boolean
    showInterstitial:    (placement: AdPlacement) => boolean
    activeInterstitial:  AdPlacement | null
    dismissInterstitial: () => void
    cooldownMs:          number
}

export function useAds(): UseAdsReturn {
    const { consent } = useCookieConsent()

    const hasAdConsent   = consent !== null
    const isPersonalized = consent !== null && consent.advertising === 'personalized'

    const [activeInterstitial, setActiveInterstitial] = useState<AdPlacement | null>(null)

    const canShowInterstitial = hasAdConsent && FrequencyManager.canShowInterstitial()
    const canShowBanner       = hasAdConsent && FrequencyManager.canShowBanner()

    const showInterstitial = useCallback(
        (placement: AdPlacement): boolean => {
            if (!hasAdConsent || !FrequencyManager.canShowInterstitial()) return false
            FrequencyManager.recordInterstitial()
            setActiveInterstitial(placement)
            return true
        },
        [hasAdConsent]
    )

    const dismissInterstitial = useCallback(() => {
        setActiveInterstitial(null)
    }, [])

    return {
        hasAdConsent,
        isPersonalized,
        canShowInterstitial,
        canShowBanner,
        showInterstitial,
        activeInterstitial,
        dismissInterstitial,
        cooldownMs: FrequencyManager.remainingCooldownMs(),
    }
}
