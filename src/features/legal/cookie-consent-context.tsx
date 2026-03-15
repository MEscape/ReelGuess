'use client'

// ─────────────────────────────────────────────────────────────────────────────
// Cookie Consent — Context + Provider + Hook
//
// Stores user consent in localStorage under `rg_cookie_consent`.
// `consent` is `null` while the user hasn't decided yet (show banner),
// or a full ConsentState once they have.
//
// TTDSG §25 / DSGVO note:
//   "Reject all" still shows non-personalised (contextual) ads — no consent
//   needed for cookie-free contextual advertising under German law.
// ─────────────────────────────────────────────────────────────────────────────

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

export type AdvertisingConsent = 'personalized' | 'non-personalized'

export type ConsentState = {
    /** Always true — required for site operation. */
    necessary:   true
    /** Vercel Analytics and similar. Requires explicit opt-in. */
    analytics:   boolean
    /**
     * - 'personalized'     — cookies + tracking allowed
     * - 'non-personalized' — contextual only, no tracking cookies (TTDSG §25 II)
     */
    advertising: AdvertisingConsent
    /** ISO timestamp of when consent was recorded. */
    timestamp:   string
}

export type CookieConsentContextValue = {
    /** null = undecided (banner visible); ConsentState = user has chosen */
    consent:         ConsentState | null
    acceptAll:       () => void
    rejectAll:       () => void
    savePreferences: (analytics: boolean, advertising: AdvertisingConsent) => void
    resetConsent:    () => void
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'rg_cookie_consent'

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Parses a raw localStorage value into a ConsentState.
 * Returns null if the value is missing, malformed, or lacks `necessary: true`.
 * Unknown field values fall back to safe defaults rather than throwing.
 */
function parseStoredConsent(raw: string | null): ConsentState | null {
    if (!raw) return null
    try {
        const parsed = JSON.parse(raw)
        if (typeof parsed !== 'object' || parsed === null) return null
        if (parsed.necessary !== true) return null

        return {
            necessary:   true,
            analytics:   typeof parsed.analytics === 'boolean' ? parsed.analytics : false,
            advertising: parsed.advertising === 'personalized' ? 'personalized' : 'non-personalized',
            timestamp:   typeof parsed.timestamp === 'string'  ? parsed.timestamp : new Date().toISOString(),
        }
    } catch {
        return null
    }
}

// ── Context ───────────────────────────────────────────────────────────────────

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────

export function CookieConsentProvider({ children }: { children: ReactNode }) {
    // undefined  = not yet hydrated (avoids unmount/remount vs null sentinel)
    // null       = hydrated, user hasn't decided
    // ConsentState = hydrated, user has chosen
    const [consent, setConsent] = useState<ConsentState | null | undefined>(undefined)
    const initialised = useRef(false)

    useEffect(() => {
        // StrictMode fires effects twice in dev — guard against double-init
        if (initialised.current) return
        initialised.current = true

        const stored = parseStoredConsent(localStorage.getItem(STORAGE_KEY))
        setConsent(stored) // null if nothing stored → show banner
    }, [])

    const persist = useCallback((next: ConsentState) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        } catch {
            // Ignore — private browsing or storage quota exceeded
        }
        setConsent(next)
    }, [])

    const acceptAll = useCallback(() =>
            persist({
                necessary:   true,
                analytics:   true,
                advertising: 'personalized',
                timestamp:   new Date().toISOString(),
            }),
        [persist])

    const rejectAll = useCallback(() =>
            persist({
                necessary:   true,
                analytics:   false,
                advertising: 'non-personalized',
                timestamp:   new Date().toISOString(),
            }),
        [persist])

    const savePreferences = useCallback(
        (analytics: boolean, advertising: AdvertisingConsent) =>
            persist({
                necessary: true,
                analytics,
                advertising,
                timestamp: new Date().toISOString(),
            }),
        [persist],
    )

    const resetConsent = useCallback(() => {
        try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
        setConsent(null)
    }, [])

    // Render nothing until hydrated — avoids SSR/CSR flash without
    // unmounting the whole tree on every render (unlike returning null from
    // the provider itself when consent is undefined).
    if (consent === undefined) return null

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
    if (!ctx) throw new Error('useCookieConsent must be used within <CookieConsentProvider>')
    return ctx
}