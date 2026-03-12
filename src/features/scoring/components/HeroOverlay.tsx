'use client'

import { useEffect, useState, useRef, useCallback, startTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Achievement } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type HeroOverlayProps = {
    achievements: Achievement[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatAchievement(a: Achievement): { emoji: string; title: string; subtitle: string } {
    switch (a.type) {
        case 'STREAK_5':
            return {
                emoji:    '🔥',
                title:    `${a.playerName} is on fire!`,
                subtitle: `${a.streak} correct guesses in a row`,
            }
        case 'STREAK_10':
            return {
                emoji:    '💥',
                title:    `${a.playerName} is unstoppable!`,
                subtitle: `${a.streak} streak — ×2.0 multiplier!`,
            }
        case 'FASTEST_VOTE':
            return {
                emoji:    '⚡',
                title:    `${a.playerName} voted fastest!`,
                subtitle: `In ${(a.voteTimeMs / 1000).toFixed(1)}s — speed bonus applied`,
            }
        case 'DOUBLE_SUCCESS':
            return {
                emoji:    '💰',
                title:    `${a.playerName} doubled up!`,
                subtitle: `+${a.pointsEarned} pts — Double-or-Nothing paid off`,
            }
        case 'BIG_POINTS':
            return {
                emoji:    '🚀',
                title:    `${a.playerName} is dominating!`,
                subtitle: `+${a.pointsEarned} pts this round`,
            }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hero overlay that celebrates in-game achievements.
 *
 * - Queues multiple achievements and shows them one at a time.
 * - Each overlay animates in, holds for 2.5 s, then fades out.
 * - Uses Framer Motion for all animations.
 */
export function HeroOverlay({ achievements }: HeroOverlayProps) {
    const [current, setCurrent] = useState<Achievement | null>(null)
    const [visible, setVisible] = useState(false)

    // Queue stored in a ref so dequeue callbacks don't cause cascading renders
    const queueRef    = useRef<Achievement[]>([])
    const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
    const showingRef  = useRef(false)
    // Ref to hold the showNext function for recursive setTimeout calls
    const showNextRef = useRef<() => void>(() => {})

    /** Advance to the next achievement in the queue. */
    const showNext = useCallback(() => {
        const next = queueRef.current.shift()
        if (!next) {
            showingRef.current = false
            return
        }
        showingRef.current = true
        startTransition(() => {
            setCurrent(next)
            setVisible(true)
        })
        timerRef.current = setTimeout(() => {
            startTransition(() => setVisible(false))
            // Wait for exit animation then advance using the stable ref
            timerRef.current = setTimeout(() => showNextRef.current(), 350)
        }, 2800)
    }, []) // No deps — only uses refs and stable setState setters

    // Keep the ref in sync with the stable callback
    useEffect(() => { showNextRef.current = showNext }, [showNext])

    // Enqueue new achievements when the prop changes
    useEffect(() => {
        if (achievements.length === 0) return
        queueRef.current.push(...achievements)
        if (!showingRef.current) showNext()
    }, [achievements, showNext])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [])

    const formatted = current ? formatAchievement(current) : null

    return (
        <AnimatePresence>
            {visible && formatted && current && (
                <motion.div
                    key={current.type + current.playerId}
                    initial={{ opacity: 0, y: -32, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                    style={{
                        position:       'fixed',
                        top:            '1rem',
                        left:           '50%',
                        transform:      'translateX(-50%)',
                        zIndex:         9999,
                        pointerEvents:  'none',
                        width:          'min(calc(100vw - 2rem), 28rem)',
                    }}
                >
                    <div
                        style={{
                            background:   'var(--color-surface)',
                            border:       '2px solid var(--color-accent)',
                            boxShadow:    '6px 6px 0px var(--color-accent), var(--shadow-glow-accent-lg)',
                            padding:      '1rem 1.5rem',
                        }}
                    >
                        <div className="flex items-center gap-4">
                            {/* Emoji badge */}
                            <div
                                style={{
                                    fontSize:   '2.5rem',
                                    lineHeight: 1,
                                    flexShrink: 0,
                                }}
                                aria-hidden
                            >
                                {formatted.emoji}
                            </div>

                            {/* Text */}
                            <div className="min-w-0">
                                <p
                                    className="font-display uppercase truncate"
                                    style={{
                                        fontSize:      'var(--text-title-sm)',
                                        letterSpacing: 'var(--tracking-display)',
                                        color:         'var(--color-accent)',
                                        lineHeight:    1.1,
                                    }}
                                >
                                    {formatted.title}
                                </p>
                                <p
                                    className="font-sans truncate"
                                    style={{
                                        fontSize:  'var(--text-body-sm)',
                                        color:     'var(--color-muted)',
                                        marginTop: '0.2rem',
                                    }}
                                >
                                    {formatted.subtitle}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
