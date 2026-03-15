'use client'

import { useState, useEffect } from 'react'
import { useTranslations }  from 'next-intl'
import { GameBoard }        from '@/features/game'
import { PageLoader }       from '@/components/ui'
import { NotMemberScreen }  from '@/features/home'
import { usePlayerStore }   from '@/features/player'
import type { Lobby }       from '@/features/lobby'
import type { Round }       from '@/features/round'
import type { ScoreEntry }  from '@/features/scoring'
import type { ReelData }    from '@/features/reel-player'

type Props = {
    lobby:            Lobby
    initialRound:     Round | null
    initialScores:    ScoreEntry[]
    reelData:         ReelData | null
    initialVoteCount: number
}

export function GameClient({ lobby, initialRound, initialScores, reelData, initialVoteCount }: Props) {
    const getPlayerId = usePlayerStore((s) => s.getPlayerId)
    const t = useTranslations('game')
    const tLobby = useTranslations('lobby')

    // Synchronous identity resolution - survives Next.js App Router server-action refreshes
    const [identity, setIdentity] = useState<'loading' | 'not-member' | string>(() => {
        if (typeof window === 'undefined') return 'loading'
        const id = getPlayerId(lobby.id)
        return id ?? 'not-member'
    })

    // Async fallback for SSR initial render
    useEffect(() => {
        if (identity !== 'loading') return
        const id = getPlayerId(lobby.id)
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIdentity(id ?? 'not-member')
    }, [getPlayerId, lobby.id, identity])

    if (identity === 'loading') {
        return <PageLoader emoji="🎬" label={t('loading')} />
    }

    if (identity === 'not-member') {
        return (
            <NotMemberScreen
                title={tLobby('notMemberTitle')}
                description={tLobby('notMemberDescription')}
            />
        )
    }

    return (
        <main className="game-page-main">
            <GameBoard
                lobby={lobby}
                currentPlayerId={identity}
                initialRound={initialRound}
                initialScores={initialScores}
                reelData={reelData}
                initialVoteCount={initialVoteCount}
            />
        </main>
    )
}
