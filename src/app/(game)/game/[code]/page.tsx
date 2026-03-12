import { getLobbyByCode }         from '@/features/lobby/queries'
import { getCurrentRound, getScores, getReelForRound, getVoteCountForRound } from '@/features/game/queries'
import type { ReelData }          from '@/features/game/types'
import { notFound }               from 'next/navigation'
import { GameClient }             from './game-client'

// ─────────────────────────────────────────────────────────────────────────────
// GamePage — server component
// ─────────────────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ code: string }> }

export default async function GamePage({ params }: Props) {
    const { code }  = await params
    const upperCode = code.toUpperCase()

    const lobbyResult = await getLobbyByCode(upperCode)
    if (lobbyResult.isErr()) notFound()

    const lobby = lobbyResult.value

    const [roundResult, scoresResult] = await Promise.all([
        getCurrentRound(upperCode),
        getScores(upperCode),
    ])

    const currentRound = roundResult.isOk() ? roundResult.value : null
    const scores       = scoresResult.isOk() ? scoresResult.value : []

    let reelData: ReelData | null = null
    let initialVoteCount          = 0

    if (currentRound) {
        const reelResult = await getReelForRound(currentRound.reelId)
        if (reelResult.isOk()) reelData = reelResult.value

        // Seed vote count for page-refresh recovery (only needed during active voting)
        if (currentRound.status === 'voting') {
            const voteCountResult = await getVoteCountForRound(currentRound.id)
            if (voteCountResult.isOk()) initialVoteCount = voteCountResult.value
        }
    }

    return (
        <main className="min-h-dvh py-4 pb-safe">
            <GameClient
                lobby={lobby}
                initialRound={currentRound}
                initialScores={scores}
                reelData={reelData}
                initialVoteCount={initialVoteCount}
            />
        </main>
    )
}
