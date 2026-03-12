'use client'

import { motion }    from 'framer-motion'
import { Scoreboard } from './scoreboard'
import type { ScoreEntry } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type GameOverScreenProps = {
    scores: ScoreEntry[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full-bleed GAME OVER screen shown when `lobbyStatus` transitions to `finished`.
 *
 * Renders a trophy hero followed by the final {@link Scoreboard}.
 */
export function GameOverScreen({ scores }: GameOverScreenProps) {
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
            </motion.div>

            {/* ── Final scoreboard ────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="w-full"
            >
                <Scoreboard scores={scores} isFinal />
            </motion.div>
        </div>
    )
}