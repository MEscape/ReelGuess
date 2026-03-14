'use client'

import { useMemo }               from 'react'
import { motion }                from 'framer-motion'
import { PlayerAvatar }          from '@/features/player'
import { RematchButton }         from './rematch-button'
import { FinalLeaderboard }      from './final-leaderboard'
import type { ScoreEntry }       from '@/features/scoring'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type GameOverScreenProps = {
    scores:          ScoreEntry[]
    lobbyId:         string
    currentPlayerId: string
    /** New lobby code if another player already triggered a rematch. */
    rematchId?:      string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full-bleed GAME OVER screen shown when lobby status transitions to `finished`.
 *
 * Renders a trophy hero, the final {@link FinalLeaderboard}, and a
 * {@link RematchButton}.
 *
 * ### Single sort
 * Scores are sorted once here. `winner` is derived from `sorted[0]` and the
 * sorted array is passed to `FinalLeaderboard` — which does not re-sort.
 * This eliminates the duplicate O(n log n) sort from the previous
 * implementation where `GameOverScreen` and `Leaderboard` each sorted
 * independently.
 */
export function GameOverScreen({ scores, lobbyId, currentPlayerId, rematchId }: GameOverScreenProps) {
    const sorted = useMemo(
        () => [...scores].sort((a, b) => b.points - a.points),
        [scores],
    )

    const winner = sorted[0]

    return (
        <div className="flex flex-col items-center gap-6 p-4 w-full max-w-lg mx-auto">

            {/* ── Trophy hero ─────────────────────────────────────── */}
            <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 180, damping: 14 }}
                className="w-full text-center py-8 relative"
                style={{
                    background: 'var(--color-surface)',
                    border:     '3px solid var(--color-accent)',
                    borderTop:  '6px solid var(--color-accent)',
                    boxShadow:  'var(--shadow-brutal-accent-lg), var(--shadow-glow-accent-lg)',
                }}
            >
                <div
                    aria-hidden
                    style={{
                        position:      'absolute',
                        inset:         0,
                        background:    'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(245,200,0,0.03) 10px, rgba(245,200,0,0.03) 20px)',
                        pointerEvents: 'none',
                    }}
                />

                <div
                    className="relative"
                    style={{ fontSize: '5rem', lineHeight: 1, marginBottom: '0.75rem' }}
                    aria-hidden
                >
                    🏆
                </div>

                <p
                    className="font-display uppercase relative"
                    style={{
                        fontSize:      'var(--text-display)',
                        letterSpacing: 'var(--tracking-display)',
                        color:         'var(--color-accent)',
                        lineHeight:    0.9,
                    }}
                >
                    GAME
                </p>
                <p
                    className="font-display uppercase relative"
                    style={{
                        fontSize:      'var(--text-display)',
                        letterSpacing: 'var(--tracking-display)',
                        color:         'var(--color-foreground)',
                        lineHeight:    0.9,
                    }}
                >
                    OVER
                </p>

                {winner && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="relative flex flex-col items-center gap-2 mt-4"
                    >
                        <PlayerAvatar seed={winner.avatarSeed} size={48} />
                        <p
                            className="font-display uppercase"
                            style={{
                                fontSize:      'var(--text-body-sm)',
                                letterSpacing: 'var(--tracking-label)',
                                color:         'var(--color-muted)',
                            }}
                        >
                            Winner: <span style={{ color: 'var(--color-accent)' }}>{winner.displayName}</span>
                        </p>
                    </motion.div>
                )}
            </motion.div>

            {/* ── Final leaderboard ────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="w-full"
            >
                <FinalLeaderboard scores={sorted} />
            </motion.div>

            {/* ── Rematch ──────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="w-full"
            >
                <RematchButton
                    lobbyId={lobbyId}
                    currentPlayerId={currentPlayerId}
                    rematchId={rematchId}
                />
            </motion.div>
        </div>
    )
}