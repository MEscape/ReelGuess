'use client'

import { useState, useEffect } from 'react'
import { motion }              from 'framer-motion'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type RoundTimerProps = {
    /** Total seconds for the round. */
    seconds:    number
    /** Whether the timer is actively counting down. */
    isActive:   boolean
    /** Called once when the timer reaches zero. */
    onComplete?: () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Circular SVG countdown timer.
 *
 * - Turns red and pulses in the last 5 seconds.
 * - Resets when `isActive` toggles off (e.g. between rounds).
 * - `onComplete` fires exactly once via `clearInterval` guard.
 */
export function RoundTimer({ seconds, isActive, onComplete }: RoundTimerProps) {
    const [remaining, setRemaining] = useState(seconds)

    useEffect(() => {
        if (!isActive) { setRemaining(seconds); return }

        const interval = setInterval(() => {
            setRemaining((prev) => {
                if (prev <= 1) { clearInterval(interval); onComplete?.(); return 0 }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [isActive, seconds, onComplete])

    const percentage = (remaining / seconds) * 100
    const isUrgent   = remaining <= 5

    return (
        <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36" aria-label={`${remaining} seconds remaining`}>
                {/* Track */}
                <path
                    className="text-[var(--color-border)]"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="currentColor" strokeWidth="3"
                />
                {/* Progress */}
                <motion.path
                    style={{ color: isUrgent ? 'var(--color-danger)' : 'var(--color-accent)' }}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="currentColor" strokeWidth="3"
                    strokeDasharray={`${percentage}, 100`}
                    animate={{ strokeDasharray: `${percentage}, 100` }}
                    transition={{ duration: 0.5 }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
        <span
            className={`text-xl font-black ${isUrgent ? 'text-[var(--color-danger)] animate-pulse' : 'text-[var(--color-foreground)]'}`}
        >
          {remaining}
        </span>
            </div>
        </div>
    )
}
