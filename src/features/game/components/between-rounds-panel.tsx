'use client'

import { Button, ErrorMessage } from '@/components/ui'
import { Scoreboard }           from './scoreboard'
import type { ScoreEntry }      from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type BetweenRoundsPanelProps = {
    scores:       ScoreEntry[]
    isHost:       boolean
    isPending:    boolean
    error:        string | null
    nextRound:    number
    totalRounds:  number
    onNext:       () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shown in the `complete` phase between rounds.
 *
 * Renders the current scoreboard and:
 * - Host: prominent "NEXT ROUND" CTA, or a loading indicator if the game is
 *   finishing (nextRound > totalRounds — waiting for the GameOverScreen).
 * - Guest: minimal pulsing wait indicator.
 */
export function BetweenRoundsPanel({
                                       scores,
                                       isHost,
                                       isPending,
                                       error,
                                       nextRound,
                                       totalRounds,
                                       onNext,
                                   }: BetweenRoundsPanelProps) {
    const isLastRoundDone = nextRound > totalRounds

    return (
        <div className="w-full space-y-4">
            <Scoreboard scores={scores} />

            {isHost ? (
                <div className="space-y-3 pt-1">
                    {isLastRoundDone ? (
                        /* Final round done — waiting for Realtime lobby.status='finished' */
                        <div
                            className="flex items-center justify-center gap-3 py-4"
                            style={{
                                background: 'var(--color-surface)',
                                border:     '2px solid var(--color-accent)',
                            }}
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
                        <Button
                            size="lg"
                            fullWidth
                            onClick={onNext}
                            loading={isPending}
                        >
                            {isPending ? 'STARTING…' : `▶ NEXT ROUND ${nextRound} / ${totalRounds}`}
                        </Button>
                    )}
                    <ErrorMessage message={error} />
                </div>
            ) : (
                <div
                    className="flex items-center justify-center gap-3 py-4"
                    style={{
                        background: 'var(--color-surface)',
                        border:     '2px solid var(--color-border-subtle)',
                    }}
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