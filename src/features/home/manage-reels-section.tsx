'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui'
import { ImportFlow } from '@/features/reel-import/components/import-flow'
import { useLocalReels } from '@/features/reel-import/hooks/use-local-reels'
import { cn } from '@/lib/utils/cn'
import { SOFT_LOCAL_LIMIT, REWARD_EXTRA_SLOTS, RECOMMENDED_REELS, LOCAL_MAX_REELS } from '@/features/reel-import/constants'
import { getRewardSlots, addRewardSlots } from '@/features/reel-import/stores/reward-slots-store'
import { RewardedAd } from '@/features/ads'

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
    const [showRewardAd, setShowRewardAd] = useState(false)
    const [justUnlocked, setJustUnlocked] = useState(false)
    const [bonusSlots, setBonusSlots] = useState(0)

    const { reels, count, clear } = useLocalReels()
    const t = useTranslations('home')

    // Hydrate bonus slots from localStorage after mount
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setBonusSlots(getRewardSlots())
    }, [])

    const effectiveLimit = SOFT_LOCAL_LIMIT + bonusSlots
    const isAtLimit = count >= effectiveLimit

    const handleReward = useCallback(() => {
        const next = addRewardSlots(REWARD_EXTRA_SLOTS)
        setBonusSlots(next - (next - REWARD_EXTRA_SLOTS))  // local increment
        setBonusSlots(getRewardSlots())
        setJustUnlocked(true)
        setShowRewardAd(false)
        // Hide the unlocked badge after 4 s
        setTimeout(() => setJustUnlocked(false), 4_000)
    }, [])

    /* ── Rewarded Ad overlay ── */
    if (showRewardAd) {
        return (
            <RewardedAd
                onClose={() => setShowRewardAd(false)}
                onReward={handleReward}
            />
        )
    }

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
                    {/* Only allow adding if under effective limit */}
                    {!isAtLimit && (
                        <Button size="sm" variant="ghost" onClick={() => setShowImport(true)}>
                            + {t('addMore')}
                        </Button>
                    )}
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

            {/* Rewarded-Ad unlock prompt — shown whenever more slots can be unlocked */}
            {effectiveLimit < LOCAL_MAX_REELS && (
                <div
                    className="mx-3 mb-3 p-3 border-2 border-dashed border-[var(--color-accent)] flex flex-col gap-2"
                    style={{ background: 'rgba(245,200,0,0.05)' }}
                >
                    {justUnlocked ? (
                        <p
                            className="font-display uppercase text-center text-[var(--color-accent)]"
                            style={{ fontSize: 'var(--text-body-sm)', letterSpacing: 'var(--tracking-label)' }}
                        >
                            {t('reelLimitUnlocked', { extra: REWARD_EXTRA_SLOTS })}
                        </p>
                    ) : (
                        <>
                            <p
                                className="font-sans text-[var(--color-muted)]"
                                style={{ fontSize: 'var(--text-body-sm)' }}
                            >
                                {t('reelLimitBody', { limit: effectiveLimit, extra: REWARD_EXTRA_SLOTS })}
                            </p>
                            <Button
                                size="sm"
                                variant={isAtLimit ? 'primary' : 'ghost'}
                                onClick={() => setShowRewardAd(true)}
                                style={{ width: '100%' }}
                            >
                                {t('reelLimitCta', { extra: REWARD_EXTRA_SLOTS })}
                            </Button>
                        </>
                    )}
                </div>
            )}

            {/* Readiness bar */}
            <div className="px-3 pb-3">
                <div className="flex items-center justify-between mb-1.5">
                    <span className="input-label" style={{ marginBottom: 0, color: 'var(--color-subtle)' }}>
                        {t('manageReels')}
                    </span>
                    <span
                        className="input-label"
                        style={{
                            marginBottom: 0,
                            color: count >= RECOMMENDED_REELS
                                ? 'var(--color-success)'
                                : count >= 3
                                    ? 'var(--color-warning)'
                                    : 'var(--color-danger)',
                        }}
                    >
                        {count >= RECOMMENDED_REELS ? '✓' : '⚠'} {count}/{effectiveLimit}
                    </span>
                </div>
                <div className={cn('progress-track', count >= RECOMMENDED_REELS ? 'success' : 'warning')}>
                    <div
                        className="progress-fill"
                        style={{ width: `${Math.min(100, (count / effectiveLimit) * 100)}%` }}
                    />
                </div>
                {/* Warning hint when below sweetspot */}
                {count > 0 && count < RECOMMENDED_REELS && (
                    <p
                        className="font-sans mt-1.5"
                        style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-warning)' }}
                    >
                        {t('reelsBelowRecommended', { recommended: RECOMMENDED_REELS, current: count })}
                    </p>
                )}
            </div>

        </div>
    )
}
