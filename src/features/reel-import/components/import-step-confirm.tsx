import { Button } from '@/components/ui'
import { MAX_REELS } from '../constants'
import { cn }        from '@/lib/utils/cn'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const MAX_PREVIEW = 24

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ImportStepConfirmProps = {
    /** Total reels found in the parsed file. */
    urlCount:   number
    /** Reels already in the local pool (shown in subtitle). */
    localCount: number
    onSubmit:   () => void
    onBack:     () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Step 2 — Confirm & save to local pool.
 *
 * Standalone-only now (lobby import has been removed from this flow).
 * Removed `isLobbyMode`, `isPending`, `error` props — saving to localStorage
 * is synchronous and cannot fail in any user-visible way.
 */
export function ImportStepConfirm({
                                      urlCount,
                                      localCount,
                                      onSubmit,
                                      onBack,
                                  }: ImportStepConfirmProps) {
    const previewCount = Math.min(urlCount, MAX_PREVIEW)
    const overflow     = urlCount - previewCount

    return (
        <div className="flex flex-col gap-4 p-4">

            {/* ── Header ────────────────────────────────────────────────── */}
            <div>
                <h2
                    className="font-display uppercase leading-none text-[var(--color-accent)]"
                    style={{
                        fontSize:      'var(--text-title)',
                        letterSpacing: 'var(--tracking-display)',
                        textShadow:    '0 0 20px rgba(245,200,0,0.3)',
                    }}
                >
                    Ready!
                </h2>
                <p
                    className="font-sans text-[var(--color-subtle)] mt-1.5 leading-relaxed"
                    style={{ fontSize: 'var(--text-body-sm)' }}
                >
                    Found{' '}
                    <strong className="font-semibold text-[var(--color-foreground)]">{urlCount} Reels</strong>
                    {' '}in your file. New ones will be added to your pool ({localCount} already saved).
                    Up to {MAX_REELS} will be randomly selected per game session.
                </p>
            </div>

            {/* ── Preview card ──────────────────────────────────────────── */}
            <div className="card-brutal flex flex-col gap-0">

                {/* Card header */}
                <div className="flex items-center justify-between px-4 py-3 border-b-2 border-[var(--color-border)]">
                    <div className="flex items-center gap-2">
                        <span className="badge badge-accent font-display tabular-nums" style={{ fontSize: 'var(--text-ui)' }}>
                            {urlCount}
                        </span>
                        <span className="input-label" style={{ marginBottom: 0, color: 'var(--color-muted)' }}>
                            Reels found
                        </span>
                    </div>
                    <span
                        className="font-sans text-[var(--color-subtle)]"
                        style={{ fontSize: 'var(--text-body-sm)' }}
                    >
                        {MAX_REELS} used per game
                    </span>
                </div>

                {/* Reel preview grid */}
                <div className="p-3">
                    <div className="grid grid-cols-8 gap-1">
                        {Array.from({ length: previewCount }).map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    'aspect-square flex items-center justify-center text-sm leading-none',
                                    'bg-[var(--color-border)] border border-[var(--color-border-subtle)]',
                                )}
                            >
                                🎬
                            </div>
                        ))}
                        {overflow > 0 && (
                            <div className="aspect-square flex items-center justify-center font-black text-xs border-2 border-dashed border-[var(--color-border-subtle)] text-[var(--color-muted)]">
                                {overflow > 99 ? '99+' : `+${overflow}`}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── CTA ───────────────────────────────────────────────────── */}
            <Button size="lg" fullWidth onClick={onSubmit}>
                💾 Save to my pool
            </Button>

            {/* Back link */}
            <button
                onClick={onBack}
                className="font-sans text-[var(--color-subtle)] text-center hover:text-[var(--color-muted)] transition-colors duration-[var(--duration-fast)]"
                style={{ fontSize: 'var(--text-body-sm)' }}
            >
                ← Upload a different file
            </button>

        </div>
    )
}