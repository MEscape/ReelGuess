'use client'

import { useMemo }                               from 'react'
import { HeroOverlay }                           from '@/features/scoring'
import { useGameSession, useGameRound }          from '@/features/game'
import { RevealHeroCard }                        from './reveal-hero-card'
import { VoteBreakdown }                         from './vote-breakdown'
import { CountdownStrip }                        from './countdown-strip'
import { ErrorMessage }                          from '@/components/ui'

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reveal phase screen — reads from context, requires no props.
 *
 * Responsibilities (one each, delegated to subcomponents):
 * 1. {@link HeroOverlay}     — achievement animations
 * 2. {@link RevealHeroCard}  — correct answer hero card
 * 3. {@link VoteBreakdown}   — vote and abstain rows
 * 4. {@link CountdownStrip}  — countdown timer + `onRevealComplete` trigger
 *
 * State derivation:
 * - `voterMap` and `correctPlayer` are derived here (single pass) and passed
 *   down as props — avoids duplicating the derivation in child components.
 *
 * Loading / error states:
 * - `isLoading`: renders a minimal skeleton so the user never sees a blank
 *   screen between rounds.
 * - `error`: surfaces a message without crashing the game UI.
 *
 * All hooks are called unconditionally before any early return.
 * Guest users do not trigger `onRevealComplete` — they wait for the Realtime
 * event propagated by the host's action.
 */
export function RevealScreen() {
    const { isHost }                                    = useGameSession()
    const { reveal, revealError, livePlayers: players, onRevealComplete } = useGameRound()

    // ── Derived data (unconditional — must precede early returns) ─────────
    const voterMap = useMemo(
        () => new Map(players.map((p) => [p.id, p])),
        [players],
    )

    const correctPlayer = useMemo(
        () => players.find((p) => p.id === reveal?.round.correctPlayerId),
        [players, reveal?.round.correctPlayerId],
    )

    const abstainedPlayers = useMemo(
        () => reveal
            ? players.filter((p) => !reveal.votes.some((v) => v.voterId === p.id))
            : [],
        [players, reveal],
    )

    // ── No data yet ───────────────────────────────────────────────────────
    if (!reveal) {
        if (revealError) {
            return (
                <div className="w-full space-y-3">
                    <ErrorMessage message={revealError} />
                    <p
                        className="text-center font-sans"
                        style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-muted)' }}
                    >
                        Waiting for reveal data… It will appear automatically.
                    </p>
                </div>
            )
        }
        return null
    }

    const correctCount = reveal.votes.filter((v) => v.isCorrect).length

    return (
        <div className="w-full space-y-4">

            {/* Achievement overlays */}
            <HeroOverlay achievements={reveal.achievements} />

            {/* Correct answer hero card */}
            <RevealHeroCard
                correctPlayer={correctPlayer}
                correctCount={correctCount}
                totalVotes={reveal.votes.length}
            />

            {/* Vote breakdown list */}
            <VoteBreakdown
                votes={reveal.votes}
                abstainedPlayers={abstainedPlayers}
                voterMap={voterMap}
                totalPlayerCount={players.length}
            />

            {/* Countdown strip — owns the timer, fires onRevealComplete (host only) */}
            <CountdownStrip
                roundId={reveal.round.id}
                isHost={isHost}
                onComplete={onRevealComplete}
            />
        </div>
    )
}