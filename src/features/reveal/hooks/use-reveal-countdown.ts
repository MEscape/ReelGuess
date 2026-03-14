'use client'

import { useState, useEffect } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type UseRevealCountdownResult = {
    /** Seconds remaining. Starts at `durationSeconds`, counts down to `0`. */
    countdown: number
    /** `true` on the tick that `countdown` reaches `0`. */
    isDone:    boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Countdown timer for the post-reveal phase.
 *
 * Resets automatically when `roundId` changes — no manual reset call needed.
 * Returns `isDone: true` exactly once (on the tick that countdown hits zero)
 * so callers can fire one-shot actions (e.g. `onRevealComplete`) without a
 * separate ref guard.
 *
 * ### Why `roundId` and not a boolean `active` flag
 * Using `roundId` as the reset key means the countdown restarts correctly even
 * if the parent component does not unmount between rounds (e.g. in a single
 * persistent layout). A bare `active` flag would not reset if the new round
 * fires while `active` is already `true`.
 *
 * ### Why not `startTransition`
 * Countdown state updates are urgent — they respond to real-time progression
 * and must not be deferred. `startTransition` was incorrectly used in the
 * previous implementation for what is clearly urgent UI state.
 *
 * @param roundId        - Active round ID. Pass `null` to keep the timer idle.
 * @param durationSeconds - Total countdown length in seconds.
 */
export function useRevealCountdown(
    roundId: string | null,
    durationSeconds: number,
): UseRevealCountdownResult {
    const [countdown, setCountdown] = useState(durationSeconds)
    const [isDone, setIsDone]       = useState(false)

    useEffect(() => {
        if (!roundId) return

        // Reset immediately (urgent — not wrapped in startTransition).
        setCountdown(durationSeconds)
        setIsDone(false)

        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval)
                    setIsDone(true)
                    return 0
                }
                return prev - 1
            })
        }, 1_000)

        return () => clearInterval(interval)
    }, [roundId, durationSeconds])

    return { countdown, isDone }
}