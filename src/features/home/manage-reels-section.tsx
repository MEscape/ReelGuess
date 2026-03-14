'use client'

import { useState }        from 'react'
import { useTranslations } from 'next-intl'
import { Button }          from '@/components/ui'
import { ImportFlow }      from '@/features/reel-import/components/import-flow'
import { useLocalReels }   from '@/features/reel-import/hooks/use-local-reels'
import { cn }              from '@/lib/utils/cn'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const MAX_PREVIEW = 10

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Section for managing locally imported reels.
 *
 * Three visual states: importing, empty, and has-reels.
 */
export function ManageReelsSection() {
    const [showImport, setShowImport] = useState(false)
    const { reels, count, clear } = useLocalReels()
    const t = useTranslations('home')

    /* ── Importing ── */
    if (showImport) {
        return (
            <div className="card-brutal overflow-hidden">
                <ImportFlow onComplete={() => setShowImport(false)} />
            </div>
        )
    }

    /* ── Empty state ── */
    if (count === 0) {
        return (
            <div className="card-brutal">
                <div className="m-3 border-2 border-dashed border-[var(--color-border-subtle)] flex flex-col items-center gap-3 py-7 px-4 text-center">
                    <span className="text-4xl leading-none" aria-hidden>📥</span>
                    <div className="flex flex-col gap-1.5">
                        <p
                            className="font-display uppercase text-[var(--color-muted)]"
                            style={{ fontSize: 'var(--text-title-sm)', letterSpacing: 'var(--tracking-display)' }}
                        >
                            {t('noReelsTitle')}
                        </p>
                        <p
                            className="font-sans text-[var(--color-subtle)] leading-relaxed"
                            style={{ fontSize: 'var(--text-body-sm)' }}
                        >
                            {t('noReelsDescription')}
                        </p>
                    </div>
                    <Button size="md" variant="ghost" onClick={() => setShowImport(true)}>
                        📥 {t('importReel')}
                    </Button>
                </div>
            </div>
        )
    }

    /* ── Has reels ── */
    return (
        <div className="card-brutal flex flex-col gap-0">

            {/* Header row */}
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-[var(--color-border)]">
                <div className="flex items-center gap-2.5">
                    <span className="badge badge-accent tabular-nums">{count}</span>
                    <span className="input-label" style={{ marginBottom: 0, color: 'var(--color-muted)' }}>
                        {t('reelCount', { count })}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={clear}
                        aria-label={t('clearAll')}
                        className={cn(
                            'input-label',
                            'text-[var(--color-faint)]',
                            'transition-colors duration-[var(--duration-fast)]',
                            'hover:text-[var(--color-danger)]',
                        )}
                        style={{ marginBottom: 0 }}
                    >
                        {t('clearAll')}
                    </button>
                    <Button size="sm" variant="ghost" onClick={() => setShowImport(true)}>
                        + {t('addMore')}
                    </Button>
                </div>
            </div>

            {/* Reel preview grid */}
            <div className="p-3">
                <div className="grid grid-cols-8 gap-1">
                    {reels.slice(0, MAX_PREVIEW).map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                'aspect-square flex items-center justify-center text-sm leading-none',
                                'bg-[var(--color-border)] border border-[var(--color-border-subtle)]',
                                'transition-[border-color,background-color] duration-[var(--duration-fast)]',
                                'hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-raised)]',
                            )}
                            title={`Reel ${i + 1}`}
                            aria-hidden
                        >
                            🎬
                        </div>
                    ))}

                    {count > MAX_PREVIEW && (
                        <div className="aspect-square flex items-center justify-center font-display text-xs border-2 border-dashed border-[var(--color-border-subtle)] text-[var(--color-muted)]">
                            {count - MAX_PREVIEW > 99 ? '99+' : `+${count - MAX_PREVIEW}`}
                        </div>
                    )}
                </div>
            </div>

            {/* Readiness bar */}
            <div className="px-3 pb-3">
                <div className="flex items-center justify-between mb-1.5">
                    <span className="input-label" style={{ marginBottom: 0, color: 'var(--color-subtle)' }}>
                        {t('manageReels')}
                    </span>
                    <span className="input-label" style={{ marginBottom: 0, color: 'var(--color-success)' }}>
                        ✓ {count} loaded
                    </span>
                </div>
                <div className="progress-track success">
                    <div className="progress-fill" style={{ width: '100%' }} />
                </div>
            </div>

        </div>
    )
}
