'use client'

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize    = 'sm' | 'md' | 'lg'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    /** Visual variant — maps to .btn-{variant} colour class. @default 'primary' */
    variant?: ButtonVariant
    /** Height + padding size. @default 'md' */
    size?: ButtonSize
    /** Full-width block button. @default false */
    fullWidth?: boolean
    children: ReactNode
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shared brutal button.
 *
 * Replaces all inline Tailwind button strings across the codebase. Every
 * interactive state (hover lift, active press, disabled) is handled by the
 * `.btn` base class in globals.css — no extra props needed.
 *
 * @example
 * ```tsx
 * <Button size="lg" fullWidth onClick={handleStart} disabled={isPending}>
 *   {isPending ? '⏳ STARTING...' : '▶️ START GAME'}
 * </Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = 'primary', size = 'md', fullWidth = false, className, children, ...props }, ref) => (
        <button
            ref={ref}
            className={cn(
                'btn',
                `btn-${variant}`,
                `btn-${size}`,
                fullWidth && 'w-full',
                className,
            )}
            {...props}
        >
            {children}
        </button>
    ),
)

Button.displayName = 'Button'
