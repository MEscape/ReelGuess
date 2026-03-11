'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { PlayerAvatar }  from '@/features/player/components/PlayerAvatar'
import { Card }          from '@/components/ui'
import type { RoundReveal } from '../types'
import type { Player }      from '@/features/player/types'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** How long (seconds) the reveal is shown before the host advances. */
const REVEAL_SECONDS = 6

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type RevealScreenProps = {
    reveal:                  RoundReveal
    players:                 Player[]
    isHost:                  boolean
    /** Called once (on the host only) when the reveal countdown reaches zero. */
    onRevealCompleteAction: () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reveals the correct answer, lists all votes and animates a countdown bar.
 *
 * - `correctPlayer` and `voterMap` are memoized to avoid `find` on every render.
 * - The host's `onRevealCompleteAction` fires exactly once via a ref guard.
 */
export function RevealScreen({ reveal, players, isHost, onRevealCompleteAction }: RevealScreenProps) {
    // Memoize player lookups — avoid repeated .find() calls on each render
    const correctPlayer = useMemo(
        () => players.find((p) => p.id === reveal.round.correctPlayerId),
        [players, reveal.round.correctPlayerId],
    )

    const voterMap = useMemo(
        () => new Map(players.map((p) => [p.id, p])),
        [players],
    )

    const [countdown, setCountdown] = useState(REVEAL_SECONDS)
    const [done,      setDone]      = useState(false)
    const actionCalledRef           = useRef(false)

    useEffect(() => {
        actionCalledRef.current = false
        setDone(false)
        setCountdown(REVEAL_SECONDS)

        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) { clearInterval(interval); setDone(true); return 0 }
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

    return (
        <div className="flex flex-col items-center gap-6 py-6">
            {/* Header */}
            <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1,  rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="text-center"
            >
                <div className="text-7xl mb-2">🎉</div>
                <h2 className="text-3xl font-black uppercase text-[var(--color-accent)]">IT WAS…</h2>
            </motion.div>

            {/* Correct player */}
            {correctPlayer && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                >
                    <Card variant="accent" className="flex flex-col items-center gap-3 p-6">
                        <PlayerAvatar seed={correctPlayer.avatarSeed} size={80} />
                        <p className="text-2xl font-black text-[var(--color-foreground)]">{correctPlayer.displayName}</p>
                    </Card>
                </motion.div>
            )}

            {/* Vote results */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="w-full max-w-sm"
            >
                <h3 className="text-lg font-black text-[var(--color-muted)] uppercase mb-3 text-center">Results</h3>
                <div className="space-y-2">
                    {reveal.votes.map((vote) => {
                        const voter    = voterMap.get(vote.voterId)
                        const votedFor = voterMap.get(vote.votedForId)
                        return (
                            <div
                                key={vote.id}
                                className={`flex items-center gap-2 p-2 rounded-lg border ${
                                    vote.isCorrect
                                        ? 'border-[var(--color-success)] bg-[var(--color-success-bg)]'
                                        : 'border-[var(--color-danger)]/30 bg-[var(--color-danger-bg)]/30'
                                }`}
                            >
                                <span className="text-sm">{vote.isCorrect ? '✅' : '❌'}</span>
                                <span className="text-sm font-bold text-[var(--color-foreground)]">{voter?.displayName}</span>
                                <span className="text-xs text-[var(--color-subtle)]">→</span>
                                <span className="text-sm text-[var(--color-muted)]">{votedFor?.displayName}</span>
                                {vote.isCorrect && (
                                    <span className="ml-auto text-sm font-bold text-[var(--color-success)]">+100</span>
                                )}
                            </div>
                        )
                    })}
                </div>
            </motion.div>

            {/* Countdown bar */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="w-full max-w-sm"
            >
                <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[var(--color-subtle)] uppercase font-bold">
            {isHost ? 'Next round in…' : 'Waiting for next round…'}
          </span>
                    <span className="text-xs font-black text-[var(--color-accent)]">{countdown}s</span>
                </div>
                <div className="w-full h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-[var(--color-accent)] rounded-full"
                        initial={{ width: '100%' }}
                        animate={{ width: '0%' }}
                        transition={{ duration: REVEAL_SECONDS, ease: 'linear' }}
                    />
                </div>
            </motion.div>
        </div>
    )
}
