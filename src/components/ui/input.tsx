import { forwardRef, useId, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'
import { ErrorMessage } from './error-message'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type InputVariant = 'default' | 'code'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
    /**
     * `code` — lobby-code style: large centred display font + wide tracking.
     * @default 'default'
     */
    variant?: InputVariant
    /**
     * Renders a visible label above the input.
     * Uses `.input-label` class — display font, uppercase, WCAG-AA contrast.
     */
    label?: string
    /**
     * Optional helper text below the input (suppressed when `error` is set).
     */
    hint?: string
    /**
     * Renders an <ErrorMessage> below the input and applies error border styling.
     */
    error?: string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Brutalist text input.
 *
 * Improvements over previous version:
 *  - Auto-generated `id` links `<label>` to `<input>` for accessibility.
 *  - Label uses `.input-label` (display font, proper contrast) not inline styles.
 *  - Hint text slot — suppressed when error is present to avoid double message.
 *  - Error border is toggled via `.input-error` class (not inline override).
 *  - Code variant uses display font + wide tracking for lobby-join screen.
 *
 * @example
 * ```tsx
 * <Input label="Display Name" placeholder="Enter your name…" maxLength={16} />
 *
 * <Input
 *   variant="code"
 *   label="Lobby Code"
 *   placeholder="XXXXXX"
 *   maxLength={6}
 * />
 *
 * <Input
 *   label="Team Name"
 *   hint="Max 20 characters"
 *   error={errors.teamName}
 * />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            variant  = 'default',
            label,
            hint,
            error,
            className,
            id: idProp,
            ...props
        },
        ref,
    ) => {
        // Auto-generate ID so label[for] always works, even without explicit id prop
        const autoId = useId()
        const id     = idProp ?? autoId

        const inputEl = (
            <input
                ref={ref}
                id={id}
                className={cn(
                    'input',
                    variant === 'code' && 'input-code',
                    error           && 'input-error',
                    className,
                )}
                aria-invalid={!!error}
                aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
                {...props}
            />
        )

        // Bare input — no label, no error
        if (!label && !error && !hint) return inputEl

        return (
            <div className="flex flex-col gap-1.5">
                {label && (
                    <label htmlFor={id} className="input-label">
                        {label}
                    </label>
                )}

                {inputEl}

                {/* Error takes priority over hint */}
                {error ? (
                    <ErrorMessage id={`${id}-error`} message={error} />
                ) : hint ? (
                    <p
                        id={`${id}-hint`}
                        className="text-[var(--color-subtle)] font-sans"
                        style={{ fontSize: 'var(--text-body-sm)' }}
                    >
                        {hint}
                    </p>
                ) : null}
            </div>
        )
    },
)

Input.displayName = 'Input'