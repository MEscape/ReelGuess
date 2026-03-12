import { Button } from '@/components/ui'
import type { AddReelsResult } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ImportDoneProps = Pick<AddReelsResult, 'added' | 'duplicates' | 'total'> & {
    onBack?: () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Success screen after saving reels to the local pool.
 *
 * `ImportDoneLobby` has been removed — lobby import no longer exists.
 * This is the single done state for the standalone import flow.
 */
export function ImportDone({ added, duplicates, total, onBack }: ImportDoneProps) {
    return (
        <div className="flex flex-col items-center gap-0 p-5">

            <div className="w-full card-brutal overflow-hidden">
                <div className="h-[3px] bg-[var(--color-success)]" aria-hidden />

                {/* Title */}
                <div className="flex flex-col items-center gap-3 pt-10 pb-6 px-6 text-center">
                    <h2
                        className="font-display uppercase leading-none text-[var(--color-success)]"
                        style={{
                            fontSize:      'var(--text-title)',
                            letterSpacing: 'var(--tracking-display)',
                            textShadow:    '0 0 20px rgba(34,197,94,0.35)',
                        }}
                    >
                        Saved!
                    </h2>
                    <p
                        className="font-sans text-[var(--color-subtle)] leading-snug"
                        style={{ fontSize: 'var(--text-body-sm)' }}
                    >
                        Your reels have been stored locally
                    </p>
                </div>

                {/* Stats breakdown */}
                <div className="border-t-2 border-[var(--color-border)]">

                    {/* Added */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
                        <span className="input-label" style={{ marginBottom: 0, color: 'var(--color-muted)' }}>
                            New reels added
                        </span>
                        <span
                            className="font-display text-[var(--color-foreground)] tabular-nums"
                            style={{
                                fontSize:      'var(--text-title-sm)',
                                letterSpacing: 'var(--tracking-display)',
                            }}
                        >
                            {added}
                        </span>
                    </div>

                    {/* Duplicates — only shown when present */}
                    {duplicates > 0 && (
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
                            <span className="input-label" style={{ marginBottom: 0, color: 'var(--color-subtle)' }}>
                                Already in pool
                            </span>
                            <span
                                className="font-display text-[var(--color-subtle)] tabular-nums"
                                style={{
                                    fontSize:      'var(--text-title-sm)',
                                    letterSpacing: 'var(--tracking-display)',
                                }}
                            >
                                {duplicates}
                            </span>
                        </div>
                    )}

                    {/* Total — most prominent row */}
                    <div className="flex items-center justify-between px-6 py-4">
                        <span className="input-label" style={{ marginBottom: 0, color: 'var(--color-muted)' }}>
                            Total in pool
                        </span>
                        <span className="badge badge-accent badge-lg font-display tabular-nums">
                            {total}
                        </span>
                    </div>

                </div>
            </div>

            {onBack && (
                <div className="w-full mt-5">
                    <Button size="md" variant="ghost" fullWidth onClick={onBack}>
                        ← Back
                    </Button>
                </div>
            )}

        </div>
    )
}