'use client'

import { motion }          from 'framer-motion'
import { useTranslations } from 'next-intl'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type AbstainRowProps = {
    displayName: string
    delay:       number
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A row in the reveal vote breakdown for a player who did not cast a vote.
 */
export function AbstainRow({ displayName, delay }: AbstainRowProps) {
    const t = useTranslations('reveal')

    return (
        <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay }}
            className="flex items-center gap-3 px-4 py-2.5"
            style={{ borderBottom: '1px solid var(--color-border)', borderLeft: '3px solid var(--color-border-subtle)', opacity: 0.6 }}
        >
            <span className="font-display shrink-0"
                style={{ fontSize: 'var(--text-ui)', color: 'var(--color-muted)', width: '1.4rem', textAlign: 'center' }}>
                —
            </span>
            <span className="font-display uppercase flex-1 min-w-0 truncate"
                style={{ fontSize: 'var(--text-body)', letterSpacing: 'var(--tracking-display)', color: 'var(--color-muted)' }}>
                {displayName}
            </span>
            <span className="font-sans shrink-0"
                style={{ fontSize: 'var(--text-label-sm)', color: 'var(--color-muted)' }}>
                {t('didNotVote').toUpperCase()}
            </span>
        </motion.div>
    )
}