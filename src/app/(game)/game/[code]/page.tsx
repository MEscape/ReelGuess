import { getLobbyByCode } from '@/features/lobby/queries'
import { getCurrentRound, getScores } from '@/features/game/queries'
import { notFound } from 'next/navigation'
import { GamePageClient } from './GamePageClient'

type GamePageProps = {
  params: Promise<{ code: string }>
}

export default async function GamePage({ params }: GamePageProps) {
  const { code } = await params

  const lobbyResult = await getLobbyByCode(code.toUpperCase())
  if (lobbyResult.isErr()) {
    notFound()
  }

  const lobby = lobbyResult.value

  if (lobby.status === 'waiting') {
    notFound()
  }

  const roundResult = await getCurrentRound(code.toUpperCase())
  const currentRound = roundResult.isOk() ? roundResult.value : null

  const scoresResult = await getScores(code.toUpperCase())
  const scores = scoresResult.isOk() ? scoresResult.value : []

  let reelData: { embedHtml: string | null; instagramUrl: string } | null = null
  if (currentRound) {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: reel } = await supabase
      .from('reels')
      .select('id, embed_html, instagram_url')
      .eq('id', currentRound.reelId)
      .single()

    if (reel) {
      reelData = {
        embedHtml: (reel.embed_html as string | null) ?? null,
        instagramUrl: reel.instagram_url as string,
      }
    }
  }

  return (
    <GamePageClient
      lobby={lobby}
      initialRound={currentRound}
      initialScores={scores}
      reelData={reelData}
    />
  )
}
