'use client'

import { useQuery } from '@tanstack/react-query'
import { gameKeys } from '@/lib/query-keys'
import type { ReelData } from '../types'

/**
 * Fetches and caches reel data for a given reel ID.
 *
 * Cached for 1 hour — reel URLs never change once imported.
 *
 * Design decisions:
 * - `queryKey` includes the reelId, so React Query automatically fires a
 *   new request when the round changes (different reelId = different key).
 * - `initialData` is only used for the very first render (server-provided).
 *   For subsequent rounds it will always be undefined → triggers a fresh fetch.
 */
export function useReelData(
    reelId: string | null,
    initialData?: ReelData | null,
) {
    return useQuery<ReelData>({
        queryKey:            gameKeys.reel(reelId ?? ''),
        queryFn:             async () => {
            const res = await fetch(`/api/reel/${reelId}`)
            if (!res.ok) throw new Error('Failed to load reel')
            return res.json() as Promise<ReelData>
        },
        enabled:             !!reelId,
        initialData:         initialData ?? undefined,
        // Server-provided initial data is treated as perpetually fresh (no refetch on mount).
        // For new rounds (no initialData), data from cache stays fresh for 1 h.
        staleTime:           initialData ? Infinity : 60 * 60 * 1000,
        gcTime:              30 * 60 * 1000,  // 30 min
        refetchOnWindowFocus: false,
    })
}