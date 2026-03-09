'use client'

import { usePlayers } from '../hooks/use-players'
import { PlayerCard } from './PlayerCard'
import { ShareCode } from './ShareCode'
import type { Lobby } from '../types'
import { useRouter } from 'next/navigation'
import { startGameAction } from '../actions'
import { useState, useTransition, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type LobbyRoomProps = {
  lobby: Lobby
  currentPlayerId: string
  onImport?: () => void
}

export function LobbyRoom({ lobby, currentPlayerId, onImport }: LobbyRoomProps) {
  const players = usePlayers(lobby.id, lobby.players)
  const isHost = lobby.hostId === currentPlayerId
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Listen for lobby status changes (e.g., game started)
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`lobby-status:${lobby.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lobbies',
          filter: `id=eq.${lobby.id}`,
        },
        (payload) => {
          if (payload.new && (payload.new as { status: string }).status === 'playing') {
            router.push(`/game/${lobby.id}`)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [lobby.id, router])

  function handleStartGame() {
    setError(null)
    startTransition(async () => {
      const result = await startGameAction(lobby.id, currentPlayerId)
      if (!result.ok) {
        const msg = 'message' in result.error ? result.error.message : 'Failed to start game.'
        setError(msg)
      } else {
        router.push(`/game/${lobby.id}`)
      }
    })
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-md mx-auto p-4">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-black uppercase tracking-tight text-yellow-400">
          🎮 WAITING ROOM
        </h1>
        <p className="text-zinc-400 mt-1">Share the code with your friends!</p>
      </div>

      {/* Lobby Code */}
      <ShareCode code={lobby.id} />

      {/* Players */}
      <div className="w-full">
        <h2 className="text-lg font-black uppercase text-zinc-300 mb-3">
          👥 Players ({players.length}/8)
        </h2>
        <div className="grid gap-2">
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              isHost={player.id === lobby.hostId}
            />
          ))}
        </div>
        {players.length < 2 && (
          <p className="text-zinc-500 text-sm text-center mt-3">
            Waiting for more players...
          </p>
        )}
      </div>

      {/* Import Reels CTA */}
      <div className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
        <p className="text-lg font-bold text-white mb-1">📱 Import Your Reels</p>
        <p className="text-sm text-zinc-400 mb-3">
          Use the bookmarklet on Instagram, then paste here
        </p>
        <button
          onClick={() => onImport?.()}
          className="bg-pink-500 text-white font-bold uppercase text-sm py-2 px-4
            border-2 border-black rounded-lg
            shadow-[3px_3px_0px_0px_#000]
            hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000]
            transition-all"
        >
          📋 IMPORT REELS
        </button>
      </div>

      {/* Start Game Button (Host Only) */}
      {isHost && (
        <div className="w-full">
          <button
            onClick={handleStartGame}
            disabled={isPending || players.length < 2}
            className="w-full bg-green-400 text-black font-black uppercase text-xl py-4 px-6
              border-2 border-black rounded-xl
              shadow-[4px_4px_0px_0px_#000]
              hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000]
              active:translate-y-[4px] active:shadow-none
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all"
          >
            {isPending ? '⏳ STARTING...' : '🚀 START GAME'}
          </button>
          {error && (
            <p className="text-red-500 text-sm font-bold text-center mt-2">{error}</p>
          )}
        </div>
      )}
    </div>
  )
}

