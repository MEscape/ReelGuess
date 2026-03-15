'use client'

// ─────────────────────────────────────────────────────────────────────────────
// Cookie Consent — Context + Provider + Hook
//
// Stores user consent in localStorage under the key `rg_cookie_consent`.
// State is `null` while unknown (banner shown), or a ConsentState object.
// ─────────────────────────────────────────────────────────────────────────────

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ConsentState = {
    /** Always true — required for site operation. */
    necessary: true
    /** Vercel Analytics and similar. Requires explicit opt-in. */
    analytics: boolean
    /** ISO timestamp of when the user gave consent. */
    timestamp: string
}

type CookieConsentContextValue = {
    /** null = not yet decided (show banner); ConsentState = decided */
    consent: ConsentState | null
    acceptAll:       () => void
    rejectAll:       () => void
    savePreferences: (analytics: boolean) => void
    resetConsent:    () => void
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'rg_cookie_consent'

// ── Context ───────────────────────────────────────────────────────────────────

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────

export function CookieConsentProvider({ children }: { children: ReactNode }) {
    const [consent, setConsent] = useState<ConsentState | null>(null)
    const [hydrated, setHydrated] = useState(false)

    // Hydrate from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY)
            if (stored) {
                const parsed = JSON.parse(stored) as ConsentState
                if (
                    typeof parsed === 'object' &&
                    parsed.necessary === true &&
                    typeof parsed.analytics === 'boolean'
                ) {
                    setConsent(parsed)
                }
            }
        } catch {
            // Ignore parse errors — treat as no consent
        }
        setHydrated(true)
    }, [])

    const save = useCallback((analytics: boolean) => {
        const state: ConsentState = {
            necessary: true,
            analytics,
            timestamp: new Date().toISOString(),
        }
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
        } catch {
            // Ignore storage errors (e.g. private browsing quota)
        }
        setConsent(state)
    }, [])

    const acceptAll       = useCallback(() => save(true), [save])
    const rejectAll       = useCallback(() => save(false), [save])
    const savePreferences = useCallback((analytics: boolean) => save(analytics), [save])

    const resetConsent = useCallback(() => {
        try {
            localStorage.removeItem(STORAGE_KEY)
        } catch { /* ignore */ }
        setConsent(null)
    }, [])

    // Don't render children until hydrated to avoid SSR/CSR mismatch
    if (!hydrated) return null

    return (
        <CookieConsentContext.Provider
            value={{ consent, acceptAll, rejectAll, savePreferences, resetConsent }}
        >
            {children}
        </CookieConsentContext.Provider>
    )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useCookieConsent(): CookieConsentContextValue {
    const ctx = useContext(CookieConsentContext)
    if (!ctx) {
        throw new Error('useCookieConsent must be used within CookieConsentProvider')
    }
    return ctx
}

