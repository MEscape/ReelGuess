// Ad System Configuration
// All values are driven by env-vars so the build stays provider-agnostic.

import type { AdSlot } from './types'

/** Minimum milliseconds between two interstitial ads (3 minutes) */
export const MIN_INTERSTITIAL_INTERVAL_MS = 3 * 60 * 1_000

/** Maximum interstitials shown per session before we stop nagging */
export const MAX_INTERSTITIAL_PER_SESSION = 5

/** Google AdSense publisher ID â€” injected at build/runtime via env */
export const ADSENSE_PUBLISHER_ID =
    process.env.NEXT_PUBLIC_ADSENSE_ID ?? ''

/**
 * All ad slots used across the application.
 * Change `slotId` values to match your AdSense / Ad Manager units.
 */
export const AD_SLOTS: AdSlot[] = [
    {
        placement: 'banner-lobby',
        format:    'banner',
        slotId:    process.env.NEXT_PUBLIC_AD_SLOT_BANNER_LOBBY         ?? '0000000000',
    },
    {
        placement: 'banner-round-complete',
        format:    'banner',
        slotId:    process.env.NEXT_PUBLIC_AD_SLOT_BANNER_ROUND         ?? '1111111111',
    },
    {
        placement: 'banner-game-over',
        format:    'banner',
        slotId:    process.env.NEXT_PUBLIC_AD_SLOT_BANNER_GAMEOVER      ?? '2222222222',
    },
    {
        placement: 'interstitial-game-start',
        format:    'interstitial',
        slotId:    process.env.NEXT_PUBLIC_AD_SLOT_INTERSTITIAL_START   ?? '3333333333',
    },
    {
        placement: 'interstitial-game-over',
        format:    'interstitial',
        slotId:    process.env.NEXT_PUBLIC_AD_SLOT_INTERSTITIAL_END     ?? '4444444444',
    },
    {
        placement: 'rewarded-bonus',
        format:    'rewarded',
        slotId:    process.env.NEXT_PUBLIC_AD_SLOT_REWARDED             ?? '5555555555',
    },
    {
        placement: 'banner-content-about',
        format:    'banner',
        slotId:    process.env.NEXT_PUBLIC_AD_SLOT_CONTENT_ABOUT        ?? '6666666666',
    },
    {
        placement: 'banner-content-how-to-play',
        format:    'banner',
        slotId:    process.env.NEXT_PUBLIC_AD_SLOT_CONTENT_HTP          ?? '7777777777',
    },
    {
        placement: 'banner-content-how-to-import',
        format:    'banner',
        slotId:    process.env.NEXT_PUBLIC_AD_SLOT_CONTENT_IMPORT       ?? '8888888888',
    },
    {
        placement: 'banner-content-faq',
        format:    'banner',
        slotId:    process.env.NEXT_PUBLIC_AD_SLOT_CONTENT_FAQ          ?? '9999999999',
    },
]

/** Lookup helper throws if an unknown placement is requested */
export function getSlot(placement: AdSlot['placement']): AdSlot {
    const slot = AD_SLOTS.find((s) => s.placement === placement)
    if (!slot) throw new Error(`[Ads] Unknown placement: ${placement}`)
    return slot
}

