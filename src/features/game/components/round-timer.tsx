'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion }    from 'framer-motion'
import { TimerRing } from '@/components/ui'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type RoundTimerProps = {
    /** Total seconds for the round. */
    seconds:    number
    /** Whether the timer is actively counting down. */
    isActive:   boolean
    /**
     * Server timestamp of when the round started.
     * When provided the timer resumes at the correct elapsed position on
     * page refresh instead of restarting from the full duration.
     */
    startedAt?: Date
    /** Called exactly once when the countdown reaches zero. */
    onComplete?: () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Circular SVG countdown timer with urgency animation.
 *
 * ### Why `onComplete` fires in a dedicated effect (not inside the interval)
 * Calling `onComplete` inside a `setRemaining` state updater runs during
 * React's render phase, causing "Cannot update a component while rendering
 * a different component". The fix: the interval sets a `done` flag, and a
 * separate effect fires `onComplete` after the commit phase — exactly once,
 * guarded by `firedRef`.
 *
 * ### Why `startTransition` is not used here
 * All state updates in this component are urgent UI corrections:
 * - Resetting `remaining` to `seconds` when inactive must show immediately —
 *   a deferred reset shows the wrong (stale) timer value to the user.
 * - Seeding the initial `remaining` from `calcRemaining()` must apply before
 *   the first frame — deferring it causes a flash of the wrong duration.
 * - Setting `done = true` when the interval reaches zero must not be deferred —
 *   the user sees the timer stuck at 0 if it is.
 * `startTransition` is reserved for genuinely non-urgent background updates
 * and is explicitly not appropriate for any of the above.
 *
 * ### Why `calcRemaining` is in a `useCallback`
 * Defined as a `useCallback` with `[seconds, startedAt]` deps so effects that
 * call it always see the current values. A plain function in the component body
 * creates a new reference on every render, causing stale captures in effects.
 */
export function RoundTimer({ seconds, isActive, startedAt, onComplete }: RoundTimerProps) {
    /** Returns how many whole seconds remain relative to now. */
    const calcRemaining = useCallback((): number => {
        if (startedAt) {
            const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000
            return Math.max(0, Math.floor(seconds - elapsed))
        }
        return seconds
    }, [seconds, startedAt])

    const [remaining, setRemaining] = useState(() => calcRemaining())
    /**
     * Separate boolean flag — onComplete must never fire inside a setState
     * updater (render phase). Set this true and let the effect below handle it.
     */
    const [done, setDone] = useState(false)

    /** Keeps onComplete stable without re-subscribing the effect. */
    const onCompleteRef = useRef(onComplete)
    useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])

    /** Guards against firing onComplete more than once per countdown. */
    const firedRef = useRef(false)

    // Reset to full duration when the timer is deactivated (phase change).
    useEffect(() => {
        if (isActive) return
        setRemaining(seconds)
        setDone(false)
    }, [isActive, seconds])

    // Run the countdown while active.
    useEffect(() => {
        if (!isActive) return

        const initial = calcRemaining()
        setRemaining(initial)
        setDone(false)

        // Already at zero on mount (e.g. page refreshed after timer expired).
        if (initial === 0) {
            setDone(true)
            return
        }

        const interval = setInterval(() => {
            setRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(interval)
                    // Schedule done flag — never call onComplete inside a setter.
                    // The effect below handles the actual callback after commit.
                    setDone(true)
                    return 0
                }
                return prev - 1
            })
        }, 1_000)

        return () => clearInterval(interval)
    }, [isActive, calcRemaining])

    // Fire onComplete once, safely after the render cycle completes.
    useEffect(() => {
        if (!done) { firedRef.current = false; return }
        if (firedRef.current) return
        firedRef.current = true
        onCompleteRef.current?.()
    }, [done])

    const isUrgent = remaining <= 5 && isActive

    return (
        <motion.div
            animate={isUrgent ? { scale: [1, 1.06, 1] } : {}}
            transition={{ duration: 0.4, repeat: isUrgent ? Infinity : 0, repeatDelay: 0.6 }}
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