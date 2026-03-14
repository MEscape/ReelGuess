'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useRouter }        from 'next/navigation'
import { LobbyRoom }        from '@/features/lobby'
import { PageLoader }       from '@/components/ui'
import { NotMemberScreen }  from '@/features/home'
import { createClient }     from '@/lib/supabase/client'
import { usePlayerStore }   from '@/features/player'
import type { Lobby, GameSettings } from '@/features/lobby'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Props = { lobby: Lobby }

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hydration wrapper for the lobby page.
 *
 * Three explicit states for `identity`:
 *  - `'loading'`    — SSR / first render, sessionStorage not yet read.
 *  - `'not-member'` — sessionStorage was read, no entry for this lobby.
 *  - string (UUID)  — player is in this lobby.
 *
 * Previously `null` was used for both loading AND not-member, causing the
 * loading spinner to show forever when a user navigated to a lobby they
 * hadn't joined (sessionStorage had no entry → getPlayerId returns null →
 * never transitions out of the loading state).
 */
export function LobbyClient({ lobby }: Props) {
    const getPlayerId = usePlayerStore((s) => s.getPlayerId)
    const [identity, setIdentity] = useState<'loading' | 'not-member' | string>('loading')
    // Live settings state — updated by Realtime so all clients reflect host changes instantly.
    const [settings, setSettings] = useState<GameSettings>(lobby.settings)
    const settingsRef = useRef(lobby.settings)
    // Keep ref in sync with state so the Realtime closure always has the latest value.
    useLayoutEffect(() => { settingsRef.current = settings }, [settings])
    const router          = useRouter()
    const didRedirect     = useRef(false)
    // Guard: only read sessionStorage once on mount — server-action router refreshes
    // must NOT re-run this and momentarily set identity to 'not-member'.
    const identitySet     = useRef(false)

    // Populate identity after mount (sessionStorage is only available client-side).
    useEffect(() => {
        if (identitySet.current) return
        identitySet.current = true
        const id = getPlayerId(lobby.id)
        setIdentity(id ?? 'not-member')
    }, [getPlayerId, lobby.id])

    // Subscribe to lobby UPDATE events:
    //   - status 'playing' → redirect everyone to the game
    //   - settings change  → update local settings state for all clients
    useEffect(() => {
        const supabase = createClient()
        const channel  = supabase
            .channel(`lobby-status:${lobby.id}`)
            .on(
                'postgres_changes',
                {
                    event:  'UPDATE',
                    schema: 'public',
                    table:  'lobbies',
                    filter: `id=eq.${lobby.id}`,
                },
                (payload) => {
                    const row = payload.new as { status?: string; settings?: Record<string, unknown> }

                    // Redirect on game start
                    if (row.status === 'playing' && !didRedirect.current) {
                        didRedirect.current = true
                        router.push(`/game/${lobby.id}`)
                        return
                    }

                    // Live-update settings for all clients (host + guests)
                    if (row.settings) {
                        const s    = row.settings
                        const prev = settingsRef.current
                        setSettings({
                            roundsCount:  typeof s.rounds_count  === 'number' ? s.rounds_count  : prev.roundsCount,
                            timerSeconds: typeof s.timer_seconds === 'number' ? s.timer_seconds : prev.timerSeconds,
                            rematchId:    typeof s.rematch_id    === 'string' ? s.rematch_id    : prev.rematchId,
                        })
                    }
                },
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [lobby.id, router])

    // Loading — sessionStorage not yet read.
    if (identity === 'loading') {
        return <PageLoader emoji="🎮" label="Loading Lobby…" />
    }

    // Not a member of this lobby.
    if (identity === 'not-member') {
        return (
            <NotMemberScreen
                title="Not in this lobby"
                description="You haven't joined this lobby yet. Go to the homepage and enter the code there."
            />
        )
    }

    // In lobby — identity is the UUID string.
    return (
        <main className="min-h-dvh py-8 pb-safe">
            <LobbyRoom lobby={{ ...lobby, settings }} currentPlayerId={identity} />
        </main>
    )
}
