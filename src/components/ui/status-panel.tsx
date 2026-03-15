import { type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type StatusValue = 'live' | 'idle' | 'warn' | 'danger'

type StatusPanelProps = {
    /**
     * Controls dot color + animation:
     *  - `live`   → green pulsing  (round in progress)
     *  - `idle`   → muted static   (waiting)
     *  - `warn`   → orange fast    (low time / warning)
     *  - `danger` → red rapid      (critical — last seconds)
     */
    status:    StatusValue
    /** Label string shown in muted color. */
    label:     string
    /**
     * Optional value rendered in foreground color with display font.
     * Use for "3/5", "0:07", "4 players" etc.
     */
    children?: ReactNode
    className?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compact status strip — pulsing dot + label + optional bold value.
 *
 * Improvements over previous version:
 *  - `danger` status added for critical states (last 3 seconds, etc.).
 *  - Value text now uses display font (`font-display`) for visual weight.
 *  - Label + value spacing is more consistent (gap-2 between all elements).
 *  - Component width is `min-content` by default — doesn't stretch to fill.
 *
 * @example
 * ```tsx
 * <StatusPanel status="live"   label="Round">3 / 5</StatusPanel>
 * <StatusPanel status="idle"   label="Players">4 / 8</StatusPanel>
 * <StatusPanel status="warn"   label="Time">0:07</StatusPanel>
 * <StatusPanel status="danger" label="Time">0:02</StatusPanel>
 * // No children — label only
 * <StatusPanel status="live" label="Broadcasting" />
 * ```
 */
export function StatusPanel({ status, label, children, className }: StatusPanelProps) {
    return (
        <div className={cn('stat-chip', className)}>
            {/* Pulsing status dot */}
            <span
                className={cn('status-dot', `status-dot-${status}`)}
                aria-hidden
            />

            {/* Label — muted, smaller */}
            <span
                className="text-[var(--color-muted)] font-sans truncate max-w-[6rem] sm:max-w-none"
                style={{ fontSize: 'var(--text-label-sm)' }}
            >
                {label}
            </span>

            {/* Value — foreground, display font, bold */}
            {children && (
                <>
                    <span
                        className="mx-0.5 text-[var(--color-border-strong)]"
                        aria-hidden
                    >
                        /
                    </span>
                    <span
                        className="font-display text-[var(--color-foreground)]"
                        style={{
                            fontSize:      'var(--text-label-sm)',
                            letterSpacing: 'var(--tracking-display)',
                        }}
                    >
                        {children}
                    </span>
                </>
            )}
        </div>
    )
}
