import { getLobbyByCode }         from '@/features/lobby/queries'
import { getCurrentRound, getScores, getReelForRound } from '@/features/game/queries'
import type { ReelData }          from '@/features/game/types'
import { notFound }               from 'next/navigation'
import { GamePageClient }         from './GamePageClient'

type Props = { params: Promise<{ code: string }> }

export default async function GamePage({ params }: Props) {
    const { code } = await params
    const upperCode = code.toUpperCase()

    const lobbyResult = await getLobbyByCode(upperCode)
    if (lobbyResult.isErr() || lobbyResult.value.status === 'waiting') notFound()

    const lobby = lobbyResult.value

    const [roundResult, scoresResult] = await Promise.all([
        getCurrentRound(upperCode),
        getScores(upperCode),
    ])

    const currentRound = roundResult.isOk() ? roundResult.value : null
    const scores       = scoresResult.isOk() ? scoresResult.value : []

    let reelData: ReelData | null = null
    if (currentRound) {
        const reelResult = await getReelForRound(currentRound.reelId)
        if (reelResult.isOk()) reelData = reelResult.value
    }

    return (
        <div className="min-h-dvh py-4">
            <GamePageClient
                lobby={lobby}
                initialRound={currentRound}
                initialScores={scores}
                reelData={reelData}
            />
        </div>
    )
}