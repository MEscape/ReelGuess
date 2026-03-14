'use client'

import { useCallback }         from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { startNextRoundAction }        from '../actions'
import { gameKeys }                    from '@/lib/query-keys'
import type { StartRoundActionResult } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type UseStartRoundOptions = {
    /**
     * Called on successful round start with the full result (includes reelId
     * and instagramUrl so the host can pre-populate the reel cache before
     * Realtime fires).
     */
    onSuccess?:      (data: StartRoundActionResult) => void
    /**
     * Called when the server returns `GAME_ALREADY_FINISHED`.
     * Allows the caller to transition to the game-over screen as a fallback
     * when the Realtime lobby-status event is delayed.
     */
    onGameFinished?: () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mutation hook for starting the next round. Host-only.
 *
 * On success: invalidates the scores query so the scoreboard refreshes.
 * A submit-lock ref prevents double-click race conditions where the host
 * clicks "Next Round" twice before the first mutation settles.
 *
 * @param lobbyId      - Current lobby.
 * @param hostPlayerId - Must be the lobby host's UUID.
 * @param options      - Success and game-finished callbacks.
 */
export function useStartRound(
    lobbyId:      string,
    hostPlayerId: string,
    options:      UseStartRoundOptions = {},
) {
    const queryClient     = useQueryClient()

    const mutation = useMutation<StartRoundActionResult, Error>({
        mutationFn: async () => {
            const result = await startNextRoundAction(lobbyId, hostPlayerId)
            if (!result.ok) {
                switch (result.error.type) {
                    case 'NO_REELS_AVAILABLE':
                        options.onGameFinished?.()
                        throw new Error('No more reels available')
                    case 'GAME_ALREADY_FINISHED':
                        options.onGameFinished?.()
                        throw new Error('Game is already finished')
                    case 'GAME_NOT_HOST':         throw new Error('Only the host can start rounds')
                    default:                      throw new Error('Failed to start round')
                }
            }
            return result.value
        },
        onSuccess: (data) => {
            void queryClient.invalidateQueries({ queryKey: gameKeys.scores(lobbyId) })
            options.onSuccess?.(data)
        },
    })


    /**
     * Starts the next round. No-ops if a submission is already in flight.
     *
     * Gated on `mutation.isPending` — the authoritative React Query in-flight
     * flag. No manual ref guard needed.
     */
    const startNextRound = useCallback(() => {
        if (mutation.isPending) return
        mutation.mutate()
    }, [mutation])

    return {
        startNextRound,
        isPending: mutation.isPending,
        error:     mutation.isError ? mutation.error.message : null,
        reset:     mutation.reset,
    }
}