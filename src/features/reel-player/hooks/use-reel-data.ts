'use client'

import { useQuery }    from '@tanstack/react-query'
import { gameKeys }    from '@/lib/query-keys'
import type { ReelData } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches and caches reel data for a given reel ID.
 *
 * ### Stale-reel fix
 * `initialData` is the server-provided reel for the round active at SSR time.
 * It must ONLY be used when `reelId` matches the SSR reel — passing it for a
 * different `reelId` would seed React Query with stale data and show the wrong
 * reel.
 *
 * We solve this by accepting `initialReelId` alongside `initialData` and only
 * passing `initialData` to React Query when the IDs match. For any subsequent
 * round the query fires a fresh fetch.
 *
 * ### null guard
 * React Query's `initialData` does not accept `null` — passing it would lock
 * the cache in an empty state and suppress all refetches. We normalise `null`
 * to `undefined` so React Query treats the cache slot as empty and fetches.
 *
 * @param reelId        - Reel to fetch. Pass `null` to disable.
 * @param initialData   - Server-rendered reel (from `page.tsx`). May be null if
 *                        the server had no reel for this session.
 * @param initialReelId - The reel that was active at SSR time.
 */
export function useReelData(
    reelId:         string | null,
    initialData?:   ReelData | null,
    initialReelId?: string | null,
) {
    const isInitialMatch = !!initialData && !!initialReelId && initialReelId === reelId

    return useQuery<ReelData>({
        queryKey:             gameKeys.reel(reelId ?? ''),
        queryFn:              async () => {
            const res = await fetch(`/api/reel/${reelId}`)
            if (!res.ok) throw new Error('Failed to load reel')
            return res.json() as Promise<ReelData>
        },
        enabled:              !!reelId,
        // `initialData ?? undefined` ensures null is never passed to React Query.
        // Passing null would be treated as valid cached data, permanently
        // suppressing refetches for this query key.
        initialData:          isInitialMatch ? (initialData ?? undefined) : undefined,
        // If the initial data was SSR'd for this exact reel, it never goes stale
        // (reels are immutable). For fresh fetches, cache for 1 hour.
        staleTime:            isInitialMatch ? Infinity : 60 * 60 * 1_000,
        gcTime:               30 * 60 * 1_000,
        refetchOnWindowFocus: false,
    })
}