'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback }               from 'react'
import { getScoresAction }           from '../actions'
import { gameKeys }                  from '@/lib/query-keys'
import type { ScoreEntry }           from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the current scores for a lobby with React Query caching.
 *
 * - `initialData` seeds the cache from SSR so there's no loading flash.
 *   Because `initialData` is provided, React Query guarantees `scores` is
 *   never `undefined` — no fallback is needed at the call site.
 * - `staleTime: Infinity` — scores are only updated via `invalidateScores()`,
 *   which is called after each reveal. No polling; Realtime handles freshness.
 * - `invalidateScores()` is safe to call from Realtime handlers.
 *
 * @param lobbyId       - Target lobby.
 * @param initialScores - Server-rendered initial scores (from `page.tsx`).
 */
export function useScores(lobbyId: string, initialScores: ScoreEntry[]) {
    const queryClient = useQueryClient()

    const { data: scores } = useQuery({
        queryKey:             gameKeys.scores(lobbyId),
        queryFn:              async () => {
            const result = await getScoresAction(lobbyId)
            if (!result.ok) throw new Error('Failed to fetch scores')
            return result.value
        },
        initialData:          initialScores,
        staleTime:            Infinity,
        refetchOnWindowFocus: false,
    })

    /** Triggers a background re-fetch of scores from the server. */
    const invalidateScores = useCallback(() => {
        void queryClient.invalidateQueries({ queryKey: gameKeys.scores(lobbyId) })
    }, [queryClient, lobbyId])

    // `scores` is guaranteed non-undefined by React Query when `initialData`
    // is provided. No fallback needed.
    return { scores, invalidateScores }
}