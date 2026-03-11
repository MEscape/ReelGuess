'use client'

import { memo, useMemo } from 'react'
import { motion }        from 'framer-motion'
import { PlayerAvatar }  from '@/features/player/components/PlayerAvatar'
import { EmptyState }    from '@/components/ui'
import type { ScoreEntry } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const MEDALS = ['🥇', '🥈', '🥉'] as const

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ScoreboardProps = {
    scores:   ScoreEntry[]
    isFinal?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Live and final scoreboard.
 *
 * - `sorted` is memoized — only recalculated when `scores` reference changes.
 * - In final mode renders a three-column podium before the full list.
 * - Wrapped in `memo` to prevent re-renders on unrelated parent state changes.
 */
export const Scoreboard = memo(function Scoreboard({ scores, isFinal = false }: ScoreboardProps) {
    const sorted = useMemo(
        () => [...scores].sort((a, b) => b.points - a.points),
        [scores],
    )

    if (sorted.length === 0) {
        return <EmptyState emoji="📊" title="No scores yet" />
    }

    return (
        <div className="w-full">
            <h2 className="text-xl font-black uppercase text-center text-[var(--color-accent)] mb-3 tracking-tight">
                {isFinal ? '🏆 FINAL SCORES' : '📊 SCOREBOARD'}
            </h2>

            {/* Podium — final only */}
            {isFinal && (
                <div className="flex justify-center items-end gap-3 mb-6">
                    {([1, 0, 2] as const).map((idx) => {
                        const entry   = sorted[idx]
                        const heights = ['h-28', 'h-20', 'h-14'] as const
                        if (!entry) return <div key={idx} className="w-20" />
                        return (
                            <motion.div
                                key={entry.playerId}
                                initial={{ y: 40, opacity: 0 }}
                                animate={{ y: 0,  opacity: 1 }}
                                transition={{ delay: idx * 0.25, type: 'spring', stiffness: 200 }}
                                className="flex flex-col items-center gap-1"
                            >
                                <span className="text-2xl">{MEDALS[idx]}</span>
                                <PlayerAvatar seed={entry.avatarSeed} size={44} />
                                <p className="text-xs font-bold text-[var(--color-foreground)] truncate max-w-[72px] text-center">
                                    {entry.displayName}
                                </p>
                                <div className={`w-20 ${heights[idx]} bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 rounded-t-lg flex items-end justify-center pb-2`}>
                                    <span className="text-base font-black text-[var(--color-accent)]">{entry.points}</span>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            )}

            {/* Score list */}
            <div className="flex flex-col gap-1.5">
                {sorted.map((entry, idx) => (
                    <motion.div
                        key={entry.playerId}
                        initial={{ x: -16, opacity: 0 }}
                        animate={{ x: 0,    opacity: 1 }}
                        transition={{ delay: idx * 0.07 }}
                        className="flex items-center gap-3 px-3 py-2.5 card shadow-brutal-sm"
                    >
            <span className="text-base font-black text-[var(--color-faint)] w-5 text-center shrink-0">
              {idx < 3 ? MEDALS[idx] : idx + 1}
            </span>
                        <PlayerAvatar seed={entry.avatarSeed} size={32} />
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-[var(--color-foreground)] text-sm truncate leading-tight">
                                {entry.displayName}
                            </p>
                            {entry.streak >= 2 && (
                                <p className="text-xs text-[var(--color-warning)] font-bold leading-tight">
                                    🔥 {entry.streak}× streak
                                </p>
                            )}
                        </div>
                        <span className="text-base font-black text-[var(--color-accent)] tabular-nums shrink-0">
              {entry.points}
            </span>
                    </motion.div>
                ))}
            </div>
        </div>
    )
})
