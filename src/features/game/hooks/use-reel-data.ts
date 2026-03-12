'use client'

import { useQuery } from '@tanstack/react-query'
import { gameKeys } from '@/lib/query-keys'
import type { ReelData } from '../types'

/**
 * Fetches and caches reel data for a given reel ID.
 *
 * ### Stale-reel fix
 * `initialData` is the server-provided reel for the round that was active
 * when the page was SSR'd. It must ONLY be used when `reelId` matches the
 * reel that was active at SSR time — passing it for a different `reelId`
 * would seed React Query with the wrong data and show the old reel.
 *
 * We solve this by accepting `initialReelId` alongside `initialData` and
 * only passing `initialData` to React Query when the IDs match. For any
 * subsequent round the query fires a fresh fetch.
 */
export function useReelData(
    reelId:        string | null,
    initialData?:  ReelData | null,
    initialReelId?: string | null,
) {
    // Only treat server-provided data as initial data when the reel IDs match.
    // If the active round changed since SSR (e.g. host started next round while
    // this client was loading), fall through to a fresh fetch.
    const isInitialMatch = !!initialData && !!initialReelId && initialReelId === reelId

    return useQuery<ReelData>({
        queryKey:            gameKeys.reel(reelId ?? ''),
        queryFn:             async () => {
            const res = await fetch(`/api/reel/${reelId}`)
            if (!res.ok) throw new Error('Failed to load reel')
            return res.json() as Promise<ReelData>
        },
        enabled:             !!reelId,
        initialData:         isInitialMatch ? initialData : undefined,
        staleTime:           isInitialMatch ? Infinity : 60 * 60 * 1000,
        gcTime:              30 * 60 * 1000,  // 30 min
        refetchOnWindowFocus: false,
    })
}