import { cn } from '@/lib/utils/cn'

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Inline error block displayed below inputs or action buttons.
 *
 * Improvements:
 *  - Accepts `id` prop so Input can link it via `aria-describedby`.
 *  - Uses CSS token for font-size (`--text-body-sm`) instead of `text-sm`.
 *
 * @example
 * ```tsx
 * <ErrorMessage message={error} />
 * <ErrorMessage id="name-error" message="Name already taken." className="mt-2" />
 * ```
 */
export function ErrorMessage({
                                 message,
                                 className,
                                 id,
                             }: {
    message?:   string | null
    className?: string
    id?:        string
}) {
    if (!message) return null

    return (
        <p
            id={id}
            role="alert"
            aria-live="polite"
            className={cn('error-message', className)}
        >
            <span aria-hidden className="shrink-0 font-black">✕</span>
            <span>{message}</span>
        </p>
    )
}