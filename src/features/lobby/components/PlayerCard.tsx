'use client'

import { PlayerAvatar } from '@/features/player/components/PlayerAvatar'
import type { Player } from '@/features/player/types'

type PlayerCardProps = {
  player: Player
  isHost?: boolean
}

export function PlayerCard({ player, isHost }: PlayerCardProps) {
  return (
    <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-lg p-3
      shadow-[2px_2px_0px_0px_rgba(250,204,21,0.3)]">
      <PlayerAvatar seed={player.avatarSeed} size={40} />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white truncate">
          {player.displayName}
        </p>
        {isHost && (
          <span className="text-xs font-bold text-yellow-400 uppercase">👑 Host</span>
        )}
      </div>
    </div>
  )
}

