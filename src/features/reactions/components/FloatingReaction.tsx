'use client'

import { useEffect, useRef } from 'react'
import { motion }            from 'framer-motion'
import type { Reaction }     from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type FloatingReactionProps = {
    reaction:   Reaction
    onComplete: (id: string) => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Total animation duration in seconds. */
const DURATION = 2.2
/** Extra buffer (ms) to ensure the animation fully completes before removal. */
const CLEANUP_BUFFER_MS = 100

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A single emoji that spawns at the bottom of the screen, floats up, and fades
 * out. Removed from the DOM once the animation completes.
 *
 * Horizontal position is randomised deterministically from the reaction ID so
 * multiple simultaneous reactions spread across the screen.
 */
export function FloatingReaction({ reaction, onComplete }: FloatingReactionProps) {
    const completedRef = useRef(false)

    // Deterministic horizontal offset from the reaction ID (0 → 100 % of width)
    const seed = reaction.id
        .split('')
        .reduce((acc, c) => acc + c.charCodeAt(0), 0)
    const leftPercent = 10 + (seed % 80) // 10 % … 90 %

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!completedRef.current) {
                completedRef.current = true
                onComplete(reaction.id)
            }
        }, DURATION * 1000 + CLEANUP_BUFFER_MS)

        return () => clearTimeout(timer)
    }, [reaction.id, onComplete])

    return (
        <motion.div
            aria-hidden
            initial={{ opacity: 1, y: 0,    scale: 0.6 }}
            animate={{ opacity: 0, y: -260, scale: 1.4 }}
            transition={{
                duration: DURATION,
                ease:     [0.22, 1, 0.36, 1],
            }}
            style={{
                position:    'fixed',
                bottom:      '7rem',
                left:        `${leftPercent}%`,
                fontSize:    '2.2rem',
                lineHeight:  1,
                pointerEvents: 'none',
                userSelect:  'none',
                zIndex:      50,
            }}
        >
            {reaction.emoji}
        </motion.div>
    )
}
