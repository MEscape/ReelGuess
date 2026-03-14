'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type VoteRowProps = {
    voterName:     string
    votedForName:  string
    isCorrect:     boolean
    pointsAwarded: number | null | undefined
    usedDouble:    boolean | undefined
    delay:         number
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A single voter row in the reveal vote breakdown list.
 *
 * Shows the voter name, who they voted for, correctness indicator,
 * points delta, and a Double-or-Nothing badge when activated.
 */
export function VoteRow({
                            voterName,
                            votedForName,
                            isCorrect,
                            pointsAwarded,
                            usedDouble,
                            delay,
                        }: VoteRowProps) {
    const t = useTranslations('voting')

    return (
        <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay }}
            className="flex items-center gap-3 px-4 py-2.5"
            style={{
                borderBottom: '1px solid var(--color-border)',
                background:   isCorrect ? 'rgba(34,197,94,0.04)' : 'transparent',
                borderLeft:   isCorrect
                    ? '3px solid var(--color-success)'
                    : '3px solid var(--color-danger)',
            }}
        >
            <span
                className="font-display shrink-0"
                style={{ fontSize: 'var(--text-ui)', color: isCorrect ? 'var(--color-success)' : 'var(--color-danger)', width: '1.4rem', textAlign: 'center' }}
                aria-label={isCorrect ? '✓' : '✕'}
            >
                {isCorrect ? '✓' : '✕'}
            </span>

            <span className="font-display uppercase flex-1 min-w-0 truncate"
                style={{ fontSize: 'var(--text-body)', letterSpacing: 'var(--tracking-display)', color: 'var(--color-foreground)' }}>
                {voterName}
            </span>

            <span style={{ fontSize: 'var(--text-label-sm)', color: 'var(--color-subtle)' }} aria-hidden>→</span>

            <span className="font-sans truncate"
                style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-muted)', maxWidth: '6rem' }}>
                {votedForName}
            </span>

            {pointsAwarded != null && pointsAwarded > 0 && (
                <span className="font-display shrink-0"
                    style={{ fontSize: 'var(--text-ui)', letterSpacing: 'var(--tracking-display)', color: 'var(--color-success)' }}>
                    +{pointsAwarded}
                </span>
            )}
            {pointsAwarded != null && pointsAwarded < 0 && (
                <span className="font-display shrink-0"
                    style={{ fontSize: 'var(--text-ui)', letterSpacing: 'var(--tracking-display)', color: 'var(--color-danger)' }}>
                    {pointsAwarded}
                </span>
            )}
            {pointsAwarded != null && pointsAwarded === 0 && (
                <span className="font-display shrink-0"
                    style={{ fontSize: 'var(--text-ui)', letterSpacing: 'var(--tracking-display)', color: 'var(--color-muted)' }}>
                    +0
                </span>
            )}

            {usedDouble && (
                <span className="font-display shrink-0"
                    style={{ fontSize: 'var(--text-label-xs)', color: 'var(--color-accent)' }}
                    title={t('doubleActivatedTitle')}
                    aria-label={t('doubleActivatedTitle')}
                >
                    ⚡
                </span>
            )}
        </motion.div>
    )
}