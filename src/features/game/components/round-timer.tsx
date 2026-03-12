'use client'

import { useState, useEffect, useRef, startTransition } from 'react'
import { motion } from 'framer-motion'
import { TimerRing } from '@/components/ui/timer-ring'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type RoundTimerProps = {
    /** Total seconds for the round. */
    seconds:     number
    /** Whether the timer is actively counting down. */
    isActive:    boolean
    /**
     * When the round started (server timestamp).
     * If provided, the timer resumes at the correct position on page refresh
     * instead of restarting from the full duration.
     */
    startedAt?:  Date
    /** Called once when the timer reaches zero. */
    onComplete?: () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Circular SVG countdown timer.
 *
 * ### Why `onComplete` is in a separate useEffect
 * Calling `onComplete` directly inside a `setRemaining` updater function
 * triggers it **during React's render phase** (updater functions run as part
 * of reconciliation). This causes the "Cannot update a component while
 * rendering a different component" warning because `onComplete` ultimately
 * calls `setGamePhase` / router navigation in a parent.
 *
 * Fix: the interval only sets `remaining` to 0. A dedicated boolean `done`
 * flag is set via `startTransition`, and a separate `useEffect` fires
 * `onComplete` safely **after** the render cycle (commit phase).
 */
export function RoundTimer({ seconds, isActive, startedAt, onComplete }: RoundTimerProps) {
    /** Compute how many whole seconds remain right now. */
    function calcRemaining(): number {
        if (startedAt) {
            const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000
            return Math.max(0, Math.floor(seconds - elapsed))
        }
        return seconds
    }

    const [remaining, setRemaining] = useState(() => calcRemaining())
    // Separate flag — onComplete fires in an Effect, never inside an updater.
    const [done, setDone]       = useState(false)
    const onCompleteRef         = useRef(onComplete)
    useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])

    // Reset when deactivated.
    useEffect(() => {
        if (isActive) return
        startTransition(() => {
            setRemaining(seconds)
            setDone(false)
        })
    }, [isActive, seconds])

    // Run the countdown when active.
    useEffect(() => {
        if (!isActive) return

        const initial = calcRemaining()
        startTransition(() => {
            setRemaining(initial)
            setDone(false)
        })

        if (initial === 0) {
            startTransition(() => setDone(true))
            return
        }

        const interval = setInterval(() => {
            setRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(interval)
                    // Do NOT call onComplete here — this is a setState updater
                    // (runs during render). Schedule the done flag instead.
                    startTransition(() => setDone(true))
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(interval)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActive, seconds, startedAt])

    // Fire onComplete exactly once, after the render cycle (commit phase).
    const firedRef = useRef(false)
    useEffect(() => {
        if (!done) { firedRef.current = false; return }
        if (firedRef.current) return
        firedRef.current = true
        onCompleteRef.current?.()
    }, [done])

    const isUrgent = remaining <= 5

    return (
        <motion.div
            animate={isUrgent && isActive ? { scale: [1, 1.06, 1] } : {}}
            transition={{ duration: 0.4, repeat: isUrgent && isActive ? Infinity : 0, repeatDelay: 0.6 }}
        >
            <TimerRing
                seconds={remaining}
                total={seconds}
                size={72}
                strokeWidth={5}
                urgentAt={5}
                criticalAt={3}
            />
        </motion.div>
    )
}