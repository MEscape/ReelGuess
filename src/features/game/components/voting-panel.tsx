'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { PlayerAvatar } from '@/features/player/components/PlayerAvatar'
import { ErrorMessage, Card } from '@/components/ui'
import type { Player } from '@/features/player/types'

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
 * Voting panel — brutalist redesign.
 *
 * - Full-height vote buttons with avatar + name
 * - Staggered entrance animation
 * - Voted state: large confirmation lockout card
 * - No roundness — pure brutalist geometry
 */
export const VotingPanel = memo(function VotingPanel({
                                                         players,
                                                         onVote,
                                                         hasVoted,
                                                         isPending,
                                                         error,
                                                     }: VotingPanelProps) {
    // ── Voted confirmation ─────────────────────────────────────────────────
    if (hasVoted) {
        return (
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="pb-4"
            >
                <Card
                    variant="brutal"
                    stripe
                    className="flex flex-col items-center justify-center py-10 px-6 gap-4"
                >
                    {/* Big checkmark */}
                    <div
                        className="flex items-center justify-center"
                        style={{
                            width:        '4rem',
                            height:       '4rem',
                            background:   'var(--color-success-bg)',
                            border:       '3px solid var(--color-success)',
                            boxShadow:    'var(--shadow-brutal-success)',
                        }}
                    >
                        <span
                            className="font-display"
                            style={{
                                fontSize: '2rem',
                                color:    'var(--color-success)',
                                lineHeight: 1,
                            }}
                        >
                            ✓
                        </span>
                    </div>

                    <div className="text-center space-y-1">
                        <p
                            className="font-display uppercase"
                            style={{
                                fontSize:      'var(--text-title)',
                                letterSpacing: 'var(--tracking-display)',
                                color:         'var(--color-accent)',
                            }}
                        >
                            VOTE LOCKED
                        </p>
                        <p
                            className="font-sans"
                            style={{
                                fontSize: 'var(--text-body-sm)',
                                color:    'var(--color-muted)',
                            }}
                        >
                            Waiting for others to vote…
                        </p>
                    </div>
                </Card>
            </motion.div>
        )
    }

    // ── Voting grid ─────────────────────────────────────────────────────────
    return (
        <div className="w-full space-y-3 pb-4">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div
                    style={{
                        flex:        1,
                        height:      '2px',
                        background:  'var(--color-border-subtle)',
                    }}
                />
                <span
                    className="font-display uppercase shrink-0"
                    style={{
                        fontSize:      'var(--text-label-sm)',
                        letterSpacing: 'var(--tracking-loose)',
                        color:         'var(--color-muted)',
                    }}
                >
                    WHO LIKED THIS REEL?
                </span>
                <div
                    style={{
                        flex:        1,
                        height:      '2px',
                        background:  'var(--color-border-subtle)',
                    }}
                />
            </div>

            {/* Player grid */}
            <div className="grid grid-cols-2 gap-2.5">
                {players.map((player, i) => (
                    <motion.button
                        key={player.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07, ease: 'easeOut' }}
                        onClick={() => onVote(player.id)}
                        disabled={isPending}
                        className="vote-btn"
                        style={{ minHeight: '7rem' }}
                    >
                        <PlayerAvatar seed={player.avatarSeed} size={56} />
                        <span
                            className="font-display uppercase truncate w-full text-center px-2"
                            style={{
                                fontSize:      'var(--text-ui)',
                                letterSpacing: 'var(--tracking-display)',
                                color:         'var(--color-foreground)',
                                lineHeight:    1.1,
                            }}
                        >
                            {player.displayName}
                        </span>
                    </motion.button>
                ))}
            </div>

            <ErrorMessage message={error} className="mt-2" />
        </div>
    )
})