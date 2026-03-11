'use client'

import { useState }            from 'react'
import { useRouter }           from 'next/navigation'
import { GameBoard }           from '@/features/game/components/GameBoard'
import { Button }              from '@/components/ui'
import { usePlayerStore }      from '@/features/player/stores/player-store'
import type { Lobby }          from '@/features/lobby/types'
import type { Round, ScoreEntry } from '@/features/game/types'
import type { ReelData }       from '@/features/game/types'

type Props = {
    lobby:         Lobby
    initialRound:  Round | null
    initialScores: ScoreEntry[]
    reelData:      ReelData | null
}

/**
 * Thin client wrapper for the game page.
 *
 * Reads `playerId` from the Zustand store (backed by sessionStorage) and
 * renders a friendly "not in game" fallback if not found.
 */
export function GamePageClient({ lobby, initialRound, initialScores, reelData }: Props) {
    const getPlayerId = usePlayerStore((s) => s.getPlayerId)
    // Initialise once on mount — avoids flash from store subscription re-renders
    const [playerId] = useState<string | null>(() => getPlayerId(lobby.id))
    const router     = useRouter()

    if (!playerId) {
        return (
            <div className="min-h-dvh flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="text-6xl mb-4">🔒</div>
                    <h2 className="text-2xl font-black text-[var(--color-accent)] uppercase mb-2">Not in this game</h2>
                    <p className="text-[var(--color-muted)] mb-4">You need to join the lobby first!</p>
                    <Button size="sm" onClick={() => router.push('/')}>← GO HOME</Button>
                </div>
            </div>
        )
    }

    return (
        <GameBoard
            lobby={lobby}
            currentPlayerId={playerId}
            initialRound={initialRound}
            initialScores={initialScores}
            reelData={reelData}
        />
    )
}
