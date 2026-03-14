'use client'

import { PlayerAvatar }  from '@/features/player'
import type { Player }   from '@/features/player'
import { cn }            from '@/lib/utils/cn'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type PlayerCardProps = {
    player:  Player
    isHost?: boolean
    isYou?:  boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Single player row in the lobby waiting room.
 *
 * Visual hierarchy (left → right):
 *   [accent stripe?] | Avatar | Name + YOU badge | HOST badge
 *
 * `name` is passed to `PlayerAvatar` so screen readers announce each player
 * by name rather than the generic "Player avatar" fallback. This is especially
 * important in the lobby list where multiple avatars are rendered side-by-side.
 */
export function PlayerCard({ player, isHost = false, isYou = false }: PlayerCardProps) {
    return (
        <div
            className={cn(
                'relative overflow-hidden',
                'flex items-center gap-3 px-4 py-3.5',
                isYou && 'bg-[var(--color-surface-raised)]',
            )}
        >
            {/* Accent left stripe — current player only */}
            {isYou && (
                <div
                    className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--color-accent)]"
                    aria-hidden
                />
            )}

            {/* Avatar — host gets accent border */}
            <div className={cn(
                'shrink-0 border-2',
                isHost
                    ? 'border-[var(--color-accent)]'
                    : 'border-[var(--color-border-subtle)]',
            )}>
                <PlayerAvatar
                    seed={player.avatarSeed}
                    name={player.displayName}
                    size={36}
                />
            </div>

            {/* Name + YOU badge */}
            <div className="flex-1 min-w-0 flex items-center gap-2">
                <p
                    className="font-sans font-semibold text-[var(--color-foreground)] truncate"
                    style={{ fontSize: 'var(--text-body)' }}
                >
                    {player.displayName}
                </p>
                {isYou && (
                    <span className="badge badge-accent badge-sm shrink-0">
                        You
                    </span>
                )}
            </div>

            {/* Host badge */}
            {isHost && (
                <span className="badge badge-accent shrink-0">
                    👑 Host
                </span>
            )}
        </div>
    )
}
