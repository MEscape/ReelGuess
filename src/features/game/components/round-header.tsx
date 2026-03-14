'use client'

import { Badge, StatusPanel }            from '@/components/ui'
import { RoundTimer }                    from './round-timer'
import { useGameSession, useGameRound }  from '../game-context'

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sticky header bar rendered during all active phases (voting, reveal, complete).
 *
 * Shows the current round number, total rounds, and a phase-specific indicator:
 * - `voting`   → live vote count + countdown timer
 * - `reveal`   → "REVEAL" badge
 * - `complete` → "SCORES" badge
 *
 * Reads from both contexts — no props.
 */
export function RoundHeader() {
    const { settings }                             = useGameSession()
    const { activeRound, phase, voteCount,
        livePlayers, onTimerComplete }         = useGameRound()

    const roundNumber  = activeRound?.roundNumber ?? 0
    const totalRounds  = settings.roundsCount

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
            {/* Round counter: "ROUND 2 / 5" */}
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

            {/* Phase indicator */}
            <div className="flex items-center gap-3">
                {phase === 'voting' && (
                    <>
                        <StatusPanel status="live" label="VOTING">
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
                {phase === 'reveal'   && <Badge variant="warning">REVEAL</Badge>}
                {phase === 'complete' && <Badge variant="muted">SCORES</Badge>}
            </div>
        </div>
    )
}