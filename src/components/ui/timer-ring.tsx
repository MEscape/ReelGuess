import { cn } from '@/lib/utils/cn'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type TimerRingProps = {
    /** Remaining seconds. */
    seconds: number
    /** Total duration in seconds — used to compute arc fill. */
    total:   number
    /** Diameter of the SVG in px. @default 88 */
    size?:   number
    /** Stroke width of the ring. @default 5 */
    strokeWidth?: number
    /**
     * Threshold below which the ring turns red + label shakes.
     * The container also gets an outer glow at this point.
     * @default 5
     */
    urgentAt?: number
    /**
     * Threshold below which the ring is considered critically urgent.
     * At this point the SVG also gets a red drop-shadow filter.
     * @default 3
     */
    criticalAt?: number
    className?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Circular countdown timer.
 *
 * Improvements over previous version:
 *  - `criticalAt` prop adds a second urgency threshold (≤3s by default)
 *    where the SVG gets a red drop-shadow filter — more dramatic than just
 *    a color change.
 *  - Container gets `.timer-ring-container.urgent` class which adds an outer
 *    glow ring in CSS — the whole component pulses red, not just the arc.
 *  - Default size bumped to 88px for better legibility on game screens.
 *  - Stroke width exposed as a prop (game HUD vs scorecard need different weights).
 *  - `timer-shake` keyframe is more aggressive (see globals.css).
 *
 * @example
 * ```tsx
 * // Standard game round timer
 * <TimerRing seconds={timeLeft} total={30} />
 *
 * // Large HUD timer
 * <TimerRing seconds={timeLeft} total={30} size={128} strokeWidth={7} urgentAt={7} />
 *
 * // Compact answer timer
 * <TimerRing seconds={timeLeft} total={15} size={56} strokeWidth={4} />
 * ```
 */
export function TimerRing({
                              seconds,
                              total,
                              size        = 88,
                              strokeWidth = 5,
                              urgentAt    = 5,
                              criticalAt  = 3,
                              className,
                          }: TimerRingProps) {
    const radius  = (size - strokeWidth * 2) / 2
    const circ    = 2 * Math.PI * radius
    const pct     = Math.max(0, Math.min(1, seconds / total))
    const offset  = circ * (1 - pct)

    const isUrgent   = seconds <= urgentAt
    const isCritical = seconds <= criticalAt

    return (
        <div
            className={cn(
                'relative inline-flex items-center justify-center',
                'timer-ring-container',
                isUrgent && 'urgent',
                className,
            )}
            style={{ width: size, height: size }}
            role="timer"
            aria-label={`${seconds} seconds remaining`}
            aria-live={isUrgent ? 'assertive' : 'off'}
        >
            {/* SVG — rotated so arc starts at 12 o'clock */}
            <svg
                width={size}
                height={size}
                style={{
                    transform: 'rotate(-90deg)',
                    // Critical: red drop-shadow on SVG
                    filter: isCritical
                        ? 'drop-shadow(0 0 6px var(--color-danger))'
                        : undefined,
                    transition: 'filter 400ms',
                }}
                aria-hidden
            >
                {/* Background track */}
                <circle
                    className="timer-ring-track"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                />

                {/* Animated arc */}
                <circle
                    className={cn('timer-ring-fill', isUrgent && 'urgent')}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                />
            </svg>

            {/* Centred numeric label */}
            <span
                className={cn('timer-ring-label', isUrgent && 'urgent')}
                style={{
                    // Scale font with ring size
                    fontSize: `${Math.round(size * 0.33)}px`,
                }}
            >
                {seconds}
            </span>
        </div>
    )
}