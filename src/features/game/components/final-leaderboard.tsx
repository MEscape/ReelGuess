'use client'

import { memo }            from 'react'
import { motion }          from 'framer-motion'
import { PlayerAvatar }    from '@/features/player'
import type { ScoreEntry } from '@/features/scoring'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type FinalLeaderboardProps = {
    /**
     * Scores sorted descending by points.
     * Sorting is the caller's responsibility (`GameOverScreen`) so the sort
     * is performed once and shared with the winner derivation — not duplicated.
     */
    scores: ScoreEntry[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Medal emoji for top-3 ranked positions. Index 0 = 1st place. */
export const MEDALS = ['🥇', '🥈', '🥉'] as const

/** Podium render order: 2nd left, 1st centre, 3rd right. */
const PODIUM_ORDER = [1, 0, 2] as const

/** Podium platform heights indexed by rank (0 = 1st). */
const PODIUM_HEIGHTS: Record<number, string> = {
    0: '7rem',
    1: '5.5rem',
    2: '4rem',
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Top-3 podium displayed above the full standings list.
 * Render order is 2nd → 1st → 3rd so the winner stands tallest in the centre.
 * Missing slots (< 3 players) render as empty spacers to keep layout stable.
 */
function Podium({ scores }: { scores: ScoreEntry[] }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center items-end gap-2"
            style={{
                padding:      '1.5rem 1rem 0',
                background:   'var(--color-surface)',
                border:       '2px solid var(--color-border-subtle)',
                borderBottom: 'none',
                boxShadow:    'var(--shadow-brutal)',
            }}
        >
            {PODIUM_ORDER.map((rank) => {
                const entry   = scores[rank]
                const isFirst = rank === 0

                if (!entry) return <div key={rank} style={{ width: '5rem' }} />

                return (
                    <motion.div
                        key={entry.playerId}
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: rank * 0.2, type: 'spring', stiffness: 180, damping: 16 }}
                        className="flex flex-col items-center gap-1.5"
                    >
                        <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{MEDALS[rank]}</span>

                        <div
                            style={{
                                padding:   isFirst ? '3px' : '2px',
                                border:    `2px solid ${isFirst ? 'var(--color-accent)' : 'var(--color-border-strong)'}`,
                                boxShadow: isFirst ? 'var(--shadow-brutal-accent)' : 'none',
                            }}
                        >
                            <PlayerAvatar seed={entry.avatarSeed} size={isFirst ? 52 : 40} />
                        </div>

                        <p
                            className="font-display uppercase text-center"
                            style={{
                                fontSize:      'var(--text-label-sm)',
                                letterSpacing: 'var(--tracking-display)',
                                color:         'var(--color-foreground)',
                                maxWidth:      '5rem',
                                overflow:      'hidden',
                                textOverflow:  'ellipsis',
                                whiteSpace:    'nowrap',
                            }}
                        >
                            {entry.displayName}
                        </p>

                        {/* Platform block */}
                        <div
                            className="flex items-end justify-center w-20 pb-3"
                            style={{
                                height:       PODIUM_HEIGHTS[rank],
                                background:   isFirst ? 'rgba(245,200,0,0.12)' : 'var(--color-surface-raised)',
                                border:       `2px solid ${isFirst ? 'var(--color-accent)' : 'var(--color-border)'}`,
                                borderBottom: 'none',
                            }}
                        >
                            <span
                                className="font-display"
                                style={{
                                    fontSize:      isFirst ? 'var(--text-title-sm)' : 'var(--text-ui)',
                                    letterSpacing: 'var(--tracking-display)',
                                    color:         isFirst ? 'var(--color-accent)' : 'var(--color-muted)',
                                }}
                            >
                                {entry.points}
                            </span>
                        </div>
                    </motion.div>
                )
            })}
        </motion.div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Final-game leaderboard shown on {@link GameOverScreen}.
 *
 * Renders a top-3 podium (when ≥ 2 players) above a full ranked standings list.
 * The podium and list share the same border box so they read as one connected
 * panel — the podium platforms have no bottom border and the list container
 * has no top border.
 *
 * Expects `scores` pre-sorted descending by points — `GameOverScreen` sorts
 * once and passes the result here and to the winner hero, avoiding a
 * duplicate O(n log n) sort.
 */
export const FinalLeaderboard = memo(function FinalLeaderboard({ scores }: FinalLeaderboardProps) {
    if (scores.length === 0) return (
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

    return (
        <div className="w-full flex flex-col gap-0">

            {/* Podium — only when there are at least 2 players to compare */}
            {scores.length >= 2 && <Podium scores={scores} />}

            {/* Header */}
            <div
                className="flex items-center px-4 py-3"
                style={{
                    background:   'var(--color-surface)',
                    border:       '2px solid var(--color-border-subtle)',
                    borderTop:    scores.length >= 2 ? 'none' : '2px solid var(--color-border-subtle)',
                    borderLeft:   '4px solid var(--color-accent)',
                    borderBottom: 'none',
                    boxShadow:    scores.length >= 2 ? 'none' : 'var(--shadow-brutal-xs)',
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
                    {scores.length} PLAYER{scores.length !== 1 ? 'S' : ''}
                </span>
            </div>

            {/* Rows */}
            <div
                style={{
                    background: 'var(--color-surface)',
                    border:     '2px solid var(--color-border-subtle)',
                    borderTop:  'none',
                    boxShadow:  'var(--shadow-brutal)',
                    overflow:   'hidden',
                }}
            >
                {scores.map((entry, idx) => {
                    const isFirst  = idx === 0
                    const isSecond = idx === 1

                    return (
                        <motion.div
                            key={entry.playerId}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: idx * 0.06, duration: 0.25 }}
                            className="flex items-center gap-3 px-4 py-3"
                            style={{
                                borderBottom: idx < scores.length - 1 ? '1px solid var(--color-border)' : 'none',
                                borderLeft:   isFirst  ? '4px solid var(--color-accent)'
                                    :         isSecond ? '4px solid var(--color-muted)'
                                        :                    '4px solid transparent',
                                background:   isFirst ? 'rgba(245,200,0,0.04)' : 'transparent',
                            }}
                        >
                            {/* Rank */}
                            <span
                                className="font-display shrink-0 tabular-nums text-center"
                                style={{
                                    fontSize: 'var(--text-body)',
                                    width:    '1.75rem',
                                    color:    'var(--color-subtle)',
                                }}
                            >
                                {idx < 3 ? MEDALS[idx] : `${idx + 1}.`}
                            </span>

                            {/* Avatar */}
                            <div
                                style={{
                                    padding:    isFirst ? '2px' : '0',
                                    border:     isFirst ? '2px solid var(--color-accent)' : 'none',
                                    boxShadow:  isFirst ? 'var(--shadow-brutal-accent)' : 'none',
                                    flexShrink: 0,
                                }}
                            >
                                <PlayerAvatar seed={entry.avatarSeed} size={isFirst ? 40 : 34} />
                            </div>

                            {/* Name + streak */}
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