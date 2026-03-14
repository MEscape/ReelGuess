'use client'

import { memo }                         from 'react'
import { motion }                       from 'framer-motion'
import { useTranslations }              from 'next-intl'
import { PlayerAvatar }                 from '@/features/player'
import { ErrorMessage }                 from '@/components/ui'
import { VoteLockCard }                 from './vote-lock-card'
import { useGameRound }                 from '@/features/game'

export const VotingPanel = memo(function VotingPanel() {
    const { livePlayers, onVote, hasVoted, isVotePending, voteError } = useGameRound()
    const t     = useTranslations('voting')
    const tAria = useTranslations('aria')

    if (hasVoted) return <VoteLockCard />

    return (
        <div className="w-full space-y-3 pb-4">

            {/* ── Header ── */}
            <div className="flex items-center gap-3">
                <div style={{ flex: 1, height: '2px', background: 'var(--color-border-subtle)' }} />
                <span
                    className="font-display uppercase shrink-0"
                    style={{ fontSize: 'var(--text-label-sm)', letterSpacing: 'var(--tracking-loose)', color: 'var(--color-muted)' }}
                >
                    {t('title').toUpperCase()}
                </span>
                <div style={{ flex: 1, height: '2px', background: 'var(--color-border-subtle)' }} />
            </div>

            {/* ── Player grid ── */}
            <div className="grid grid-cols-2 gap-2.5">
                {livePlayers.map((player, i) => (
                    <motion.button
                        key={player.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07, ease: 'easeOut' }}
                        onClick={() => onVote(player.id)}
                        disabled={isVotePending}
                        className="vote-btn"
                        style={{ minHeight: '7rem' }}
                        aria-label={tAria('voteFor', { name: player.displayName })}
                    >
                        <PlayerAvatar seed={player.avatarSeed} size={56} />
                        <span
                            className="font-display uppercase truncate w-full text-center px-2"
                            style={{ fontSize: 'var(--text-ui)', letterSpacing: 'var(--tracking-display)', color: 'var(--color-foreground)', lineHeight: 1.1 }}
                        >
                            {player.displayName}
                        </span>
                    </motion.button>
                ))}
            </div>

            <ErrorMessage message={voteError} className="mt-2" />
        </div>
    )
})
