'use client'

import { memo, useMemo } from 'react'
import { motion }        from 'framer-motion'
import { PlayerAvatar }  from '@/features/player/components/PlayerAvatar'
import type { ScoreEntry } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const MEDALS = ['🥇', '🥈', '🥉'] as const

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type LeaderboardProps = {
    scores: ScoreEntry[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Final-game leaderboard shown on the {@link GameOverScreen}.
 *
 * Renders a ranked list sorted by score descending with:
 * - Medal emoji for top-3
 * - Player avatar + display name
 * - Final score highlighted in accent colour for 1st place
 */
export const Leaderboard = memo(function Leaderboard({ scores }: LeaderboardProps) {
    const sorted = useMemo(
        () => [...scores].sort((a, b) => b.points - a.points),
        [scores],
    )

    if (sorted.length === 0) {
        return (
            <div
                className="w-full text-center py-6"
                style={{
                    background: 'var(--color-surface)',
                    border:     '2px solid var(--color-border-subtle)',
                    color:      'var(--color-muted)',
                    fontSize:   'var(--text-body-sm)',
                }}
            >
                No scores yet.
            </div>
        )
    }

    return (
        <div className="w-full flex flex-col gap-0">
            {/* ── Header ───────────────────────────────────────────── */}
            <div
                className="flex items-center px-4 py-3"
                style={{
                    background:  'var(--color-surface)',
                    border:      '2px solid var(--color-border-subtle)',
                    borderLeft:  '4px solid var(--color-accent)',
                    borderBottom: 'none',
                    boxShadow:   'var(--shadow-brutal-xs)',
                }}
            >
                <span
                    className="font-display uppercase flex-1"
                    style={{
                        fontSize:      'var(--text-title-sm)',
                        letterSpacing: 'var(--tracking-display)',
                        color:         'var(--color-accent)',
                    }}
                >
                    🏆 FINAL STANDINGS
                </span>
                <span
                    className="font-display uppercase"
                    style={{
                        fontSize:      'var(--text-label-sm)',
                        letterSpacing: 'var(--tracking-label)',
                        color:         'var(--color-muted)',
                    }}
                >
                    {sorted.length} PLAYER{sorted.length !== 1 ? 'S' : ''}
                </span>
            </div>

            {/* ── Ranked rows ──────────────────────────────────────── */}
            <div
                style={{
                    background: 'var(--color-surface)',
                    border:     '2px solid var(--color-border-subtle)',
                    boxShadow:  'var(--shadow-brutal)',
                    overflow:   'hidden',
                }}
            >
                {sorted.map((entry, idx) => {
                    const isFirst  = idx === 0
                    const isSecond = idx === 1
                    return (
                        <motion.div
                            key={entry.playerId}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0,   opacity: 1 }}
                            transition={{ delay: idx * 0.06, duration: 0.25 }}
                            className="flex items-center gap-3 px-4 py-3"
                            style={{
                                borderBottom: idx < sorted.length - 1 ? '1px solid var(--color-border)' : 'none',
                                borderLeft:   isFirst
                                    ? '4px solid var(--color-accent)'
                                    : isSecond
                                        ? '4px solid var(--color-muted)'
                                        : '4px solid transparent',
                                background: isFirst
                                    ? 'rgba(245,200,0,0.04)'
                                    : 'transparent',
                            }}
                        >
                            {/* Rank */}
                            <span
                                className="font-display shrink-0 tabular-nums text-center"
                                style={{
                                    fontSize:  'var(--text-body)',
                                    width:     '1.75rem',
                                    color:     'var(--color-subtle)',
                                }}
                            >
                                {idx < 3 ? MEDALS[idx] : `${idx + 1}.`}
                            </span>

                            {/* Avatar */}
                            <div
                                style={{
                                    padding:   isFirst ? '2px' : '0',
                                    border:    isFirst ? '2px solid var(--color-accent)' : 'none',
                                    boxShadow: isFirst ? 'var(--shadow-brutal-accent)' : 'none',
                                    flexShrink: 0,
                                }}
                            >
                                <PlayerAvatar seed={entry.avatarSeed} size={isFirst ? 40 : 34} />
                            </div>

                            {/* Name */}
                            <div className="flex-1 min-w-0">
                                <p
                                    className="font-display uppercase truncate"
                                    style={{
                                        fontSize:      isFirst ? 'var(--text-ui)' : 'var(--text-body)',
                                        letterSpacing: 'var(--tracking-display)',
                                        color:         isFirst ? 'var(--color-foreground)' : 'var(--color-muted)',
                                        lineHeight:    1.2,
                                    }}
                                >
                                    {entry.displayName}
                                </p>
                                {entry.streak >= 2 && (
                                    <p
                                        className="font-display"
                                        style={{
                                            fontSize:      'var(--text-label-xs)',
                                            letterSpacing: 'var(--tracking-display)',
                                            color:         'var(--color-warning)',
                                            lineHeight:    1.2,
                                        }}
                                    >
                                        🔥 {entry.streak}× STREAK
                                    </p>
                                )}
                            </div>

                            {/* Points */}
                            <span
                                className="font-display tabular-nums shrink-0"
                                style={{
                                    fontSize:      isFirst ? 'var(--text-title)' : 'var(--text-title-sm)',
                                    letterSpacing: 'var(--tracking-display)',
                                    color:         isFirst ? 'var(--color-accent)' : 'var(--color-foreground)',
                                    lineHeight:    1,
                                }}
                            >
                                {entry.points}
                            </span>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
})
