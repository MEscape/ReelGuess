import { type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ToastVariant = 'accent' | 'success' | 'danger'

type ToastProps = {
    /**
     * Border + shadow colour variant. Maps to `.toast-{variant}` in globals.css.
     * @default 'accent'
     */
    variant?: ToastVariant
    /**
     * Emoji or icon node shown on the left.
     * Rendered inside a fixed-size box to prevent layout shift.
     */
    icon?: ReactNode
    /** Primary notification text — rendered in foreground, bold. */
    message: string
    /**
     * Optional secondary line — rendered in muted color below the message.
     * Use for "+500 points" sub-text after a "Correct!" primary line.
     */
    subtext?: string
    className?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Accent line color map
// ─────────────────────────────────────────────────────────────────────────────

const accentLine: Record<ToastVariant, string> = {
    accent:  'bg-[var(--color-accent)]',
    success: 'bg-[var(--color-success)]',
    danger:  'bg-[var(--color-danger)]',
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Brutalist slide-in notification strip.
 *
 * Improvements over previous version:
 *  - Left accent stripe (3px) replaces border-only variant coloring.
 *    The border is still present but the stripe makes variant immediately
 *    readable at a glance.
 *  - `subtext` prop for "+500 pts" secondary line.
 *  - Icon slot is fixed-width (1.75rem) so text always aligns consistently.
 *  - Message uses body text size — not `text-sm` — for better legibility
 *    in a fixed notification corner.
 *
 * This is a presentational component. Pair with a toast manager
 * (sonner, react-hot-toast) that renders these in a fixed container.
 *
 * @example
 * ```tsx
 * <Toast variant="accent"  icon="🎯" message="Correct!" subtext="+500 points" />
 * <Toast variant="danger"  icon="✕"  message="Wrong answer." subtext="No points scored." />
 * <Toast variant="success" icon="🔥" message="5-streak!" subtext="Multiplier active." />
 * ```
 */
export function Toast({
                          variant = 'accent',
                          icon,
                          message,
                          subtext,
                          className,
                      }: ToastProps) {
    return (
        <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className={cn('toast', `toast-${variant}`, className)}
        >
            {/* Left accent stripe */}
            <span
                className={cn('self-stretch w-[3px] shrink-0 -ml-5 -my-3.5 mr-1', accentLine[variant])}
                aria-hidden
            />

            {/* Icon — fixed width prevents text jump */}
            {icon && (
                <span
                    className="text-xl shrink-0 flex items-center justify-center"
                    style={{ width: '1.75rem' }}
                    aria-hidden
                >
                    {icon}
                </span>
            )}

            {/* Text block */}
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span
                    className="font-display text-[var(--color-foreground)] uppercase truncate"
                    style={{
                        fontSize:      'var(--text-ui)',
                        letterSpacing: 'var(--tracking-display)',
                    }}
                >
                    {message}
                </span>
                {subtext && (
                    <span
                        className="font-sans text-[var(--color-muted)] truncate"
                        style={{ fontSize: 'var(--text-body-sm)' }}
                    >
                        {subtext}
                    </span>
                )}
            </div>
        </div>
    )
}