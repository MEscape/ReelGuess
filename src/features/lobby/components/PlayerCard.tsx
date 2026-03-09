'use client'

import { PlayerAvatar } from '@/features/player/components/PlayerAvatar'
import type { Player } from '@/features/player/types'

export function PlayerCard({ player, isHost }: { player: Player; isHost?: boolean }) {
  return (
    <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-3
      shadow-brutal-sm transition-all duration-200">
      <PlayerAvatar seed={player.avatarSeed} size={40} />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white truncate text-sm">{player.displayName}</p>
        {isHost && (
          <span className="text-xs font-black text-yellow-400 uppercase tracking-wider">👑 Host</span>
        )}
      </div>
      {isHost && (
        <span className="text-xl">👑</span>
      )}
    </div>
  )
}
