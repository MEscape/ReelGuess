import { cn } from '@/lib/utils/cn'

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Inline error message displayed below forms or action buttons.
 *
 * Renders nothing when `message` is null/undefined — safe to always render.
 *
 * @example
 * ```tsx
 * <ErrorMessage message={error} />
 * ```
 */
export function ErrorMessage({ message, className }: { message?: string | null; className?: string }) {
    if (!message) return null
    return (
        <p
            role="alert"
            className={cn('text-[var(--color-danger)] text-sm font-bold text-center', className)}
        >
            {message}
        </p>
    )
}