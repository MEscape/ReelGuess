'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useCookieConsent } from '@/features/legal/cookie-consent-context'
import { ADSENSE_PUBLISHER_ID, getSlot } from '@/lib/ads/config'
import type { AdPlacement } from '@/lib/ads/types'

const DISPLAY_SECS = 5

type Props = {
    placement: Extract<AdPlacement, `interstitial-${string}` | `rewarded-${string}`>
    onClose:   () => void
    onReward?: () => void
}

export function InterstitialAd({ placement, onClose, onReward }: Props) {
    const t              = useTranslations('ads')
    const { consent }    = useCookieConsent()
    const hasConsent     = consent !== null
    const isPersonalized = consent?.advertising === 'personalized'
    const hasPublisherId = Boolean(ADSENSE_PUBLISHER_ID)

    const [countdown, setCountdown] = useState(DISPLAY_SECS)
    const [canClose,  setCanClose]  = useState(false)
    const insRef   = useRef<HTMLModElement>(null)
    const pushed   = useRef(false)
    const closeRef = useRef<HTMLButtonElement>(null)

    // Countdown
    useEffect(() => {
        if (countdown <= 0) {
            setCanClose(true)
            onReward?.()
            return
        }
        const id = setTimeout(() => setCountdown((c) => c - 1), 1000)
        return () => clearTimeout(id)
    }, [countdown, onReward])

    // Focus close button when available
    useEffect(() => {
        if (canClose) closeRef.current?.focus()
    }, [canClose])

    // Esc to close
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape' && canClose) onClose()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [canClose, onClose])

    // Push ad slot
    useEffect(() => {
        if (!hasConsent || !hasPublisherId || pushed.current || !insRef.current) return
        try {
            window.adsbygoogle = window.adsbygoogle ?? []
            window.adsbygoogle.push({})
            pushed.current = true
        } catch { /* ignore */ }
    }, [hasConsent, hasPublisherId])

    if (!hasConsent || !hasPublisherId) return null

    const slot = getSlot(placement)

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={t('interstitialLabel')}
            style={{
                position:       'fixed',
                inset:          0,
                zIndex:         9999,
                background:     'rgba(0,0,0,0.85)',
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                justifyContent: 'center',
                padding:        '1rem',
            }}
        >
            <div style={{
                position:  'relative',
                width:     '100%',
                maxWidth:  480,
                background:'#fff',
                borderRadius: 4,
                overflow:  'hidden',
                minHeight: 250,
            }}>
                <ins
                    ref={insRef}
                    className="adsbygoogle"
                    style={{ display: 'block', width: '100%', minHeight: 250 }}
                    data-ad-client={ADSENSE_PUBLISHER_ID}
                    data-ad-slot={slot.slotId}
                    data-ad-format="auto"
                    data-npa={isPersonalized ? '0' : '1'}
                />

                <button
                    ref={closeRef}
                    onClick={canClose ? onClose : undefined}
                    disabled={!canClose}
                    aria-label={
                        canClose
                            ? t('closeAd')
                            : t('closeAdIn', { seconds: countdown })
                    }
                    style={{
                        position:   'absolute',
                        top: 8, right: 8,
                        width: 32,  height: 32,
                        borderRadius: '50%',
                        border:     '2px solid currentColor',
                        background: canClose ? '#000' : '#666',
                        color:      '#fff',
                        cursor:     canClose ? 'pointer' : 'not-allowed',
                        fontWeight: 700,
                        fontSize:   13,
                        display:    'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {canClose ? '×' : countdown}
                </button>
            </div>

            <p style={{ color: '#aaa', fontSize: 12, marginTop: 8 }}>
                {t('adDisclosure')}
            </p>
        </div>
    )
}