import { create } from 'zustand'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type PlayerState = {
    /**
     * Returns the stored player UUID for a given lobby, or `null` if not found.
     * Reading sessionStorage on every call is intentional — it avoids stale
     * in-memory copies after SSR hydration.
     */
    getPlayerId:   (lobbyId: string) => string | null
    /**
     * Persists the player UUID for a lobby in sessionStorage.
     * Called immediately after a successful create or join.
     */
    setPlayerId:   (lobbyId: string, playerId: string) => void
    /** Removes the stored player UUID for a lobby (e.g. on leave). */
    clearPlayerId: (lobbyId: string) => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

const KEY = (lobbyId: string) => `player_${lobbyId}`

/**
 * Lightweight player-identity store.
 *
 * Uses sessionStorage so the identity survives page refreshes within the same
 * tab but is automatically cleared when the tab closes.
 *
 * > **Security note**: sessionStorage is readable by any JS running on the
 * > page. For production, migrate to `httpOnly` cookies set server-side so
 * > the value is inaccessible to potential XSS scripts.
 */
export const usePlayerStore = create<PlayerState>()(() => ({
    getPlayerId: (lobbyId) => {
        if (typeof window === 'undefined') return null
        return sessionStorage.getItem(KEY(lobbyId))
    },
    setPlayerId: (lobbyId, playerId) => {
        if (typeof window === 'undefined') return
        sessionStorage.setItem(KEY(lobbyId), playerId)
    },
    clearPlayerId: (lobbyId) => {
        if (typeof window === 'undefined') return
        sessionStorage.removeItem(KEY(lobbyId))
    },
}))
