'use client'

import { useTranslations }               from 'next-intl'
import { Badge, StatusPanel }            from '@/components/ui'
import { RoundTimer }                    from './round-timer'
import { useGameSession, useGameRound }  from '../game-context'

export function RoundHeader() {
    const { settings }                             = useGameSession()
    const { activeRound, phase, voteCount,
        livePlayers, onTimerComplete }         = useGameRound()
    const t = useTranslations('game')

    const roundNumber = activeRound?.roundNumber ?? 0
    const totalRounds = settings.roundsCount

    return (
        <div
            className="w-full flex items-center justify-between px-4 py-2.5"
            style={{
                background: 'var(--color-surface)',
                border:     '2px solid var(--color-border-subtle)',
                borderLeft: '4px solid var(--color-accent)',
                boxShadow:  'var(--shadow-brutal-xs)',
                position:   'sticky',
                top:        0,
                zIndex:     10,
            }}
            role="status"
            aria-label={t('round', { current: roundNumber, total: totalRounds })}
        >
            {/* Round counter */}
            <div className="flex items-center gap-2">
                <span
                    className="font-display uppercase"
                    style={{ fontSize: 'var(--text-label-sm)', letterSpacing: 'var(--tracking-label)', color: 'var(--color-muted)' }}
                >
                    {t('roundLabel').toUpperCase()}
                </span>
                <span
                    className="font-display"
                    style={{ fontSize: 'var(--text-title-sm)', letterSpacing: 'var(--tracking-display)', color: 'var(--color-accent)' }}
                >
                    {roundNumber}
                </span>
                <span className="font-display" style={{ fontSize: 'var(--text-label-sm)', color: 'var(--color-subtle)' }}>
                    / {totalRounds}
                </span>
            </div>

            {/* Phase indicator */}
            <div className="flex items-center gap-3">
                {phase === 'voting' && (
                    <>
                        <StatusPanel status="live" label={t('phase.voting').toUpperCase()}>
                            {voteCount}/{livePlayers.length}
                        </StatusPanel>
                        <RoundTimer
                            seconds={settings.timerSeconds}
                            isActive
                            startedAt={activeRound?.startedAt}
                            onComplete={onTimerComplete}
                        />
                    </>
                )}
                {phase === 'reveal'   && <Badge variant="warning">{t('phase.reveal').toUpperCase()}</Badge>}
                {phase === 'complete' && <Badge variant="muted">{t('viewResults').toUpperCase()}</Badge>}
            </div>
        </div>
    )
}
