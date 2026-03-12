'use client'

import { useState, useEffect, startTransition } from 'react'
import { useRouter }        from 'next/navigation'
import { GameBoard }        from '@/features/game/components/game-board'
import { Button, PageLoader } from '@/components/ui'
import { usePlayerStore }   from '@/features/player/stores/player-store'
import type { Lobby }       from '@/features/lobby/types'
import type { Round, ScoreEntry, ReelData } from '@/features/game/types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
    lobby:            Lobby
    initialRound:     Round | null
    initialScores:    ScoreEntry[]
    reelData:         ReelData | null
    initialVoteCount: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Thin client wrapper for the game page — brutalist redesign.
 *
 * Hydration fix: `playerId` is null on SSR + first client render,
 * populated via useEffect to avoid sessionStorage mismatch.
 */
export function GameClient({ lobby, initialRound, initialScores, reelData, initialVoteCount }: Props) {
    const getPlayerId = usePlayerStore((s) => s.getPlayerId)
    const [identity, setIdentity] = useState<'loading' | 'not-member' | string>('loading')
    const router = useRouter()

    useEffect(() => {
        const id = getPlayerId(lobby.id)
        startTransition(() => setIdentity(id ?? 'not-member'))
    }, [getPlayerId, lobby.id])

    // Loading — sessionStorage not yet read.
    if (identity === 'loading') {
        return <PageLoader emoji="🎬" label="Loading Game…" />
    }

    // Not in this game.
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
                            Not in this game
                        </p>

                        <p
                            className="font-sans leading-relaxed"
                            style={{
                                fontSize: 'var(--text-body-sm)',
                                color:    'var(--color-muted)',
                                maxWidth: '20rem',
                            }}
                        >
                            You need to join the lobby first before you can play.
                        </p>
                    </div>

                    {/* CTA — visually connected, no top border gap */}
                    <div
                        style={{
                            padding:     '1rem',
                            border:      '2px solid var(--color-border-subtle)',
                            borderTop:   'none',
                            boxShadow:   'var(--shadow-brutal)',
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

    // In game — identity is the UUID string.
    return (
        <GameBoard
            lobby={lobby}
            currentPlayerId={identity}
            initialRound={initialRound}
            initialScores={initialScores}
            reelData={reelData}
            initialVoteCount={initialVoteCount}
        />
    )
}