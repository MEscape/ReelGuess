import { type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type CardVariant = 'default' | 'brutal' | 'accent' | 'interactive'

type CardProps = HTMLAttributes<HTMLDivElement> & {
    /**
     * Visual variant:
     *  - `default`     → 1px border, no shadow. Use for nested/subtle containers.
     *  - `brutal`      → 2px border + offset shadow. Standard game card.
     *  - `accent`      → 3px yellow border + accent shadow + glow. Featured state.
     *  - `interactive` → `brutal` + full lift/stamp lifecycle. Clickable cards.
     * @default 'brutal'
     */
    variant?: CardVariant
    /**
     * Renders a 3px accent stripe across the top edge.
     * Use on featured or active-round cards.
     */
    stripe?: boolean
    children: ReactNode
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Brutalist card container.
 *
 * Carries NO padding — callers add `className="p-4"` etc.
 * All variants are defined in globals.css; hover/active live purely in CSS.
 *
 * The `stripe` prop adds a top accent stripe without switching to the full
 * `accent` variant — useful when you want structural emphasis without the
 * yellow border on all four sides.
 *
 * @example
 * ```tsx
 * // Standard game card
 * <Card variant="brutal" className="p-5">…</Card>
 *
 * // Featured / currently active round
 * <Card variant="accent" stripe className="p-4">…</Card>
 *
 * // Clickable answer option
 * <Card variant="interactive" className="p-4" onClick={handlePick}>
 *   Option A
 * </Card>
 *
 * // Subtle nested container
 * <Card variant="default" className="p-3">…</Card>
 * ```
 */
export function Card({
                         variant = 'brutal',
                         stripe  = false,
                         className,
                         children,
                         ...props
                     }: CardProps) {
    return (
        <div
            className={cn(
                // Variant class maps to globals.css
                variant === 'default'     && 'card',
                variant === 'brutal'      && 'card-brutal',
                variant === 'accent'      && 'card-accent',
                variant === 'interactive' && 'card-interactive',
                'relative', // needed for stripe pseudo-child
                className,
            )}
            {...props}
        >
            {stripe && (
                <span className="game-card-stripe" aria-hidden />
            )}
            {children}
        </div>
    )
}