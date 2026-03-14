'use client'

import { useEffect, useMemo } from 'react'
import { motion }             from 'framer-motion'
import type { Reaction }      from '../types'
import {CLEANUP_BUFFER_MS, DURATION} from "../constants";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type FloatingReactionProps = {
    reaction:   Reaction
    onComplete: (id: string) => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A single emoji that spawns at the bottom of the screen, floats up, and fades
 * out. Removed from the DOM once the animation completes via `onComplete`.
 *
 * ### Horizontal position
 * Randomised deterministically from the reaction ID so multiple simultaneous
 * reactions spread across the screen. Computed once with `useMemo` — no array
 * allocation on re-render.
 *
 * ### Why no completedRef
 * The previous implementation guarded `onComplete` with a `completedRef` to
 * prevent double-calls. This guard was dead code — a single `setTimeout`
 * cannot fire twice, and the effect cleanup (`clearTimeout`) already prevents
 * it from firing after unmount. Removing it makes the intent clear.
 */
export function FloatingReaction({ reaction, onComplete }: FloatingReactionProps) {
    // Deterministic horizontal offset from the reaction ID (10 % … 90 % of width).
    // Uses a charCodeAt loop to avoid the .split('') array allocation of the
    // previous implementation.
    const leftPercent = useMemo(() => {
        let seed = 0
        for (let i = 0; i < reaction.id.length; i++) {
            seed += reaction.id.charCodeAt(i)
        }
        return 10 + (seed % 80)
    }, [reaction.id])

    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete(reaction.id)
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
                position:      'fixed',
                bottom:        '7rem',
                left:          `${leftPercent}%`,
                fontSize:      '2.2rem',
                lineHeight:    1,
                pointerEvents: 'none',
                userSelect:    'none',
                zIndex:        50,
            }}
        >
            {reaction.emoji}
        </motion.div>
    )
}