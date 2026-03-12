import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type BadgeVariant = 'accent' | 'success' | 'danger' | 'muted' | 'warning' | 'outline'
type BadgeSize    = 'sm' | 'lg'

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
    /**
     * Colour variant — maps to `.badge-{variant}` in globals.css.
     * @default 'muted'
     */
    variant?: BadgeVariant
    /**
     * Visual size — `sm` (default, nav/inline) vs `lg` (card headers, prominent status).
     * @default 'sm'
     */
    size?: BadgeSize
    /**
     * Adds a continuous opacity pulse via `badge-pulse` keyframe.
     * Use exclusively for live/broadcasting states.
     * @default false
     */
    pulse?: boolean
    /**
     * Prepends a status dot before the label text.
     * Inherits dot color from the variant.
     * @default false
     */
    dot?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Dot color map — matches variant semantics
// ─────────────────────────────────────────────────────────────────────────────

const dotColor: Record<BadgeVariant, string> = {
    accent:  'bg-[var(--color-accent-fg)]',
    success: 'bg-[var(--color-success)]',
    danger:  'bg-[var(--color-danger)]',
    warning: 'bg-[var(--color-warning)]',
    muted:   'bg-[var(--color-muted)]',
    outline: 'bg-[var(--color-foreground)]',
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Brutalist status badge.
 *
 * Built on `.badge` from globals.css — display font, all-caps, 2px border.
 * No pill shape ever. Colour variants cover all semantic states.
 *
 * @example
 * ```tsx
 * // Minimal status
 * <Badge variant="accent">Live</Badge>
 *
 * // Card header — larger weight
 * <Badge variant="success" size="lg">Correct ✓</Badge>
 *
 * // Broadcasting indicator with pulse + dot
 * <Badge variant="accent" pulse dot>Broadcasting</Badge>
 *
 * // Muted count chip
 * <Badge variant="muted" size="sm">4 / 8</Badge>
 * ```
 */
export function Badge({
                          variant  = 'muted',
                          size     = 'sm',
                          pulse    = false,
                          dot      = false,
                          className,
                          children,
                          ...props
                      }: BadgeProps) {
    return (
        <span
            className={cn(
                'badge',
                `badge-${variant}`,
                size === 'lg' && 'badge-lg',
                pulse && 'badge-pulse',
                className,
            )}
            {...props}
        >
            {dot && (
                <span
                    className={cn(
                        'inline-block rounded-full shrink-0',
                        size === 'lg' ? 'w-1.5 h-1.5' : 'w-1 h-1',
                        dotColor[variant],
                    )}
                    aria-hidden
                />
            )}
            {children}
        </span>
    )
}