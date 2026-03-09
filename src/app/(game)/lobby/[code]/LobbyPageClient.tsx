'use client'

import { useState, useEffect, useRef } from 'react'
import { LobbyRoom } from '@/features/lobby/components/LobbyRoom'
import { ImportFlow } from '@/features/reel-import/components/ImportFlow'
import type { Lobby } from '@/features/lobby/types'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type LobbyPageClientProps = {
  lobby: Lobby
  showImport: boolean
}

export function LobbyPageClient({ lobby, showImport: initialShowImport }: LobbyPageClientProps) {
  const [showImport, setShowImport] = useState(initialShowImport)
  // Read playerId synchronously on first render to avoid flash of "Not in lobby"
  const [playerId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return sessionStorage.getItem(`player_${lobby.id}`)
  })
  const router = useRouter()
  const didRedirectRef = useRef(false)

  // Listen for lobby status → playing and redirect all clients to game
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`lobby-status:${lobby.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'lobbies', filter: `id=eq.${lobby.id}` },
        (payload) => {
          const newStatus = (payload.new as { status: string }).status
          if (newStatus === 'playing' && !didRedirectRef.current) {
            didRedirectRef.current = true
            router.push(`/game/${lobby.id}`)
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [lobby.id, router])

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
              border-2 border-black rounded-lg shadow-brutal
              hover:translate-y-[2px] hover:shadow-brutal-sm
              transition-all duration-200"
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
            // Refresh server data (reels count etc.) then go back to lobby
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
