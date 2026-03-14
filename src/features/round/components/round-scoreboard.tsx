'use client'

import { memo, useMemo }        from 'react'
import { motion }               from 'framer-motion'
import { PlayerAvatar }         from '@/features/player'
import { Badge, ProgressBar }   from '@/components/ui'
import type { ScoreEntry }      from '@/features/scoring'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type RoundScoreboardProps = {
    scores: ScoreEntry[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/** Medal emoji for top-3 ranked positions. Index 0 = 1st place. */
export const MEDALS = ['🥇', '🥈', '🥉'] as const

/**
 * Compact ranked scoreboard shown between rounds (in {@link RoundCompletePanel}).
 *
 * Displays avatar, display name, streak indicator, current points, and a
 * relative progress bar against the leader.
 *
 * Renamed from `LiveScoreboard` — "round" makes the context explicit.
 * The final-game equivalent is {@link FinalLeaderboard}.
 */
export const RoundScoreboard = memo(function RoundScoreboard({ scores }: RoundScoreboardProps) {
    const sorted = useMemo(
        () => [...scores].sort((a, b) => b.points - a.points),
        [scores],
    )

    const maxPoints = Math.max(sorted[0]?.points ?? 0, 1)

    if (sorted.length === 0) return null

    return (
        <div className="w-full space-y-4">

            {/* ── Header ────────────────────────────────────────────── */}
            <div
                className="flex items-center gap-3 px-4 py-3"
                style={{
                    background: 'var(--color-surface)',
                    border:     '2px solid var(--color-border-subtle)',
                    borderLeft: '4px solid var(--color-border-strong)',
                    boxShadow:  'var(--shadow-brutal-xs)',
                }}
            >
                <span
                    className="font-display uppercase flex-1"
                    style={{
                        fontSize:      'var(--text-title-sm)',
                        letterSpacing: 'var(--tracking-display)',
                        color:         'var(--color-foreground)',
                    }}
                >
                    SCOREBOARD
                </span>
                <Badge variant="muted" size="sm">{sorted.length} PLAYERS</Badge>
            </div>

            {/* ── Score list ────────────────────────────────────────── */}
            <div
                style={{
                    background: 'var(--color-surface)',
                    border:     '2px solid var(--color-border-subtle)',
                    boxShadow:  'var(--shadow-brutal)',
                    overflow:   'hidden',
                }}
            >
                {sorted.map((entry, idx) => (
                    <motion.div
                        key={entry.playerId}
                        initial={{ x: -16, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.07 }}
                        style={{
                            borderBottom: idx < sorted.length - 1 ? '1px solid var(--color-border)' : 'none',
                            borderLeft:   idx === 0 ? '4px solid var(--color-accent)'
                                : idx === 1 ? '4px solid var(--color-muted)'
                                    : '4px solid transparent',
                            padding: '0.75rem 1rem',
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <span
                                className="font-display shrink-0 tabular-nums"
                                style={{
                                    fontSize:  'var(--text-label-sm)',
                                    color:     'var(--color-subtle)',
                                    width:     '1.5rem',
                                    textAlign: 'center',
                                }}
                            >
                                {idx < 3 ? MEDALS[idx] : idx + 1}
                            </span>

                            <PlayerAvatar seed={entry.avatarSeed} size={36} />

                            <div className="flex-1 min-w-0">
                                <p
                                    className="font-display uppercase truncate"
                                    style={{
                                        fontSize:      'var(--text-ui)',
                                        letterSpacing: 'var(--tracking-display)',
                                        color:         'var(--color-foreground)',
                                        lineHeight:    1.1,
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

                            <span
                                className="font-display tabular-nums shrink-0"
                                style={{
                                    fontSize:      'var(--text-title-sm)',
                                    letterSpacing: 'var(--tracking-display)',
                                    color:         idx === 0 ? 'var(--color-accent)' : 'var(--color-foreground)',
                                    lineHeight:    1,
                                }}
                            >
                                {entry.points}
                            </span>
                        </div>

                        <div className="mt-2 pl-9">
                            <ProgressBar value={entry.points} max={maxPoints} variant="default" className="opacity-40" />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
})