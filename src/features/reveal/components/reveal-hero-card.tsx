'use client'

import { useTranslations }         from 'next-intl'
import { motion }                   from 'framer-motion'
import { PlayerAvatar, type Player } from '@/features/player'
import { Card, Badge }              from '@/components/ui'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type RevealHeroCardProps = {
    /** The player whose answer was correct. `undefined` while resolving. */
    correctPlayer: Player | undefined
    /** Number of players who voted correctly this round. */
    correctCount:  number
    /** Total number of votes cast this round. */
    totalVotes:    number
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hero card announcing the correct player for the round.
 *
 * Renders the "IT WAS…" label, avatar, display name, and correct-count badge.
 * Purely presentational — receives all data as props.
 */
export function RevealHeroCard({ correctPlayer, correctCount, totalVotes }: RevealHeroCardProps) {
    const t = useTranslations('reveal')

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 16 }}
        >
            <Card variant="accent" stripe className="relative overflow-hidden">
                <div
                    aria-hidden
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(245,200,0,0.03) 8px, rgba(245,200,0,0.03) 16px)',
                    }}
                />

                <div className="relative flex flex-col items-center gap-4 py-6 px-4">
                    <span
                        className="font-display uppercase"
                        style={{
                            fontSize:      'var(--text-label-sm)',
                            letterSpacing: 'var(--tracking-loose)',
                            color:         'var(--color-accent)',
                        }}
                    >
                        {t('itWas')}
                    </span>

                    {correctPlayer && (
                        <motion.div
                            initial={{ y: 16, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.25, type: 'spring', stiffness: 200 }}
                            className="flex flex-col items-center gap-3"
                        >
                            <div
                                style={{
                                    padding:    '4px',
                                    border:     '3px solid var(--color-accent)',
                                    boxShadow:  'var(--shadow-brutal-accent), var(--shadow-glow-accent-lg)',
                                }}
                            >
                                <PlayerAvatar seed={correctPlayer.avatarSeed} size={80} />
                            </div>

                            <p
                                className="font-display uppercase text-center"
                                style={{
                                    fontSize:      'var(--text-title-lg)',
                                    letterSpacing: 'var(--tracking-display)',
                                    color:         'var(--color-foreground)',
                                    lineHeight:    1,
                                }}
                            >
                                {correctPlayer.displayName}
                            </p>
                        </motion.div>
                    )}

                    <Badge variant="success" size="lg">
                        {t('correct', { count: correctCount, total: totalVotes })}
                    </Badge>
                </div>
            </Card>
        </motion.div>
    )
}