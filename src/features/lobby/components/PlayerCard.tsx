'use client'

import { PlayerAvatar } from '@/features/player/components/PlayerAvatar'
import type { Player }  from '@/features/player/types'

type PlayerCardProps = {
    player: Player
    isHost?: boolean
}

/**
 * A single row in the lobby player list.
 * Shows avatar, display name and a HOST badge when applicable.
 */
export function PlayerCard({ player, isHost }: PlayerCardProps) {
    return (
        <div className="flex items-center gap-3 card p-3 shadow-brutal-sm transition-all duration-[var(--duration-base)]">
            <PlayerAvatar seed={player.avatarSeed} size={40} />
            <div className="flex-1 min-w-0">
                <p className="font-bold text-[var(--color-foreground)] truncate text-sm">{player.displayName}</p>
            </div>
            {isHost && (
                <span className="badge-accent badge text-xs">👑 Host</span>
            )}
        </div>
    )
}
