import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui'
import type { AddReelsResult } from '../types'

type ImportDoneProps = Pick<AddReelsResult, 'added' | 'duplicates' | 'total'> & {
    /** How many URLs were skipped because the soft slot-limit was reached */
    slotsCapped?: number
    onBack?: () => void
}

export function ImportDone({ added, duplicates, total, slotsCapped = 0, onBack }: ImportDoneProps) {
    const t = useTranslations('reelImport')

    return (
        <div className="flex flex-col items-center gap-0 p-5">

            <div className="w-full card-brutal overflow-hidden">
                <div className="h-[3px] bg-[var(--color-success)]" aria-hidden />

                <div className="flex flex-col items-center gap-3 pt-10 pb-6 px-6 text-center">
                    <h2
                        className="font-display uppercase leading-none text-[var(--color-success)]"
                        style={{ fontSize: 'var(--text-title)', letterSpacing: 'var(--tracking-display)', textShadow: '0 0 20px rgba(34,197,94,0.35)' }}
                    >
                        {t('successTitle')}
                    </h2>
                    <p className="font-sans text-[var(--color-subtle)] leading-snug" style={{ fontSize: 'var(--text-body-sm)' }}>
                        {t('successDescription')}
                    </p>
                </div>

                <div className="border-t-2 border-[var(--color-border)]">

                    <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
                        <span className="input-label" style={{ marginBottom: 0, color: 'var(--color-muted)' }}>
                            New reels added
                        </span>
                        <span className="font-display text-[var(--color-foreground)] tabular-nums"
                            style={{ fontSize: 'var(--text-title-sm)', letterSpacing: 'var(--tracking-display)' }}>
                            {added}
                        </span>
                    </div>

                    {duplicates > 0 && (
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
                            <span className="input-label" style={{ marginBottom: 0, color: 'var(--color-subtle)' }}>
                                Already in pool
                            </span>
                            <span className="font-display text-[var(--color-subtle)] tabular-nums"
                                style={{ fontSize: 'var(--text-title-sm)', letterSpacing: 'var(--tracking-display)' }}>
                                {duplicates}
                            </span>
                        </div>
                    )}

                    <div className="flex items-center justify-between px-6 py-4">
                        <span className="input-label" style={{ marginBottom: 0, color: 'var(--color-muted)' }}>
                            Total in pool
                        </span>
                        <span className="badge badge-accent badge-lg font-display tabular-nums">{total}</span>
                    </div>
                </div>
            </div>

            {/* ── Slot-cap warning ─────────────────────────────────────────────── */}
            {slotsCapped > 0 && (
                <div
                    className="w-full mt-3 p-4 border-2 border-[var(--color-warning)] flex flex-col gap-1.5"
                    style={{ background: 'var(--color-warning-bg)' }}
                    role="alert"
                >
                    <p
                        className="font-display uppercase text-[var(--color-warning)]"
                        style={{ fontSize: 'var(--text-label-sm)', letterSpacing: 'var(--tracking-label)' }}
                    >
                        ⚠ {t('slotsCappedWarning', { capped: slotsCapped })}
                    </p>
                    <p className="font-sans text-[var(--color-muted)]" style={{ fontSize: 'var(--text-body-sm)' }}>
                        {t('slotsCappedHint')}
                    </p>
                </div>
            )}

            {onBack && (
                <div className="w-full mt-5">
                    <Button size="md" variant="ghost" fullWidth onClick={onBack}>
                        {t('done')}
                    </Button>
                </div>
            )}
        </div>
    )
}
