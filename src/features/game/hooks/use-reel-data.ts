'use client'

import { useQuery } from '@tanstack/react-query'
import { gameKeys } from '@/lib/query-keys'
import type { ReelData } from '../types'

/**
 * Fetches and caches reel data for a given reel ID.
 *
 * Cached for 1 hour — reels don't change and the same reel can be shown
 * across multiple reconnects / refreshes without a re-fetch.
 *
 * Cached for 1 hour — reel URLs never change once imported.
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
        staleTime:           60 * 60 * 1000,  // 1 hour
        gcTime:              30 * 60 * 1000,  // 30 min
        refetchOnWindowFocus: false,
    })
}