'use client'

import { useState, useEffect } from 'react'
import { GameBoard } from '@/features/game/components/GameBoard'
import type { Lobby } from '@/features/lobby/types'
import type { Round, ScoreEntry } from '@/features/game/types'
import { useRouter } from 'next/navigation'

type GamePageClientProps = {
  lobby: Lobby
  initialRound: Round | null
  initialScores: ScoreEntry[]
  reelData: { embedHtml: string | null; instagramUrl: string } | null
}

export function GamePageClient({
  lobby,
  initialRound,
  initialScores,
  reelData,
}: GamePageClientProps) {
  const [playerId, setPlayerId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const storedPlayerId = sessionStorage.getItem(`player_${lobby.id}`)
    if (storedPlayerId) {
      setPlayerId(storedPlayerId)
    }
  }, [lobby.id])

  if (!playerId) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-black text-yellow-400 uppercase mb-2">
            Not in this game
          </h2>
          <p className="text-zinc-400 mb-4">You need to join the lobby first!</p>
          <button
            onClick={() => router.push('/')}
            className="bg-yellow-400 text-black font-black uppercase text-sm py-2 px-6
              border-2 border-black rounded-lg
              shadow-[3px_3px_0px_0px_#000]
              hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000]
              transition-all"
          >
            ← GO HOME
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh py-4">
      <GameBoard
        lobby={lobby}
        currentPlayerId={playerId}
        initialRound={initialRound}
        initialScores={initialScores}
        reelData={reelData}
      />
    </div>
  )
}

