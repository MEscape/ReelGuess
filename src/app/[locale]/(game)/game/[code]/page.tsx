/**
 * Game page under [locale] routing.
 */
import { getLobbyByCode }                                            from '@/features/lobby/queries'
import { getCurrentRound, getVoteCountForRound, getReelForRound }  from '@/features/round'
import { getScoresForLobby }                                        from '@/features/scoring'
import type { ReelData }                                            from '@/features/reel-player/types'
import { notFound }                                                 from 'next/navigation'
import { GameClient }                                               from '@/app/[locale]/(game)/game/[code]/game-client'
import type { Metadata }                                            from 'next'
import { getTranslations }                                          from 'next-intl/server'

// ─────────────────────────────────────────────────────────────────────────────
// Metadata — noindex (active game sessions)
// ─────────────────────────────────────────────────────────────────────────────

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string; code: string }>
}): Promise<Metadata> {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: 'seo.game' })
    return {
        title:  t('title'),
        robots: { index: false, follow: false },
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ locale: string; code: string }> }

export default async function GamePage({ params }: Props) {
    const { code }  = await params
    const upperCode = code.toUpperCase()

    const lobbyResult = await getLobbyByCode(upperCode)
    if (lobbyResult.isErr()) notFound()

    const lobby = lobbyResult.value

    const [roundResult, scoresResult] = await Promise.all([
        getCurrentRound(upperCode),
        getScoresForLobby(upperCode),
    ])

    const currentRound = roundResult.isOk() ? roundResult.value : null
    const scores       = scoresResult.isOk() ? scoresResult.value : []

    let reelData: ReelData | null = null
    let initialVoteCount          = 0

    if (currentRound) {
        const reelResult = await getReelForRound(currentRound.reelId)
        if (reelResult.isOk()) reelData = reelResult.value

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

