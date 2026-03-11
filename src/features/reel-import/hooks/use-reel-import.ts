'use client'

import { useState }        from 'react'
import { useMutation }     from '@tanstack/react-query'
import { importReelsAction } from '../actions'
import { MIN_REELS }       from '../validations'
import type { Reel }       from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Manages the reel import submission flow using React Query `useMutation`.
 *
 * - Validates the minimum reel count client-side before sending to the server.
 * - `importedCount` signals a successful import so the parent can transition.
 * - `REELS_ALREADY_IMPORTED` is treated as a non-fatal success (already done).
 *
 * @param lobbyId  - Target lobby.
 * @param playerId - Current player's UUID.
 */
export function useReelImport(lobbyId: string, playerId: string) {
    const [reelUrls, setReelUrls] = useState<string[]>([])

    const mutation = useMutation<Reel[], string, string[]>({
        mutationFn: async (urls: string[]) => {
            const fd = new FormData()
            fd.set('lobbyId',  lobbyId)
            fd.set('playerId', playerId)
            fd.set('reelUrls', JSON.stringify(urls))

            const result = await importReelsAction(fd)

            // Already imported — treat as success so UI shows the done state
            if (!result.ok && result.error.type === 'REELS_ALREADY_IMPORTED') {
                return []
            }
            if (!result.ok) {
                throw 'INVALID_PAYLOAD' in result.error
                    ? (result.error as { message: string }).message
                    : 'Failed to import reels. Please try again.'
            }
            return result.value
        },
    })

    function submitReels() {
        if (reelUrls.length < MIN_REELS) {
            // Trigger mutation with an empty array to surface the validation error
            // via the mutation's error state rather than separate state
            mutation.mutate(reelUrls)
            return
        }
        mutation.mutate(reelUrls)
    }

    const importedCount = mutation.isSuccess ? (mutation.data?.length ?? 0) : 0

    return {
        submitReels,
        isPending:    mutation.isPending,
        /** String error message — null when no error. */
        error:        mutation.isError
            ? (mutation.error)
            : reelUrls.length > 0 && reelUrls.length < MIN_REELS
                ? `You need at least ${MIN_REELS} reels!`
                : null,
        importedCount,
        reelUrls,
        setReelUrls,
        reset:        mutation.reset,
    }
}