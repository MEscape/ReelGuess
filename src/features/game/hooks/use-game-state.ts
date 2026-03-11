'use client'

import { useCallback }           from 'react'
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
 * On success the React Query scores cache is invalidated so the scoreboard
 * refreshes without a page reload.
 *
 * @param lobbyId      - Current lobby.
 * @param hostPlayerId - Must be the lobby host's UUID.
 * @param onSuccess    - Called with the new round's Instagram URL so the host
 *                       can display the reel immediately before Realtime fires.
 */
export function useGameState(
    lobbyId: string,
    hostPlayerId: string,
    onSuccess?: (instagramUrl: string) => void,
) {
    const queryClient = useQueryClient()

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
            onSuccess?.(data.instagramUrl)
        },
    })

    const startNextRound = useCallback(() => {
        mutation.mutate()
    }, [mutation])

    return {
        startNextRound,
        isPending: mutation.isPending,
        error: mutation.isError ? mutation.error : null,
        reset: mutation.reset,
    }
}