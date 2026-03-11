'use client'

import { memo } from 'react'
import { PlayerAvatar } from '@/features/player/components/PlayerAvatar'
import { ErrorMessage, Card } from '@/components/ui'
import type { Player }  from '@/features/player/types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type VotingPanelProps = {
    players:   Player[]
    onVote:    (votedForId: string) => void
    hasVoted:  boolean
    isPending: boolean
    error:     string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Voting panel — grid of player buttons for casting a vote.
 *
 * Memoized: prevents re-renders when the parent updates unrelated state
 * (e.g. `voteCount` counter) while the props haven't changed.
 *
 * The `.vote-btn` class in globals.css handles all interactive states.
 */
export const VotingPanel = memo(function VotingPanel({
                                                         players,
                                                         onVote,
                                                         hasVoted,
                                                         isPending,
                                                         error,
                                                     }: VotingPanelProps) {
    if (hasVoted) {
        return (
            <Card className="text-center py-10 px-6">
                <div className="text-5xl mb-3">⏳</div>
                <p className="text-xl font-black text-[var(--color-accent)] uppercase">Vote Submitted!</p>
                <p className="text-[var(--color-muted)] mt-1 text-sm">Waiting for others…</p>
            </Card>
        )
    }

    return (
        <div className="w-full">
            <h3 className="text-sm font-black uppercase tracking-widest text-[var(--color-muted)] text-center mb-3">
                🤔 Who liked this reel?
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
                {players.map((player) => (
                    <button
                        key={player.id}
                        onClick={() => onVote(player.id)}
                        disabled={isPending}
                        className="vote-btn"
                    >
                        <PlayerAvatar seed={player.avatarSeed} size={52} />
                        <span className="font-black text-[var(--color-foreground)] text-xs uppercase tracking-wide truncate w-full text-center">
              {player.displayName}
            </span>
                    </button>
                ))}
            </div>
            <ErrorMessage message={error} className="mt-3" />
        </div>
    )
})