import { type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type CardVariant = 'default' | 'brutal' | 'accent'

type CardProps = HTMLAttributes<HTMLDivElement> & {
    /** Visual variant. @default 'default' */
    variant?: CardVariant
    children: ReactNode
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shared card container.
 *
 * Maps to `.card`, `.card-brutal`, or `.card-accent` from globals.css.
 * Pass `className` for extra padding or spacing — the component itself
 * carries no padding so callers stay in control.
 *
 * @example
 * ```tsx
 * <Card variant="brutal" className="p-4">…content…</Card>
 * ```
 */
export function Card({ variant = 'default', className, children, ...props }: CardProps) {
    const variantClass: Record<CardVariant, string> = {
        default: 'card',
        brutal:  'card-brutal',
        accent:  'card-accent',
    }

    return (
        <div className={cn(variantClass[variant], className)} {...props}>
            {children}
        </div>
    )
}