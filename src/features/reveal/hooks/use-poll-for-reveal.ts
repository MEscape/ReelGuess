'use client'

import React, { useCallback, useEffect, useRef } from 'react'
import { getCurrentRoundAction }          from '@/features/round'
import type { GamePhase }                 from '@/features/game'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type UsePollForRevealOptions = {
    lobbyId:          string
    /**
     * Mutable ref to the current game phase — read without a stale closure.
     * The poll fires only when phase is still `voting` after the delay;
     * using a ref avoids adding phase to the `useCallback` dep array, which
     * would create a new `poll` reference on every phase change and force
     * `useVote` to re-subscribe.
     */
    phaseRef:         React.MutableRefObject<GamePhase>
    /**
     * Called when the poll detects the round has transitioned to `reveal`.
     * Stored in a ref internally so `poll` never needs it as a dep.
     */
    onRevealDetected: () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Polling fallback for reveal detection after the last vote lands.
 *
 * ### Why this exists
 * When the final vote is cast, `submitVote` auto-reveals server-side and
 * Supabase Realtime normally delivers the `rounds.status → reveal` event
 * within ~500ms. Occasionally WebSocket delivery is slow. This hook polls
 * once at 1.5s so the UI never gets stuck on the voting screen waiting for
 * a Realtime event that was dropped.
 *
 * ### Extraction rationale
 * Previously `pollForReveal` was a plain `async function` defined inside
 * `use-game-orchestration`, recreated on every render with no `useCallback`
 * wrapper. Extracting it here:
 * 1. Gives it a stable `poll` reference via `useCallback`.
 * 2. Keeps the orchestration hook as a pure coordinator.
 * 3. Makes the polling concern independently testable.
 *
 * ### `onRevealDetected` ref pattern
 * `poll` must be stable (it is passed as `onVoteSettled` to `useVote`, which
 * stores it in a dep array). If `onRevealDetected` were in `poll`'s dep array,
 * any callback identity change would produce a new `poll`, forcing `useVote`
 * to re-subscribe. The ref breaks this cycle.
 */
export function usePollForReveal({
                                     lobbyId,
                                     phaseRef,
                                     onRevealDetected,
                                 }: UsePollForRevealOptions) {
    const onRevealDetectedRef = useRef(onRevealDetected)
    useEffect(() => { onRevealDetectedRef.current = onRevealDetected }, [onRevealDetected])

    /**
     * Waits 1.5s then checks the server for a round status change to `reveal`.
     * No-ops if the phase is no longer `voting` when the delay resolves
     * (Realtime already delivered — avoid duplicate transition).
     *
     * Stable reference: deps are `lobbyId` and refs only.
     */
    const poll = useCallback(async (): Promise<void> => {
        await new Promise<void>((resolve) => setTimeout(resolve, 1_500))
        if (phaseRef.current !== 'voting') return
        const result = await getCurrentRoundAction(lobbyId)
        if (result.ok && result.value?.status === 'reveal') {
            onRevealDetectedRef.current()
        }
    }, [lobbyId, phaseRef])

    return { poll }
}