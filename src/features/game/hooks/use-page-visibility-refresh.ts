'use client'

import { useEffect, useRef, useCallback } from 'react'
import { getCurrentRoundAction }          from '@/features/round'
import type { GamePhase }                 from '@/features/game'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type UsePageVisibilityRefreshOptions = {
    lobbyId:           string
    phaseRef:          React.RefObject<GamePhase>
    invalidateScores:  () => void
    onPhaseChange:     (phase: 'voting' | 'reveal' | 'complete') => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Listens for page visibility changes and triggers a data refresh when the
 * user returns to the tab after it was hidden.
 *
 * Without this, a user who leaves the tab mid-round and returns may see:
 * - Stale scores from a previous round
 * - The wrong reel (prior round's reel)
 * - A phase mismatch (e.g. still showing "voting" when the reveal has happened)
 *
 * On visibility restore the hook:
 * 1. Invalidates the score cache (forces a background re-fetch).
 * 2. Fetches the current round from the server to detect phase changes that
 *    occurred while the tab was hidden (Realtime events are not replayed).
 * 3. Calls `onPhaseChange` with the server round status if it differs from
 *    the client's current phase — e.g. snapping from `voting` to `reveal`.
 */
export function usePageVisibilityRefresh({
    lobbyId,
    phaseRef,
    invalidateScores,
    onPhaseChange,
}: UsePageVisibilityRefreshOptions) {
    const wasHiddenRef       = useRef(false)
    const invalidateScoresRef = useRef(invalidateScores)
    const onPhaseChangeRef    = useRef(onPhaseChange)

    // Keep refs current without re-registering the event listener.
    useEffect(() => { invalidateScoresRef.current = invalidateScores }, [invalidateScores])
    useEffect(() => { onPhaseChangeRef.current    = onPhaseChange    }, [onPhaseChange])

    const handleVisibilityChange = useCallback(async () => {
        if (document.hidden) {
            wasHiddenRef.current = true
            return
        }

        // Tab became visible — only refresh if it was previously hidden.
        if (!wasHiddenRef.current) return
        wasHiddenRef.current = false

        // 1. Invalidate scores so the correct totals are shown immediately.
        invalidateScoresRef.current()

        // 2. Fetch the current server round to detect missed phase transitions.
        const result = await getCurrentRoundAction(lobbyId)
        if (!result.ok || !result.value) return

        const serverStatus = result.value.status

        // Only snap the phase if the server says we're in a different state.
        // This avoids jumping backwards (e.g. server still on 'voting' after
        // Realtime already moved us to 'reveal').
        const currentPhase = phaseRef.current
        if (serverStatus === 'voting'   && currentPhase !== 'voting')   onPhaseChangeRef.current('voting')
        if (serverStatus === 'reveal'   && currentPhase !== 'reveal')   onPhaseChangeRef.current('reveal')
        if (serverStatus === 'complete' && currentPhase !== 'complete') onPhaseChangeRef.current('complete')
    }, [lobbyId, phaseRef])

    useEffect(() => {
        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [handleVisibilityChange])
}
