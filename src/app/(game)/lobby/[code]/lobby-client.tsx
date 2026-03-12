'use client'

import { useEffect, useRef, useState, startTransition } from 'react'
import { useRouter }        from 'next/navigation'
import { LobbyRoom }        from '@/features/lobby/components/lobby-room'
import { Button, PageLoader } from '@/components/ui'
import { createClient }     from '@/lib/supabase/client'
import { usePlayerStore }   from '@/features/player/stores/player-store'
import type { Lobby }       from '@/features/lobby/types'

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
            <main className="min-h-dvh flex items-center justify-center px-4 pb-safe">
                <div className="w-full max-w-sm flex flex-col gap-0">

                    {/* Card */}
                    <div
                        className="flex flex-col items-center gap-3 py-10 px-6 text-center"
                        style={{
                            background:  'var(--color-surface)',
                            border:      '2px solid var(--color-border-subtle)',
                            borderTop:   '4px solid var(--color-danger)',
                            boxShadow:   'var(--shadow-brutal)',
                        }}
                    >
                        <span
                            style={{ fontSize: '3.5rem', lineHeight: 1 }}
                            aria-hidden
                        >
                            🔒
                        </span>

                        <p
                            className="font-display uppercase"
                            style={{
                                fontSize:      'var(--text-title)',
                                letterSpacing: 'var(--tracking-display)',
                                color:         'var(--color-accent)',
                                lineHeight:    1,
                            }}
                        >
                            Not in this lobby
                        </p>

                        <p
                            className="font-sans leading-relaxed"
                            style={{
                                fontSize: 'var(--text-body-sm)',
                                color:    'var(--color-muted)',
                                maxWidth: '20rem',
                            }}
                        >
                            You haven&apos;t joined this lobby yet.
                            Go to the homepage and enter the code there.
                        </p>
                    </div>

                    {/* CTA — visually connected below card, no gap */}
                    <div
                        style={{
                            padding:   '1rem',
                            border:    '2px solid var(--color-border-subtle)',
                            borderTop: 'none',
                            boxShadow: 'var(--shadow-brutal)',
                        }}
                    >
                        <Button size="lg" fullWidth onClick={() => router.push('/')}>
                            ← GO HOME
                        </Button>
                    </div>
                </div>
            </main>
        )
    }

    // In lobby — identity is the UUID string.
    return (
        <main className="min-h-dvh py-8 pb-safe">
            <LobbyRoom lobby={lobby} currentPlayerId={identity} />
        </main>
    )
}
