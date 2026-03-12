import { type CSSProperties, type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

// ─────────────────────────────────────────────────────────────────────────────
// PageLoader
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full-screen loading state — used in Next.js `loading.tsx` files.
 *
 * Emoji bounces via `brutal-bounce` keyframe.
 * Label pulses via `brutal-pulse` keyframe.
 * Both defined in globals.css `@layer base`.
 *
 * @example
 * ```tsx
 * // app/(game)/game/[code]/loading.tsx
 * export default function GameLoading() {
 *   return <PageLoader emoji="🎬" label="Loading Game…" />
 * }
 * ```
 */
export function PageLoader({
                               emoji = '🎬',
                               label = 'Loading…',
                           }: {
    emoji?: string
    label?: string
}) {
    return (
        <div className="min-h-dvh flex items-center justify-center bg-[var(--color-background)]">
            <div className="flex flex-col items-center gap-4">
                <span
                    className="block text-6xl leading-none page-loader-emoji"
                    role="img"
                    aria-label={label}
                />
                {/* Render emoji separately to avoid role="img" on text node */}
                <span className="text-6xl leading-none" aria-hidden>
                    {emoji}
                </span>
                <p className="page-loader-label">{label}</p>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// EmptyState
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Centred empty-state with optional CTA.
 *
 * Improvements:
 *  - Title uses `--text-title-sm` for more presence on dark bg.
 *  - Description uses body-sm token, not `text-xs` (too small to read).
 *  - Max-width on description increased from 280px → 320px.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   emoji="📊"
 *   title="No scores yet"
 *   description="Scores appear after the first round ends."
 *   action={<Button size="sm" variant="ghost">Refresh</Button>}
 * />
 * ```
 */
export function EmptyState({
                               emoji,
                               title,
                               description,
                               action,
                           }: {
    emoji?:       string
    title:        string
    description?: string
    action?:      ReactNode
}) {
    return (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
            {emoji && (
                <span className="text-5xl leading-none" aria-hidden>
                    {emoji}
                </span>
            )}

            <p
                className="font-display uppercase text-[var(--color-muted)]"
                style={{
                    fontSize:      'var(--text-title-sm)',
                    letterSpacing: 'var(--tracking-loose)',
                }}
            >
                {title}
            </p>

            {description && (
                <p
                    className="font-sans text-[var(--color-subtle)] max-w-[320px] leading-relaxed"
                    style={{ fontSize: 'var(--text-body-sm)' }}
                >
                    {description}
                </p>
            )}

            {action}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// SkeletonBlock
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generic skeleton placeholder — uses `.skeleton` from globals.css.
 *
 * `.skeleton` renders surface-raised bg + sweeping shimmer overlay.
 * No border-radius (brutalist).
 *
 * @example
 * ```tsx
 * <SkeletonBlock className="h-8 w-32" />
 * <SkeletonBlock className="h-24 w-full" />
 *
 * // Simulate a player row
 * <div className="flex items-center gap-3 p-3">
 *   <SkeletonBlock className="w-8 h-8" />
 *   <SkeletonBlock className="h-4 w-32" />
 *   <SkeletonBlock className="h-4 w-16 ml-auto" />
 * </div>
 * ```
 */
export function SkeletonBlock({ className, style }: { className?: string; style?: CSSProperties }) {
    return (
        <div
            className={cn('skeleton', className)}
            style={style}
            aria-hidden
        />
    )
}