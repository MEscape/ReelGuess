'use client'

import { useState, useEffect, startTransition } from 'react'
import { LobbyRoom } from '@/features/lobby/components/LobbyRoom'
import { ImportFlow } from '@/features/reel-import/components/ImportFlow'
import type { Lobby } from '@/features/lobby/types'
import { useRouter } from 'next/navigation'

type LobbyPageClientProps = {
  lobby: Lobby
  showImport: boolean
}

export function LobbyPageClient({ lobby, showImport: initialShowImport }: LobbyPageClientProps) {
  const [showImport, setShowImport] = useState(initialShowImport)
  const [playerId, setPlayerId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const storedPlayerId = sessionStorage.getItem(`player_${lobby.id}`)
    if (storedPlayerId) {
      startTransition(() => setPlayerId(storedPlayerId))
    }
  }, [lobby.id])

  if (!playerId) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-black text-yellow-400 uppercase mb-2">
            Not in this lobby
          </h2>
          <p className="text-zinc-400 mb-4">Join this lobby from the homepage first!</p>
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

  if (showImport) {
    return (
      <div className="min-h-dvh py-8">
        <ImportFlow
          lobbyId={lobby.id}
          playerId={playerId}
          onComplete={() => {
            router.refresh()
            setShowImport(false)
          }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-dvh py-8">
      <LobbyRoom lobby={lobby} currentPlayerId={playerId} onImport={() => setShowImport(true)} />
    </div>
  )
}

