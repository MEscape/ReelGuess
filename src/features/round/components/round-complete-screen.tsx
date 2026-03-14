'use client'

import { useTranslations }               from 'next-intl'
import { Button, ErrorMessage }          from '@/components/ui'
import { RoundScoreboard }               from './round-scoreboard'
import { useGameSession, useGameRound }  from '@/features/game'

export function RoundCompleteScreen() {
    const { isHost, settings }                               = useGameSession()
    const { scores, activeRound, livePlayers,
        isStartPending, startError, onStartNextRound }   = useGameRound()
    const t = useTranslations('game')

    const nextRound      = (activeRound?.roundNumber ?? 0) + 1
    const totalRounds    = settings.roundsCount
    const isLastRoundDone = nextRound > totalRounds

    const scoresSafe = scores.length > 0
        ? scores
        : livePlayers.map((p) => ({
            playerId:    p.id,
            displayName: p.displayName,
            avatarSeed:  p.avatarSeed,
            points:      0,
            streak:      0,
        }))

    return (
        <div className="w-full space-y-4">
            <RoundScoreboard scores={scoresSafe} />

            {isHost ? (
                <div className="space-y-3 pt-1">
                    {isLastRoundDone ? (
                        <div
                            className="flex items-center justify-center gap-3 py-4"
                            style={{ background: 'var(--color-surface)', border: '2px solid var(--color-accent)' }}
                        >
                            <span className="status-dot status-dot-warn" />
                            <span
                                className="font-display uppercase"
                                style={{ fontSize: 'var(--text-ui)', letterSpacing: 'var(--tracking-display)', color: 'var(--color-accent)' }}
                            >
                                {t('loadingResults').toUpperCase()}
                            </span>
                        </div>
                    ) : (
                        <Button size="lg" fullWidth onClick={onStartNextRound} loading={isStartPending}>
                            {isStartPending
                                ? t('starting').toUpperCase()
                                : t('nextRoundNumber', { next: nextRound, total: totalRounds })}
                        </Button>
                    )}

                    <ErrorMessage message={startError} />
                </div>
            ) : (
                <div
                    className="flex items-center justify-center gap-3 py-4"
                    style={{ background: 'var(--color-surface)', border: '2px solid var(--color-border-subtle)' }}
                >
                    <span className="status-dot status-dot-warn" />
                    <span
                        className="font-display uppercase"
                        style={{ fontSize: 'var(--text-ui)', letterSpacing: 'var(--tracking-display)', color: 'var(--color-muted)' }}
                    >
                        {isLastRoundDone ? t('loadingResults').toUpperCase() : t('waitingForHost').toUpperCase()}
                    </span>
                </div>
            )}
        </div>
    )
}
