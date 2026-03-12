'use client'

import { motion }          from 'framer-motion'
import { Leaderboard }     from './leaderboard'
import { RematchButton }   from './rematch-button'
import type { ScoreEntry } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type GameOverScreenProps = {
    scores:          ScoreEntry[]
    lobbyId:         string
    currentPlayerId: string
    /**
     * If another player already triggered a rematch (detected via Realtime),
     * pass the new lobby code here so this player can join with one click.
     */
    rematchId?:      string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full-bleed GAME OVER screen shown when `lobbyStatus` transitions to `finished`.
 *
 * Renders a trophy hero, the final {@link Leaderboard}, and a
 * {@link RematchButton} for starting a new game with the same players.
 */
export function GameOverScreen({ scores, lobbyId, currentPlayerId, rematchId }: GameOverScreenProps) {
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
                {/* Stripe texture */}
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

                {/* Winner callout */}
                {scores.length > 0 && (
                    <motion.p
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="relative font-display uppercase"
                        style={{
                            fontSize:      'var(--text-body-sm)',
                            letterSpacing: 'var(--tracking-label)',
                            color:         'var(--color-muted)',
                            marginTop:     'var(--space-4)',
                        }}
                    >
                        Winner:{' '}
                        <span style={{ color: 'var(--color-accent)' }}>
                            {[...scores].sort((a, b) => b.points - a.points)[0].displayName}
                        </span>
                    </motion.p>
                )}
            </motion.div>

            {/* ── Final leaderboard ────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="w-full"
            >
                <Leaderboard scores={scores} />
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
