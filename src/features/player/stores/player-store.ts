import { create } from 'zustand'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type PlayerState = {
    /**
     * Returns the stored player UUID for a given lobby, or `null` if not found.
     * Reading sessionStorage on every call is intentional — it avoids stale
     * in-memory copies after SSR hydration.
     *
     * Returns `null` if storage is unavailable (e.g. Safari private browsing,
     * sandboxed iframes). The caller should treat this identically to "not found".
     */
    getPlayerId:   (lobbyId: string) => string | null
    /**
     * Persists the player UUID for a lobby in sessionStorage.
     * Called immediately after a successful create or join.
     *
     * Silently no-ops if storage is unavailable — the game continues but the
     * session will not survive a page refresh.
     */
    setPlayerId:   (lobbyId: string, playerId: string) => void
    /** Removes the stored player UUID for a lobby (e.g. on leave). */
    clearPlayerId: (lobbyId: string) => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

const storageKey = (lobbyId: string) => `player_${lobbyId}`

/**
 * Lightweight player-identity store.
 *
 * Uses sessionStorage so the identity survives page refreshes within the same
 * tab but is automatically cleared when the tab closes.
 *
 * ### Storage availability
 * All three methods wrap their sessionStorage calls in try/catch.
 * `sessionStorage` throws a `SecurityError` in:
 * - Safari private browsing mode
 * - Iframes without `allow-same-origin`
 * - Browsers with storage blocked by policy
 *
 * On failure, reads degrade to `null` (re-prompt) and writes are silently
 * dropped (session not persisted). The game remains functional.
 *
 * > **Security note**: sessionStorage is readable by any JS running on the
 * > page. For production, consider migrating to `httpOnly` cookies set
 * > server-side so the value is inaccessible to XSS scripts.
 * > Tracked in: [add issue link here]
 */
export const usePlayerStore = create<PlayerState>()(() => ({
    getPlayerId: (lobbyId) => {
        if (typeof window === 'undefined') return null
        try {
            return sessionStorage.getItem(storageKey(lobbyId))
        } catch {
            // SecurityError: storage blocked (Safari private browsing, sandboxed iframe).
            // Degrade gracefully — player will be prompted to re-enter their name.
            return null
        }
    },

    setPlayerId: (lobbyId, playerId) => {
        if (typeof window === 'undefined') return
        try {
            sessionStorage.setItem(storageKey(lobbyId), playerId)
        } catch {
            // SecurityError: storage blocked. Session will not survive refresh.
            // The game continues — no user-facing feedback needed for a write failure.
        }
    },

    clearPlayerId: (lobbyId) => {
        if (typeof window === 'undefined') return
        try {
            sessionStorage.removeItem(storageKey(lobbyId))
        } catch {
            // SecurityError: storage blocked. Nothing to clear — already unavailable.
        }
    },
}))