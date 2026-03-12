'use client'

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { PlayerAvatar } from '@/features/player/components/PlayerAvatar'
import { EmptyState, Badge, ProgressBar } from '@/components/ui'
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
 * Live and final scoreboard — brutalist redesign.
 *
 * Live mode: compact ranked list with progress bars
 * Final mode: three-column podium + ranked list
 */
export const Scoreboard = memo(function Scoreboard({ scores, isFinal = false }: ScoreboardProps) {
    const sorted = useMemo(
        () => [...scores].sort((a, b) => b.points - a.points),
        [scores],
    )

    const maxPoints = sorted[0]?.points ?? 1

    if (sorted.length === 0) {
        return <EmptyState emoji="📊" title="No scores yet" description="Scores appear after the first round ends." />
    }

    return (
        <div className="w-full space-y-4">

            {/* ── Header ────────────────────────────────────────────── */}
            <div
                className="flex items-center gap-3 px-4 py-3"
                style={{
                    background:  'var(--color-surface)',
                    border:      '2px solid var(--color-border-subtle)',
                    borderLeft:  `4px solid ${isFinal ? 'var(--color-accent)' : 'var(--color-border-strong)'}`,
                    boxShadow:   'var(--shadow-brutal-xs)',
                }}
            >
                <span
                    className="font-display uppercase flex-1"
                    style={{
                        fontSize:      'var(--text-title-sm)',
                        letterSpacing: 'var(--tracking-display)',
                        color:         isFinal ? 'var(--color-accent)' : 'var(--color-foreground)',
                    }}
                >
                    {isFinal ? '🏆 FINAL SCORES' : 'SCOREBOARD'}
                </span>
                <Badge variant="muted" size="sm">
                    {sorted.length} PLAYERS
                </Badge>
            </div>

            {/* ── Podium (final only) ───────────────────────────────── */}
            {isFinal && sorted.length >= 2 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex justify-center items-end gap-2"
                    style={{
                        padding:    '1.5rem 1rem 0',
                        background: 'var(--color-surface)',
                        border:     '2px solid var(--color-border-subtle)',
                        boxShadow:  'var(--shadow-brutal)',
                    }}
                >
                    {/* Render order: 2nd, 1st, 3rd */}
                    {([1, 0, 2] as const).map((idx) => {
                        const entry   = sorted[idx]
                        const podiumHeights = ['5.5rem', '7rem', '4rem'] as const
                        const isFirst = idx === 0

                        if (!entry) return <div key={idx} style={{ width: '5rem' }} />

                        return (
                            <motion.div
                                key={entry.playerId}
                                initial={{ y: 40, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: idx * 0.2, type: 'spring', stiffness: 180, damping: 16 }}
                                className="flex flex-col items-center gap-1.5"
                            >
                                <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{MEDALS[idx]}</span>

                                <div
                                    style={{
                                        padding:   isFirst ? '3px' : '2px',
                                        border:    `2px solid ${isFirst ? 'var(--color-accent)' : 'var(--color-border-strong)'}`,
                                        boxShadow: isFirst ? 'var(--shadow-brutal-accent)' : 'none',
                                    }}
                                >
                                    <PlayerAvatar seed={entry.avatarSeed} size={isFirst ? 52 : 40} />
                                </div>

                                <p
                                    className="font-display uppercase text-center"
                                    style={{
                                        fontSize:      'var(--text-label-sm)',
                                        letterSpacing: 'var(--tracking-display)',
                                        color:         'var(--color-foreground)',
                                        maxWidth:      '5rem',
                                        overflow:      'hidden',
                                        textOverflow:  'ellipsis',
                                        whiteSpace:    'nowrap',
                                    }}
                                >
                                    {entry.displayName}
                                </p>

                                {/* Podium block */}
                                <div
                                    className="flex items-end justify-center w-20 pb-3"
                                    style={{
                                        height:     podiumHeights[idx === 0 ? 0 : idx === 1 ? 2 : 1],
                                        background: isFirst
                                            ? 'rgba(245,200,0,0.12)'
                                            : 'var(--color-surface-raised)',
                                        border:     `2px solid ${isFirst ? 'var(--color-accent)' : 'var(--color-border)'}`,
                                        borderBottom: 'none',
                                    }}
                                >
                                    <span
                                        className="font-display"
                                        style={{
                                            fontSize:      isFirst ? 'var(--text-title-sm)' : 'var(--text-ui)',
                                            letterSpacing: 'var(--tracking-display)',
                                            color:         isFirst ? 'var(--color-accent)' : 'var(--color-muted)',
                                        }}
                                    >
                                        {entry.points}
                                    </span>
                                </div>
                            </motion.div>
                        )
                    })}
                </motion.div>
            )}

            {/* ── Score list ────────────────────────────────────────── */}
            <div
                style={{
                    background: 'var(--color-surface)',
                    border:     '2px solid var(--color-border-subtle)',
                    boxShadow:  'var(--shadow-brutal)',
                    overflow:   'hidden',
                }}
            >
                {sorted.map((entry, idx) => (
                    <motion.div
                        key={entry.playerId}
                        initial={{ x: -16, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.07 }}
                        style={{
                            borderBottom: idx < sorted.length - 1 ? '1px solid var(--color-border)' : 'none',
                            borderLeft:   idx === 0
                                ? '4px solid var(--color-accent)'
                                : idx === 1
                                    ? '4px solid var(--color-muted)'
                                    : '4px solid transparent',
                            padding: '0.75rem 1rem',
                        }}
                    >
                        {/* Top row: rank + avatar + name + streak + points */}
                        <div className="flex items-center gap-3">
                            <span
                                className="font-display shrink-0 tabular-nums"
                                style={{
                                    fontSize:  'var(--text-label-sm)',
                                    color:     'var(--color-subtle)',
                                    width:     '1.5rem',
                                    textAlign: 'center',
                                }}
                            >
                                {idx < 3 ? MEDALS[idx] : idx + 1}
                            </span>

                            <PlayerAvatar seed={entry.avatarSeed} size={36} />

                            <div className="flex-1 min-w-0">
                                <p
                                    className="font-display uppercase truncate"
                                    style={{
                                        fontSize:      'var(--text-ui)',
                                        letterSpacing: 'var(--tracking-display)',
                                        color:         'var(--color-foreground)',
                                        lineHeight:    1.1,
                                    }}
                                >
                                    {entry.displayName}
                                </p>
                                {entry.streak >= 2 && (
                                    <p
                                        className="font-display"
                                        style={{
                                            fontSize:      'var(--text-label-xs)',
                                            letterSpacing: 'var(--tracking-display)',
                                            color:         'var(--color-warning)',
                                            lineHeight:    1.2,
                                        }}
                                    >
                                        🔥 {entry.streak}× STREAK
                                    </p>
                                )}
                            </div>

                            <span
                                className="font-display tabular-nums shrink-0"
                                style={{
                                    fontSize:      'var(--text-title-sm)',
                                    letterSpacing: 'var(--tracking-display)',
                                    color:         idx === 0
                                        ? 'var(--color-accent)'
                                        : 'var(--color-foreground)',
                                    lineHeight: 1,
                                }}
                            >
                                {entry.points}
                            </span>
                        </div>

                        {/* Progress bar relative to leader */}
                        <div className="mt-2 pl-9">
                            <ProgressBar
                                value={entry.points}
                                max={maxPoints}
                                variant={idx === 0 ? 'default' : 'default'}
                                className="opacity-40"
                            />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
})