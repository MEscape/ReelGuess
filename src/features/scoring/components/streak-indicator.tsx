'use client'

import { memo }                from 'react'
import { useTranslations }     from 'next-intl'
import { getStreakMultiplier }  from '../service'
import { formatMultiplier }    from '../utils'

type StreakIndicatorProps = {
    /** Current player streak value. */
    streak: number
    /**
     * Display size variant.
     * @default 'md'
     */
    size?: 'sm' | 'md' | 'lg'
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Inline streak indicator showing the player's current streak and the
 * active multiplier it will grant on the next correct vote.
 *
 * Hidden when streak is 0 (no streak active).
 */
export const StreakIndicator = memo(function StreakIndicator({ streak, size = 'md' }: StreakIndicatorProps) {
    // Hooks must be called unconditionally before any early return
    const nextMultiplier = getStreakMultiplier(streak + 1)
    const t = useTranslations('scoring')

    if (streak <= 0) return null

    const fontSizes: Record<NonNullable<StreakIndicatorProps['size']>, string> = {
        sm: 'var(--text-label-xs)',
        md: 'var(--text-label-sm)',
        lg: 'var(--text-ui)',
    }
    const emojiFontSizes: Record<NonNullable<StreakIndicatorProps['size']>, string> = {
        sm: '0.9rem',
        md: '1.1rem',
        lg: '1.3rem',
    }

    return (
        <div className="inline-flex items-center gap-1.5"
            style={{ padding: '0.2rem 0.6rem', background: 'rgba(245,200,0,0.1)', border: '1px solid rgba(245,200,0,0.4)' }}>
            <span style={{ fontSize: emojiFontSizes[size], lineHeight: 1 }}>🔥</span>
            <span className="font-display uppercase tabular-nums"
                style={{ fontSize: fontSizes[size], letterSpacing: 'var(--tracking-display)', color: 'var(--color-warning)', lineHeight: 1 }}>
                {t('streak', { streak })}
            </span>
            {nextMultiplier > 1.0 && (
                <span className="font-display"
                    style={{ fontSize: fontSizes[size], color: 'var(--color-accent)', lineHeight: 1 }}>
                    {t('streakNext', { multiplier: formatMultiplier(nextMultiplier) })}
                </span>
            )}
        </div>
    )
})