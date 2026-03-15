// Ad System â€” Core Types

/** All supported ad placement zones */
export type AdPlacement =
    | 'banner-lobby'
    | 'banner-round-complete'
    | 'banner-game-over'
    | 'interstitial-game-start'
    | 'interstitial-game-over'
    | 'rewarded-bonus'

/** Ad format category */
export type AdFormat = 'banner' | 'interstitial' | 'rewarded'

/** A single ad slot configuration */
export type AdSlot = {
    placement: AdPlacement
    format:    AdFormat
    slotId:    string   // provider-specific slot/unit ID
}

/** Per-format frequency state persisted in localStorage */
export type FrequencyState = {
    lastInterstitialAt: number | null   // epoch ms
    interstitialCount:  number          // within current session
    sessionStart:       number          // epoch ms
}

