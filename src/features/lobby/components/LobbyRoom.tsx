'use client'

import { usePlayers } from '../hooks/use-players'
import { PlayerCard } from './PlayerCard'
import { ShareCode } from './ShareCode'
import type { Lobby } from '../types'

type LobbyRoomProps = {
  lobby: Lobby
  currentPlayerId: string
  onImport?: () => void
}

export function LobbyRoom({ lobby, currentPlayerId, onImport }: LobbyRoomProps) {
  const players = usePlayers(lobby.id, lobby.players)
  const isHost = lobby.hostId === currentPlayerId

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto px-4 pb-safe">
      {/* Header */}
      <div className="text-center pt-2">
        <h1 className="text-5xl font-black uppercase tracking-tight text-yellow-400">
          🎮 WAITING ROOM
        </h1>
        <p className="text-zinc-400 mt-1 text-sm">Share the code — friends join instantly</p>
      </div>

      {/* Lobby Code */}
      <ShareCode code={lobby.id} />

      {/* Players */}
      <div className="w-full">
        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-2 px-1">
          👥 Players ({players.length})
        </h2>
        <div className="flex flex-col gap-2">
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              isHost={player.id === lobby.hostId}
            />
          ))}
        </div>
        {players.length < 2 && (
          <p className="text-zinc-600 text-sm text-center mt-3 italic">
            Waiting for more players to join...
          </p>
        )}
      </div>

      {/* Import Reels */}
      <div className="w-full card-brutal p-4 text-center">
        <p className="text-base font-black text-white uppercase mb-0.5">📱 Import Your Reels</p>
        <p className="text-xs text-zinc-400 mb-3">
          Upload your Instagram likes export — the game uses your Reels
        </p>
        <button
          onClick={() => onImport?.()}
          className="w-full min-h-[48px] bg-pink-500 text-white font-black uppercase text-sm px-4
            border-2 border-black rounded-xl shadow-brutal
            hover:translate-y-[2px] hover:shadow-brutal-sm
            active:translate-y-[4px] active:shadow-none
            transition-all duration-200"
        >
          📋 IMPORT REELS
        </button>
      </div>

      {/* Host-only info */}
      {isHost && (
        <p className="text-zinc-500 text-xs text-center">
          You are the host — start the game when everyone is ready
        </p>
      )}
    </div>
  )
}
