import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type InputVariant = 'default' | 'code'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
    /**
     * `code` variant renders the lobby-code style: large centred mono characters
     * with wide letter-spacing. @default 'default'
     */
    variant?: InputVariant
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shared text input.
 *
 * Uses the `.input` base class from globals.css for consistent focus ring,
 * border, background and height. The `code` variant is for lobby-code entry.
 *
 * @example
 * ```tsx
 * <Input placeholder="Your name…" maxLength={16} value={name} onChange={…} />
 * <Input variant="code" placeholder="XXXXXX" maxLength={6} />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ variant = 'default', className, ...props }, ref) => (
        <input
            ref={ref}
            className={cn(
                'input',
                variant === 'code' && 'text-center text-3xl font-black tracking-[0.3em] text-[var(--color-accent)] font-mono placeholder:tracking-[0.15em] placeholder:text-xl',
                className,
            )}
            {...props}
        />
    ),
)

Input.displayName = 'Input'