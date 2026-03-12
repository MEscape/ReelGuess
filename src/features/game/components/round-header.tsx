'use client'

import { Badge, StatusPanel } from '@/components/ui'
import { RoundTimer }         from './round-timer'
import type { GamePhase }     from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type RoundHeaderProps = {
    roundNumber:    number
    totalRounds:    number
    phase:          GamePhase
    timerSeconds:   number
    /** When the current voting round started — used to resume the timer on refresh. */
    startedAt?:     Date
    playerCount:    number
    voteCount:      number
    onTimerComplete: () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sticky round header bar shown during active play (all phases except `pregame`
 * and `finished`).
 *
 * Displays: round number / total · phase badge · vote count · timer.
 */
export function RoundHeader({
                                roundNumber,
                                totalRounds,
                                phase,
                                timerSeconds,
                                startedAt,
                                playerCount,
                                voteCount,
                                onTimerComplete,
                            }: RoundHeaderProps) {
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
        >
            {/* Round counter */}
            <div className="flex items-center gap-2">
                <span
                    className="font-display uppercase"
                    style={{
                        fontSize:      'var(--text-label-sm)',
                        letterSpacing: 'var(--tracking-label)',
                        color:         'var(--color-muted)',
                    }}
                >
                    ROUND
                </span>
                <span
                    className="font-display"
                    style={{
                        fontSize:      'var(--text-title-sm)',
                        letterSpacing: 'var(--tracking-display)',
                        color:         'var(--color-accent)',
                    }}
                >
                    {roundNumber}
                </span>
                <span
                    className="font-display"
                    style={{
                        fontSize: 'var(--text-label-sm)',
                        color:    'var(--color-subtle)',
                    }}
                >
                    / {totalRounds}
                </span>
            </div>

            {/* Phase badge + timer */}
            <div className="flex items-center gap-3">
                {phase === 'voting' && (
                    <>
                        <StatusPanel status="live" label="VOTING">
                            {voteCount}/{playerCount}
                        </StatusPanel>
                        <RoundTimer
                            seconds={timerSeconds}
                            isActive
                            startedAt={startedAt}
                            onComplete={onTimerComplete}
                        />
                    </>
                )}
                {phase === 'reveal' && (
                    <Badge variant="success" size="sm" pulse dot>REVEAL</Badge>
                )}
                {phase === 'complete' && (
                    <Badge variant="muted" size="sm">ROUND OVER</Badge>
                )}
                {phase === 'countdown' && (
                    <Badge variant="warning" size="sm" pulse>GET READY</Badge>
                )}
            </div>
        </div>
    )
}