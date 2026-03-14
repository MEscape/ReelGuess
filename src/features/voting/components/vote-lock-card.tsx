'use client'

import { useMemo }              from 'react'
import { motion }               from 'framer-motion'
import { Card }                 from '@/components/ui'
import { DoubleButton }         from './double-button'
import { StreakIndicator }       from '@/features/scoring'
import { useGameSession, useGameRound }          from '@/features/game'

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shown after the current player has voted — replaces the vote grid.
 *
 * Renders `null` if `activeRound` is not yet available so that `DoubleButton`
 * never receives an empty-string `roundId` and generates an invalid DB call.
 *
 * The streak derivation is memoised — the `scores` array reference changes
 * on every Realtime update, so an inline `.find()` would re-run on every
 * render even when the current player's streak has not changed.
 */
export function VoteLockCard() {
    const { currentPlayerId }  = useGameSession()
    const { activeRound, scores, onDouble } = useGameRound()

    const currentStreak = useMemo(
        () => scores.find((s) => s.playerId === currentPlayerId)?.streak ?? 0,
        [scores, currentPlayerId],
    )

    // Guard: do not render until the active round is known.
    // This prevents passing an empty string to DoubleButton's roundId prop.
    if (!activeRound) return null

    return (
        <div className="pb-4 space-y-3">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1,    opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
                <Card
                    variant="brutal"
                    stripe
                    className="flex flex-col items-center justify-center py-10 px-6 gap-4"
                >
                    {/* Check mark */}
                    <div
                        className="flex items-center justify-center"
                        style={{
                            width:      '4rem',
                            height:     '4rem',
                            background: 'var(--color-success-bg)',
                            border:     '3px solid var(--color-success)',
                            boxShadow:  'var(--shadow-brutal-success)',
                        }}
                    >
                        <span
                            className="font-display"
                            style={{ fontSize: '2rem', color: 'var(--color-success)', lineHeight: 1 }}
                        >
                            ✓
                        </span>
                    </div>

                    <div className="text-center space-y-2">
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
                            style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-muted)' }}
                        >
                            Waiting for others to vote…
                        </p>

                        {currentStreak > 0 && (
                            <div className="flex justify-center pt-1">
                                <StreakIndicator streak={currentStreak} size="md" />
                            </div>
                        )}
                    </div>
                </Card>
            </motion.div>

            <DoubleButton
                roundId={activeRound.id}
                voterId={currentPlayerId}
                onDoubleAction={onDouble}
            />
        </div>
    )
}