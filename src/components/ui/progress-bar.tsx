'use client'

import { useEffect, useRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ProgressVariant = 'default' | 'danger' | 'success'

type ProgressBarProps = {
    /** Current value (0 → max). */
    value:    number
    /** Maximum value. @default 100 */
    max?:     number
    /**
     * Colour variant:
     *  - `default` → accent yellow
     *  - `danger`  → red (health low, time running out)
     *  - `success` → green (correct answers, completed)
     * @default 'default'
     */
    variant?: ProgressVariant
    /**
     * Displays the percentage value as text to the right of the bar.
     * Useful on score screens where the raw number matters.
     * @default false
     */
    showValue?: boolean
    className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Brutalist progress bar.
 *
 * Improvements over previous version:
 *  - Shine animation (`is-updating` class) only fires when `value` changes,
 *    not on every render. Previous version ran the shine on a loop at all times.
 *  - Track is 10px tall (was 8px) — more visible on dark bg.
 *  - Optional `showValue` renders a percentage label to the right.
 *
 * @example
 * ```tsx
 * // Default — score/time bar
 * <ProgressBar value={72} />
 *
 * // Health low
 * <ProgressBar value={15} variant="danger" showValue />
 *
 * // Score vs max
 * <ProgressBar value={score} max={maxScore} variant="success" />
 * ```
 */
export function ProgressBar({
                                value,
                                max     = 100,
                                variant = 'default',
                                showValue = false,
                                className,
                                ...props
                            }: ProgressBarProps) {
    const pct     = Math.min(100, Math.max(0, (value / max) * 100))
    const fillRef = useRef<HTMLDivElement>(null)
    const prevRef = useRef<number>(pct)

    // Trigger shine class when value changes
    useEffect(() => {
        if (pct === prevRef.current) return
        prevRef.current = pct

        const fill = fillRef.current
        if (!fill) return

        fill.classList.remove('is-updating')
        // Force reflow so the animation restarts
        void fill.offsetWidth
        fill.classList.add('is-updating')

        const timer = setTimeout(() => fill.classList.remove('is-updating'), 700)
        return () => clearTimeout(timer)
    }, [pct])

    return (
        <div
            className={cn('flex items-center gap-3', className)}
            {...props}
        >
            <div
                className={cn(
                    'progress-track flex-1',
                    variant !== 'default' && variant,
                )}
                role="progressbar"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={max}
            >
                <div
                    ref={fillRef}
                    className="progress-fill"
                    style={{ width: `${pct}%` }}
                />
            </div>

            {showValue && (
                <span
                    className="font-display shrink-0 tabular-nums"
                    style={{
                        fontSize:      'var(--text-label-sm)',
                        letterSpacing: 'var(--tracking-label)',
                        color:         'var(--color-muted)',
                        minWidth:      '2.5rem',
                        textAlign:     'right',
                    }}
                >
                    {Math.round(pct)}%
                </span>
            )}
        </div>
    )
}