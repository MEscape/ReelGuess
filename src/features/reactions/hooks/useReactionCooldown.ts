'use client'

import { useState, useRef, useCallback } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Milliseconds a player must wait between reactions. */
export const COOLDOWN_MS = 1500

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Manages a per-player reaction cooldown.
 *
 * Returns:
 * - `canReact`   — whether the player is allowed to react right now.
 * - `msRemaining` — milliseconds until the cooldown expires (0 when ready).
 * - `startCooldown` — call this immediately after sending a reaction.
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

    return {
        canReact:     msRemaining <= 0,
        msRemaining:  Math.max(0, msRemaining),
        startCooldown,
    }
}
