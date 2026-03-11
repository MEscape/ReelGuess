'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode }          from 'react'

/**
 * Wraps the app in a stable React Query client.
 *
 * Configuration rationale:
 * - `staleTime: 5min` — most game data is pushed via Realtime; polling is wasteful.
 * - `refetchOnWindowFocus: false` — Realtime handles freshness; re-fetching on tab switch causes flicker.
 * - `retry: 1` — one retry for transient network hiccups; not for 4xx.
 * - `gcTime: 10min` — keeps reel embed cache alive across round transitions.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime:           5 * 60 * 1000,
                        gcTime:              10 * 60 * 1000,
                        retry:               1,
                        refetchOnWindowFocus: false,
                    },
                    mutations: {
                        retry: 0, // Server Actions should not auto-retry (idempotency)
                    },
                },
            }),
    )

    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
