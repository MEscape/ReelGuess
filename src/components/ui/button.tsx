'use client'

import React, { forwardRef, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type ButtonSize    = 'xs' | 'sm' | 'md' | 'lg'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    /**
     * Visual variant — maps to `.btn-{variant}` in globals.css.
     * @default 'primary'
     */
    variant?: ButtonVariant
    /**
     * Height + horizontal padding — maps to `.btn-{size}` in globals.css.
     *  - `xs` → 32px, tight padding. Use for inline table actions, tag removals.
     *  - `sm` → 40px, compact. Use for secondary nav actions, modal footer buttons.
     *  - `md` → 48px, default. Use for primary CTAs.
     *  - `lg` → 60px, hero. Use for lobby Join/Start buttons.
     * @default 'md'
     */
    size?: ButtonSize
    /** Full-width block button. @default false */
    fullWidth?: boolean
    /**
     * Replaces children with <LoadingDots> and disables interaction.
     * Button retains its size so layout doesn't shift.
     * @default false
     */
    loading?: boolean
    children: ReactNode
}

// ─────────────────────────────────────────────────────────────────────────────
// Button
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Brutalist game button.
 *
 * Extends the `.btn` base class from globals.css:
 *  - Ripple on click (DOM-injected span, cleaned up after animation).
 *  - `loading` prop swaps content for <LoadingDots> and disables interaction.
 *  - `xs` size added for dense UI contexts (table actions, tag chips).
 *
 * All hover/active/disabled states live entirely in globals.css.
 *
 * @example
 * ```tsx
 * // Lobby CTA
 * <Button size="lg" fullWidth>▶ Start Game</Button>
 *
 * // Destructive confirm
 * <Button variant="danger" loading={isPending}>Leave Game</Button>
 *
 * // Inline action
 * <Button variant="ghost" size="xs">Edit</Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant   = 'primary',
            size      = 'md',
            fullWidth = false,
            loading   = false,
            className,
            children,
            onClick,
            disabled,
            ...props
        },
        ref,
    ) => {
        const innerRef    = useRef<HTMLButtonElement>(null)
        const resolvedRef = (ref as React.RefObject<HTMLButtonElement>) ?? innerRef

        function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
            spawnRipple(e, resolvedRef.current)
            onClick?.(e)
        }

        return (
            <button
                ref={resolvedRef}
                className={cn(
                    'btn',
                    `btn-${variant}`,
                    `btn-${size}`,
                    fullWidth && 'w-full',
                    className,
                )}
                disabled={disabled || loading}
                onClick={handleClick}
                aria-busy={loading}
                {...props}
            >
                {loading ? <LoadingDots /> : children}
            </button>
        )
    },
)

Button.displayName = 'Button'

// ─────────────────────────────────────────────────────────────────────────────
// Ripple helper
// ─────────────────────────────────────────────────────────────────────────────

function spawnRipple(
    e: React.MouseEvent<HTMLButtonElement>,
    btn: HTMLButtonElement | null,
) {
    if (!btn) return
    const rect     = btn.getBoundingClientRect()
    const diameter = Math.max(rect.width, rect.height)
    const ripple   = document.createElement('span')

    ripple.className = 'ripple'
    ripple.style.cssText = [
        `width:${diameter}px`,
        `height:${diameter}px`,
        `left:${e.clientX - rect.left - diameter / 2}px`,
        `top:${e.clientY  - rect.top  - diameter / 2}px`,
    ].join(';')

    btn.appendChild(ripple)
    setTimeout(() => ripple.remove(), 600)
}

// ─────────────────────────────────────────────────────────────────────────────
// LoadingDots
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Three staggered bouncing dots using `dot-bounce` keyframe from globals.css.
 * Uses `currentColor` so it inherits the button's text color automatically.
 * Exported so other components (form submits, skeleton states) can use it.
 */
export function LoadingDots({ className }: { className?: string }) {
    return (
        <span
            className={cn('inline-flex items-center gap-1', className)}
            aria-label="Loading"
            role="status"
        >
            {([0, 0.12, 0.24] as const).map((delay, i) => (
                <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-current"
                    style={{
                        animation:      'dot-bounce 0.9s ease-in-out infinite',
                        animationDelay: `${delay}s`,
                    }}
                />
            ))}
        </span>
    )
}