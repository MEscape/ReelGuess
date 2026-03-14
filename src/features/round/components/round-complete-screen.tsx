'use client'

import { Button, ErrorMessage }          from '@/components/ui'
import { RoundScoreboard }               from './round-scoreboard'
import { useGameSession, useGameRound }  from '@/features/game'

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shown in the `complete` phase between rounds.
 *
 * Reads from context — no props.
 *
 * - Host: prominent "NEXT ROUND" CTA, or a loading indicator when the game
 *   is finishing (nextRound > totalRounds — waiting for Realtime lobby.status).
 * - Guest: minimal pulsing wait indicator.
 */
export function RoundCompleteScreen() {
    const { isHost, settings }                               = useGameSession()
    const { scores, activeRound, livePlayers,
        isStartPending, startError, onStartNextRound }   = useGameRound()

    const nextRound      = (activeRound?.roundNumber ?? 0) + 1
    const totalRounds    = settings.roundsCount
    const isLastRoundDone = nextRound > totalRounds

    // When nobody voted this round there are no score rows yet — synthesise
    // zero-point entries for all live players so the scoreboard never shows
    // "no scores yet" after the first round.
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
                        /* Final round done — waiting for Realtime lobby.status='finished' */
                        <div
                            className="flex items-center justify-center gap-3 py-4"
                            style={{ background: 'var(--color-surface)', border: '2px solid var(--color-accent)' }}
                        >
                            <span className="status-dot status-dot-warn" />
                            <span
                                className="font-display uppercase"
                                style={{
                                    fontSize:      'var(--text-ui)',
                                    letterSpacing: 'var(--tracking-display)',
                                    color:         'var(--color-accent)',
                                }}
                            >
                                Game Over — Loading results…
                            </span>
                        </div>
                    ) : (
                        <Button size="lg" fullWidth onClick={onStartNextRound} loading={isStartPending}>
                            {isStartPending ? 'STARTING…' : `▶ NEXT ROUND ${nextRound} / ${totalRounds}`}
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
                        style={{
                            fontSize:      'var(--text-ui)',
                            letterSpacing: 'var(--tracking-display)',
                            color:         'var(--color-muted)',
                        }}
                    >
                        {isLastRoundDone ? 'Game Over — Loading results…' : 'Waiting for host…'}
                    </span>
                </div>
            )}
        </div>
    )
}