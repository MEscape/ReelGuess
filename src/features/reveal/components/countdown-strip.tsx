'use client'

import { useEffect, useRef }        from 'react'
import { motion }                   from 'framer-motion'
import { ProgressBar }              from '@/components/ui'
import { useRevealCountdown }       from '../hooks/use-reveal-countdown'
import { REVEAL_SECONDS }           from '../constants'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type CountdownStripProps = {
    /** Active round ID — passed to `useRevealCountdown` as the reset key. */
    roundId:          string
    /** Whether the current user is the host. Only the host fires `onComplete`. */
    isHost:           boolean
    /**
     * Called once when the countdown reaches zero (host only).
     * Must be stable — wrap in `useCallback` at the call site.
     */
    onComplete:       () => Promise<void>
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Post-reveal countdown strip with a progress bar.
 *
 * Owns `useRevealCountdown` so that per-second re-renders are isolated to
 * this component and do not bubble up to `RevealScreen` or its siblings.
 *
 * Only the host triggers `onComplete` — guests wait for the Realtime event
 * on `lobbies.status` or `rounds.status`.
 *
 * `onComplete` is called with error handling. If it rejects, the error is
 * logged but not surfaced to the user — the host's orchestration layer is
 * responsible for retry / recovery.
 */
export function CountdownStrip({ roundId, isHost, onComplete }: CountdownStripProps) {
    const { countdown, isDone } = useRevealCountdown(roundId, REVEAL_SECONDS)
    const firedRef              = useRef(false)

    useEffect(() => {
        // Reset the guard when the round changes so a new countdown can fire.
        firedRef.current = false
    }, [roundId])

    useEffect(() => {
        if (!isDone || !isHost || firedRef.current) return
        firedRef.current = true
        onComplete().catch((err) => {
            console.error('[CountdownStrip] onComplete failed', err)
        })
    }, [isDone, isHost, onComplete])

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            style={{
                background: 'var(--color-surface)',
                border:     '2px solid var(--color-border-subtle)',
                padding:    '0.75rem 1rem',
            }}
        >
            <div className="flex items-center justify-between mb-2">
                <span
                    className="font-display uppercase"
                    style={{
                        fontSize:      'var(--text-label-sm)',
                        letterSpacing: 'var(--tracking-label)',
                        color:         'var(--color-muted)',
                    }}
                >
                    {isHost ? 'NEXT ROUND IN' : 'WAITING FOR HOST'}
                </span>
                <span
                    className="font-display"
                    style={{
                        fontSize:      'var(--text-title-sm)',
                        letterSpacing: 'var(--tracking-display)',
                        color:         'var(--color-accent)',
                    }}
                >
                    {countdown}s
                </span>
            </div>
            <ProgressBar value={countdown} max={REVEAL_SECONDS} variant="default" />
        </motion.div>
    )
}