'use client'

import { useEffect, useRef, useState, startTransition } from 'react'
import { useRouter }        from 'next/navigation'
import { LobbyRoom }        from '@/features/lobby'
import { PageLoader }       from '@/components/ui'
import { NotMemberScreen }  from '@/features/home'
import { createClient }     from '@/lib/supabase/client'
import { usePlayerStore }   from '@/features/player'
import type { Lobby }       from '@/features/lobby'

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
    const router        = useRouter()
    const didRedirect   = useRef(false)

    // Populate identity after mount (sessionStorage is only available client-side).
    useEffect(() => {
        const id = getPlayerId(lobby.id)
        startTransition(() => setIdentity(id ?? 'not-member'))
    }, [getPlayerId, lobby.id])

    // Subscribe to game-start Realtime event — redirect all players when host starts.
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
                    const status = (payload.new as { status: string }).status
                    if (status === 'playing' && !didRedirect.current) {
                        didRedirect.current = true
                        router.push(`/game/${lobby.id}`)
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
            <LobbyRoom lobby={lobby} currentPlayerId={identity} />
        </main>
    )
}
