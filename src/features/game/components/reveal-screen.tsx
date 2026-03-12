'use client'

import { useEffect, useState, useRef, useMemo, startTransition } from 'react'
import { motion } from 'framer-motion'
import { PlayerAvatar } from '@/features/player/components/PlayerAvatar'
import { Card, Badge, ProgressBar } from '@/components/ui'
import { HeroOverlay } from '@/features/scoring/components/HeroOverlay'
import type { RoundReveal } from '../types'
import type { Player }      from '@/features/player/types'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const REVEAL_SECONDS = 6

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type RevealScreenProps = {
    reveal:                  RoundReveal
    players:                 Player[]
    isHost:                  boolean
    onRevealCompleteAction: () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reveals the correct answer — brutalist redesign.
 *
 * Layout:
 *  1. CORRECT ANSWER — dominant hero card with accent treatment
 *  2. Vote results — compact row list with correct/wrong indicators
 *  3. Countdown bar — clear "next in Xs" strip
 */
export function RevealScreen({ reveal, players, isHost, onRevealCompleteAction }: RevealScreenProps) {
    const correctPlayer = useMemo(
        () => players.find((p) => p.id === reveal.round.correctPlayerId),
        [players, reveal.round.correctPlayerId],
    )

    const voterMap = useMemo(
        () => new Map(players.map((p) => [p.id, p])),
        [players],
    )

    const [countdown, setCountdown] = useState(REVEAL_SECONDS)
    const [done, setDone]           = useState(false)
    const actionCalledRef           = useRef(false)

    useEffect(() => {
        actionCalledRef.current = false
        startTransition(() => {
            setDone(false)
            setCountdown(REVEAL_SECONDS)
        })

        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) { clearInterval(interval); startTransition(() => setDone(true)); return 0 }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [reveal.round.id])

    useEffect(() => {
        if (done && isHost && !actionCalledRef.current) {
            actionCalledRef.current = true
            onRevealCompleteAction()
        }
    }, [done, isHost, onRevealCompleteAction])

    const correctCount = reveal.votes.filter((v) => v.isCorrect).length
    const totalVotes   = reveal.votes.length

    // Players who did not cast a vote this round
    const abstainedPlayers = players.filter(
        (p) => !reveal.votes.some((v) => v.voterId === p.id),
    )

    return (
        <div className="w-full space-y-4">

            {/* ── Hero achievement overlays ────────────────────────── */}
            <HeroOverlay achievements={reveal.achievements} />

            {/* ── CORRECT ANSWER HERO ─────────────────────────────── */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 16 }}
            >
                <Card
                    variant="accent"
                    stripe
                    className="relative overflow-hidden"
                >
                    {/* BG texture stripe */}
                    <div
                        aria-hidden
                        style={{
                            position:   'absolute',
                            inset:      0,
                            background: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(245,200,0,0.03) 8px, rgba(245,200,0,0.03) 16px)',
                            pointerEvents: 'none',
                        }}
                    />

                    <div className="relative flex flex-col items-center gap-4 py-6 px-4">
                        {/* Label */}
                        <span
                            className="font-display uppercase"
                            style={{
                                fontSize:      'var(--text-label-sm)',
                                letterSpacing: 'var(--tracking-loose)',
                                color:         'var(--color-accent)',
                            }}
                        >
                            IT WAS…
                        </span>

                        {correctPlayer && (
                            <motion.div
                                initial={{ y: 16, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.25, type: 'spring', stiffness: 200 }}
                                className="flex flex-col items-center gap-3"
                            >
                                {/* Avatar with accent ring */}
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

                        {/* Score indicator */}
                        <Badge variant="success" size="lg">
                            {correctCount}/{totalVotes} CORRECT
                        </Badge>
                    </div>
                </Card>
            </motion.div>

            {/* ── VOTE RESULTS LIST ────────────────────────────────── */}
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
                            style={{
                                fontSize: 'var(--text-label-sm)',
                                color:    'var(--color-muted)',
                            }}
                        >
                            {totalVotes}/{players.length} VOTED
                        </span>
                    </div>

                    {/* No votes at all */}
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

                    {/* Vote rows */}
                    {reveal.votes.map((vote, i) => {
                        const voter    = voterMap.get(vote.voterId)
                        const votedFor = voterMap.get(vote.votedForId)

                        return (
                            <motion.div
                                key={vote.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.6 + i * 0.08 }}
                                className="flex items-center gap-3 px-4 py-2.5"
                                style={{
                                    borderBottom: '1px solid var(--color-border)',
                                    background:   vote.isCorrect
                                        ? 'rgba(34,197,94,0.04)'
                                        : 'transparent',
                                    borderLeft:   vote.isCorrect
                                        ? '3px solid var(--color-success)'
                                        : '3px solid var(--color-danger)',
                                }}
                            >
                                {/* Result icon */}
                                <span
                                    className="font-display shrink-0"
                                    style={{
                                        fontSize: 'var(--text-ui)',
                                        color:    vote.isCorrect
                                            ? 'var(--color-success)'
                                            : 'var(--color-danger)',
                                        width: '1.4rem',
                                        textAlign: 'center',
                                    }}
                                >
                                    {vote.isCorrect ? '✓' : '✕'}
                                </span>

                                {/* Voter */}
                                <span
                                    className="font-display uppercase flex-1 min-w-0 truncate"
                                    style={{
                                        fontSize:      'var(--text-body)',
                                        letterSpacing: 'var(--tracking-display)',
                                        color:         'var(--color-foreground)',
                                    }}
                                >
                                    {voter?.displayName ?? '—'}
                                </span>

                                <span
                                    style={{
                                        fontSize: 'var(--text-label-sm)',
                                        color:    'var(--color-subtle)',
                                    }}
                                    aria-hidden
                                >
                                    →
                                </span>

                                <span
                                    className="font-sans truncate"
                                    style={{
                                        fontSize: 'var(--text-body-sm)',
                                        color:    'var(--color-muted)',
                                        maxWidth: '6rem',
                                    }}
                                >
                                    {votedFor?.displayName ?? '—'}
                                </span>

                                {vote.isCorrect && (
                                    <span
                                        className="font-display shrink-0"
                                        style={{
                                            fontSize:      'var(--text-ui)',
                                            letterSpacing: 'var(--tracking-display)',
                                            color:         'var(--color-success)',
                                        }}
                                    >
                                        +{vote.pointsAwarded ?? 100}
                                    </span>
                                )}
                                {!vote.isCorrect && vote.pointsAwarded !== null && vote.pointsAwarded < 0 && (
                                    <span
                                        className="font-display shrink-0"
                                        style={{
                                            fontSize:      'var(--text-ui)',
                                            letterSpacing: 'var(--tracking-display)',
                                            color:         'var(--color-danger)',
                                        }}
                                    >
                                        {vote.pointsAwarded}
                                    </span>
                                )}
                                {vote.usedDouble && (
                                    <span
                                        className="font-display shrink-0"
                                        style={{
                                            fontSize: 'var(--text-label-xs)',
                                            color:    'var(--color-accent)',
                                        }}
                                        title="Double-or-Nothing activated"
                                    >
                                        ⚡
                                    </span>
                                )}
                            </motion.div>
                        )
                    })}

                    {/* Abstained players — did not vote */}
                    {abstainedPlayers.map((player, i) => (
                        <motion.div
                            key={player.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + (totalVotes + i) * 0.08 }}
                            className="flex items-center gap-3 px-4 py-2.5"
                            style={{
                                borderBottom: '1px solid var(--color-border)',
                                borderLeft:   '3px solid var(--color-border-subtle)',
                                opacity:      0.6,
                            }}
                        >
                            <span
                                className="font-display shrink-0"
                                style={{
                                    fontSize:  'var(--text-ui)',
                                    color:     'var(--color-muted)',
                                    width:     '1.4rem',
                                    textAlign: 'center',
                                }}
                            >
                                —
                            </span>
                            <span
                                className="font-display uppercase flex-1 min-w-0 truncate"
                                style={{
                                    fontSize:      'var(--text-body)',
                                    letterSpacing: 'var(--tracking-display)',
                                    color:         'var(--color-muted)',
                                }}
                            >
                                {player.displayName}
                            </span>
                            <span
                                className="font-sans shrink-0"
                                style={{
                                    fontSize: 'var(--text-label-sm)',
                                    color:    'var(--color-muted)',
                                }}
                            >
                                DID NOT VOTE
                            </span>
                        </motion.div>
                    ))}
                </Card>
            </motion.div>

            {/* ── COUNTDOWN STRIP ──────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                style={{
                    background:  'var(--color-surface)',
                    border:      '2px solid var(--color-border-subtle)',
                    padding:     '0.75rem 1rem',
                }}
            >
                <div className="flex items-center justify-between mb-2">
                    <span
                        className="font-display uppercase"
                        style={{
                            fontSize:      'var(--text-label-sm)',
                            letterSpacing: 'var(--tracking-label)',
                            color:         'var(--color-muted)',
                        }}
                    >
                        {isHost ? 'NEXT ROUND IN' : 'WAITING FOR HOST'}
                    </span>
                    <span
                        className="font-display"
                        style={{
                            fontSize:      'var(--text-title-sm)',
                            letterSpacing: 'var(--tracking-display)',
                            color:         'var(--color-accent)',
                        }}
                    >
                        {countdown}s
                    </span>
                </div>

                <ProgressBar
                    value={countdown}
                    max={REVEAL_SECONDS}
                    variant="default"
                />
            </motion.div>
        </div>
    )
}
