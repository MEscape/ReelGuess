'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {COOLDOWN_MS} from "../constants";

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Manages a per-player reaction cooldown.
 *
 * ### Why progress is exposed here, not computed in the consumer
 * `progress` is derived from `msRemaining / COOLDOWN_MS`. `COOLDOWN_MS` is
 * this hook's private constant — exporting it so the consumer can compute the
 * percentage would be a leaky abstraction. The hook owns the full cooldown
 * state; it should also own the derived display value.
 *
 * ### Interval cleanup
 * A cleanup effect clears the interval on unmount. Without it, the interval
 * would continue firing `setMsRemaining` after `ReactionBar` unmounts (e.g.
 * when the reveal phase ends), producing React warnings and a resource leak.
 *
 * @returns
 * - `canReact`     — whether the player may react right now.
 * - `msRemaining`  — milliseconds until cooldown expires (0 when ready).
 * - `progress`     — cooldown progress as a 0–1 fraction (1 = full cooldown,
 *                    0 = ready). Use `progress * 100` for a CSS percentage.
 * - `startCooldown` — call immediately after sending a reaction.
 */
export function useReactionCooldown() {
    const [msRemaining, setMsRemaining] = useState(0)
    const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null)
    const resetAtRef = useRef<number>(0)

    const startCooldown = useCallback(() => {
        resetAtRef.current = Date.now() + COOLDOWN_MS
        setMsRemaining(COOLDOWN_MS)

        if (timerRef.current) clearInterval(timerRef.current)

        timerRef.current = setInterval(() => {
            const remaining = resetAtRef.current - Date.now()
            if (remaining <= 0) {
                clearInterval(timerRef.current!)
                timerRef.current = null
                setMsRemaining(0)
            } else {
                setMsRemaining(remaining)
            }
        }, 100)
    }, [])

    // Clear any active interval on unmount so it cannot fire setMsRemaining
    // after ReactionBar is gone (e.g. reveal phase ends mid-cooldown).
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [])

    const clamped = Math.max(0, msRemaining)

    return {
        canReact:     clamped <= 0,
        msRemaining:  clamped,
        progress:     clamped > 0 ? clamped / COOLDOWN_MS : 0,
        startCooldown,
    }
}
