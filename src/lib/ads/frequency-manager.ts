// Ad System — Frequency Manager
// Manages interstitial and banner ad frequency per user session.

import {
    MIN_INTERSTITIAL_INTERVAL_MS,
    MAX_INTERSTITIAL_PER_SESSION,
} from './config'
import type { FrequencyState } from './types'

const STORAGE_KEY = 'rg_ad_freq'

// --- Helpers ---

/** Returns current timestamp in milliseconds */
function now(): number {
    return Date.now()
}

/** Loads the frequency state from localStorage, resets if session expired (2h) */
function loadState(): FrequencyState {
    if (typeof window === 'undefined') {
        // Server-side fallback
        return { lastInterstitialAt: null, interstitialCount: 0, sessionStart: now() }
    }

    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
            const parsed = JSON.parse(raw) as FrequencyState
            // Reset if session is older than 2 hours
            if (now() - parsed.sessionStart > 2 * 60 * 60 * 1_000) {
                return { lastInterstitialAt: null, interstitialCount: 0, sessionStart: now() }
            }
            return parsed
        }
    } catch {
        // Ignore errors
    }

    return { lastInterstitialAt: null, interstitialCount: 0, sessionStart: now() }
}

/** Saves the frequency state to localStorage */
function saveState(state: FrequencyState): void {
    if (typeof window === 'undefined') return
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
        // Ignore errors
    }
}

// --- Frequency Manager ---

export const FrequencyManager = {
    /** Can we show an interstitial ad now? */
    canShowInterstitial(): boolean {
        if (typeof window === 'undefined') return false

        const state = loadState()

        // Max interstitials per session reached
        if (state.interstitialCount >= MAX_INTERSTITIAL_PER_SESSION) return false

        // Min cooldown interval not yet passed
        if (state.lastInterstitialAt !== null &&
            now() - state.lastInterstitialAt < MIN_INTERSTITIAL_INTERVAL_MS
        ) return false

        return true
    },

    /** Can we show a banner ad? */
    canShowBanner(): boolean {
        return typeof window !== 'undefined'
    },

    /** Record that an interstitial ad was shown */
    recordInterstitial(): void {
        const state = loadState()
        saveState({
            ...state,
            lastInterstitialAt: now(),
            interstitialCount: state.interstitialCount + 1,
        })
    },

    /** Returns remaining cooldown time in ms before next interstitial can show */
    remainingCooldownMs(): number {
        const state = loadState()
        if (state.lastInterstitialAt === null) return 0
        const elapsed = now() - state.lastInterstitialAt
        return Math.max(0, MIN_INTERSTITIAL_INTERVAL_MS - elapsed)
    },

    /** Reset frequency state (e.g., for testing or logout) */
    reset(): void {
        if (typeof window === 'undefined') return
        try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
    },
}
