'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { revealRoundAction }                        from '../actions'
import type { RoundReveal }                         from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type UseRevealFlowOptions = {
    /** Called once the reveal data has been loaded and stored. */
    onRevealReady?: (reveal: RoundReveal) => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Loads and holds the reveal data for the current round.
 *
 * Responsibilities:
 * - Calls `revealRoundAction` and stores the result.
 * - Exposes `fetchReveal` for the orchestration hook to call when the
 *   Realtime `round.status → reveal` event fires.
 * - Guards against duplicate fetches for the same round via `fetchedRoundRef`.
 * - Clears reveal state when a new round starts via `clearReveal`.
 *
 * ### Why `onRevealReady` is stored in a ref
 * `fetchReveal` must be stable (it lives in a `useEffect` dep array in the
 * orchestration hook). If `onRevealReady` were in `fetchReveal`'s dep array,
 * any change to the callback identity — even a `useCallback`-wrapped one that
 * changed because *its* deps changed — would produce a new `fetchReveal`,
 * triggering the orchestration effect and potentially re-fetching the reveal.
 * The ref pattern breaks this cycle: `fetchReveal` is unconditionally stable,
 * and the ref always holds the latest callback.
 */
export function useRevealFlow({ onRevealReady }: UseRevealFlowOptions = {}) {
    const [reveal, setReveal]           = useState<RoundReveal | null>(null)
    const [revealError, setRevealError] = useState<string | null>(null)
    const fetchedRoundRef               = useRef<string | null>(null)

    /** Always holds the latest `onRevealReady` without affecting `fetchReveal` stability. */
    const onRevealReadyRef = useRef(onRevealReady)
    useEffect(() => { onRevealReadyRef.current = onRevealReady }, [onRevealReady])

    /**
     * Fetches reveal data for a round. No-ops if the same round was already
     * fetched — safe to call from multiple code paths (Realtime + polling).
     *
     * Stable reference: deps are refs only, so identity never changes.
     */
    const fetchReveal = useCallback(async (roundId: string) => {
        if (fetchedRoundRef.current === roundId) return
        fetchedRoundRef.current = roundId

        const result = await revealRoundAction(roundId)
        if (result.ok) {
            setReveal(result.value)
            setRevealError(null)
            onRevealReadyRef.current?.(result.value)
        } else {
            // Non-fatal: the host timer is the guaranteed delivery path.
            // Log for observability but don't surface to the user.
            console.error('[useRevealFlow] revealRoundAction failed', result.error)
            setRevealError('Failed to load reveal data')
            fetchedRoundRef.current = null // allow retry
        }
    }, []) // stable — only uses refs and stable setState setters

    /** Clears reveal state and the de-dupe guard for the next round. */
    const clearReveal = useCallback(() => {
        setReveal(null)
        setRevealError(null)
        fetchedRoundRef.current = null
    }, [])

    return {
        reveal,
        revealError,
        fetchReveal,
        clearReveal,
    }
}