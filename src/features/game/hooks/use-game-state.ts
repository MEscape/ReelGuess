'use client'

import { useCallback, useRef }   from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { startNextRoundAction }  from '../actions'
import { gameKeys }              from '@/lib/query-keys'
import type { StartRoundActionResult } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Manages the "start next round" action for the host using React Query `useMutation`.
 *
 * On success:
 * - Invalidates the scores cache so the scoreboard refreshes.
 * - Calls `onSuccess` with the full StartRoundActionResult so the host can
 *   pre-populate the reel cache and see the reel immediately before Realtime fires.
 *
 * A submit-lock ref prevents double-click race conditions where the host
 * rapidly clicks "Next Round" twice before the first mutation settles.
 *
 * @param lobbyId      - Current lobby.
 * @param hostPlayerId - Must be the lobby host's UUID.
 * @param onSuccess    - Called with the new round's full result (includes reelId + instagramUrl).
 */
export function useGameState(
    lobbyId: string,
    hostPlayerId: string,
    onSuccess?: (data: StartRoundActionResult) => void,
) {
    const queryClient     = useQueryClient()
    /** Prevents concurrent startNextRound submissions (double-click guard). */
    const isSubmittingRef = useRef(false)

    const mutation = useMutation<StartRoundActionResult, string>({
        mutationFn: async () => {
            const result = await startNextRoundAction(lobbyId, hostPlayerId)
            if (!result.ok) {
                switch (result.error.type) {
                    case 'NO_REELS_AVAILABLE':    throw 'No more reels available!'
                    case 'GAME_ALREADY_FINISHED': throw 'Game is already finished!'
                    case 'GAME_NOT_HOST':         throw 'Only the host can start rounds'
                    default:                      throw 'Failed to start round'
                }
            }
            return result.value
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: gameKeys.scores(lobbyId) })
            onSuccess?.(data)
        },
        onSettled: () => { isSubmittingRef.current = false },
    })

    const startNextRound = useCallback(() => {
        if (isSubmittingRef.current) return
        isSubmittingRef.current = true
        mutation.mutate()
    }, [mutation])

    return {
        startNextRound,
        isPending: mutation.isPending,
        error: mutation.isError ? mutation.error : null,
        reset: mutation.reset,
    }
}