'use client'

import { useState, useEffect, startTransition } from 'react'
import { GameBoard }        from '@/features/game'
import { PageLoader }       from '@/components/ui'
import { NotMemberScreen }  from '@/features/home'
import { usePlayerStore }   from '@/features/player'
import type { Lobby }       from '@/features/lobby'
import type { Round }       from '@/features/round'
import type { ScoreEntry }  from '@/features/scoring'
import type { ReelData }    from '@/features/reel-player'

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
            <NotMemberScreen
                title="Not in this game"
                description="You need to join the lobby first before you can play."
            />
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