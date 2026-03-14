'use client'

import { useMemo }              from 'react'
import { motion }               from 'framer-motion'
import { useTranslations }      from 'next-intl'
import { Card }                 from '@/components/ui'
import { DoubleButton }         from './double-button'
import { StreakIndicator }       from '@/features/scoring'
import { DOUBLE_MIN_POINTS }    from '@/features/scoring'
import { useGameSession, useGameRound } from '@/features/game'

export function VoteLockCard() {
    const { currentPlayerId }  = useGameSession()
    const { activeRound, scores, onDouble } = useGameRound()
    const t = useTranslations('voting')

    const currentStreak = useMemo(
        () => scores.find((s) => s.playerId === currentPlayerId)?.streak ?? 0,
        [scores, currentPlayerId],
    )

    const currentPoints = useMemo(
        () => scores.find((s) => s.playerId === currentPlayerId)?.points ?? 0,
        [scores, currentPlayerId],
    )

    const canUseDouble = currentPoints >= DOUBLE_MIN_POINTS

    if (!activeRound) return null

    return (
        <div className="pb-4 space-y-3">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1,    opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
                <Card variant="brutal" stripe className="flex flex-col items-center justify-center py-10 px-6 gap-4">
                    {/* Check mark */}
                    <div
                        className="flex items-center justify-center"
                        style={{ width: '4rem', height: '4rem', background: 'var(--color-success-bg)', border: '3px solid var(--color-success)', boxShadow: 'var(--shadow-brutal-success)' }}
                    >
                        <span className="font-display" style={{ fontSize: '2rem', color: 'var(--color-success)', lineHeight: 1 }}>✓</span>
                    </div>

                    <div className="text-center space-y-2">
                        <p
                            className="font-display uppercase"
                            style={{ fontSize: 'var(--text-title)', letterSpacing: 'var(--tracking-display)', color: 'var(--color-accent)' }}
                        >
                            {t('locked')}
                        </p>
                        <p className="font-sans" style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-muted)' }}>
                            {t('waitingVotes')}
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
                canActivate={canUseDouble}
                minPoints={DOUBLE_MIN_POINTS}
            />
        </div>
    )
}
