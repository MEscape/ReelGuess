import { type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

// ─────────────────────────────────────────────────────────────────────────────
// LoadingDots
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Inline pending indicator — three pulsing dots.
 * Used inside buttons and inline text areas.
 */
export function LoadingDots({ className }: { className?: string }) {
    return (
        <span
            className={cn('inline-flex items-center gap-1', className)}
            aria-label="Loading"
        >
      {[0, 1, 2].map((i) => (
          <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-current animate-bounce"
              style={{ animationDelay: `${i * 0.12}s` }}
          />
      ))}
    </span>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// PageLoader
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full-screen loading state for Next.js `loading.tsx` files.
 *
 * @example
 * ```tsx
 * // app/(game)/game/[code]/loading.tsx
 * export default function GameLoading() {
 *   return <PageLoader emoji="🎬" label="Loading Game…" />
 * }
 * ```
 */
export function PageLoader({ emoji = '🎬', label = 'Loading…' }: { emoji?: string; label?: string }) {
    return (
        <div className="min-h-dvh flex items-center justify-center">
            <div className="text-center">
                <div className="text-6xl animate-bounce mb-4" role="img" aria-label={label}>{emoji}</div>
                <p className="text-xl font-black text-[var(--color-accent)] uppercase animate-pulse">{label}</p>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// EmptyState
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Centred empty-state block with optional action button.
 *
 * @example
 * ```tsx
 * <EmptyState emoji="📊" title="No scores yet" description="Scores appear after the first round." />
 * ```
 */
export function EmptyState({
                               emoji,
                               title,
                               description,
                               action,
                           }: {
    emoji?: string
    title: string
    description?: string
    action?: ReactNode
}) {
    return (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
            {emoji && <div className="text-5xl">{emoji}</div>}
            <p className="text-[var(--color-muted)] font-bold text-sm uppercase tracking-wide">{title}</p>
            {description && (
                <p className="text-[var(--color-subtle)] text-xs max-w-xs">{description}</p>
            )}
            {action}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// SkeletonBlock
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generic skeleton placeholder rectangle.
 *
 * @example
 * ```tsx
 * <SkeletonBlock className="h-8 w-32" />
 * ```
 */
export function SkeletonBlock({ className }: { className?: string }) {
    return <div className={cn('skeleton', className)} aria-hidden />
}