'use client'

import { motion }       from 'framer-motion'
import { Card }         from '@/components/ui'
import { VoteRow }      from './vote-row'
import { AbstainRow }   from './abstain-row'
import type { Vote }    from '@/features/voting'
import type { Player }  from '@/features/player'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type VoteBreakdownProps = {
    votes:            Vote[]
    abstainedPlayers: Player[]
    /** Pre-built map for O(1) player lookups — built once in `RevealScreen`. */
    voterMap:         Map<string, Player>
    totalPlayerCount: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The vote breakdown card shown during reveal.
 *
 * Renders the card header, each `VoteRow` for cast votes, each `AbstainRow`
 * for players who did not vote, and an empty state when no votes were cast.
 * Purely presentational — all data arrives as props.
 */
export function VoteBreakdown({
                                  votes,
                                  abstainedPlayers,
                                  voterMap,
                                  totalPlayerCount,
                              }: VoteBreakdownProps) {
    const totalVotes = votes.length

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
        >
            <Card variant="brutal" className="overflow-hidden">

                {/* Header */}
                <div
                    className="px-4 py-2.5 flex items-center justify-between"
                    style={{
                        borderBottom: '2px solid var(--color-border)',
                        background:   'var(--color-surface-raised)',
                    }}
                >
                    <span
                        className="font-display uppercase"
                        style={{
                            fontSize:      'var(--text-label-sm)',
                            letterSpacing: 'var(--tracking-label)',
                            color:         'var(--color-muted)',
                        }}
                    >
                        VOTE BREAKDOWN
                    </span>
                    <span
                        className="font-display"
                        style={{ fontSize: 'var(--text-label-sm)', color: 'var(--color-muted)' }}
                    >
                        {totalVotes}/{totalPlayerCount} VOTED
                    </span>
                </div>

                {/* Empty state */}
                {totalVotes === 0 && (
                    <div
                        className="flex items-center justify-center gap-2 px-4 py-6"
                        style={{ color: 'var(--color-muted)' }}
                    >
                        <span aria-hidden>⏱</span>
                        <span
                            className="font-display uppercase"
                            style={{
                                fontSize:      'var(--text-ui)',
                                letterSpacing: 'var(--tracking-display)',
                            }}
                        >
                            NO VOTES CAST — TIMER EXPIRED
                        </span>
                    </div>
                )}

                {/* Cast votes */}
                {votes.map((vote, i) => {
                    const voter    = voterMap.get(vote.voterId)
                    const votedFor = voterMap.get(vote.votedForId)
                    return (
                        <VoteRow
                            key={vote.id}
                            voterName={voter?.displayName    ?? '—'}
                            votedForName={votedFor?.displayName ?? '—'}
                            isCorrect={vote.isCorrect}
                            pointsAwarded={vote.pointsAwarded}
                            usedDouble={vote.usedDouble}
                            delay={0.6 + i * 0.08}
                        />
                    )
                })}

                {/* Abstentions */}
                {abstainedPlayers.map((player, i) => (
                    <AbstainRow
                        key={player.id}
                        displayName={player.displayName}
                        delay={0.6 + (totalVotes + i) * 0.08}
                    />
                ))}
            </Card>
        </motion.div>
    )
}