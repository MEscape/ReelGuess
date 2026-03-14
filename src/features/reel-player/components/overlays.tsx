'use client'

import { motion }  from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Button }  from '@/components/ui'
import {
    UNAVAILABLE_MIN_HEIGHT,
} from '../constants'

// ─────────────────────────────────────────────────────────────────────────────
// UnavailableCard
// ─────────────────────────────────────────────────────────────────────────────

type UnavailableCardProps = {
    instagramUrl: string
}

/**
 * Shown after MAX_CONSECUTIVE_FAILS failures.
 * Directs the user to open the reel directly on Instagram.
 */
export function UnavailableCard({ instagramUrl }: UnavailableCardProps) {
    const t = useTranslations('reelImport')
    return (
        <div
            className="w-full max-w-sm mx-auto flex flex-col items-center gap-4 p-6"
            style={{
                background:     'var(--color-surface)',
                border:         '3px solid var(--color-danger)',
                borderTop:      '6px solid var(--color-danger)',
                boxShadow:      'var(--shadow-brutal-danger)',
                minHeight:      `${UNAVAILABLE_MIN_HEIGHT}px`,
                justifyContent: 'center',
            }}
        >
            <span
                className="font-display"
                style={{ fontSize: '3.5rem', lineHeight: 1 }}
                aria-hidden
            >
                📵
            </span>

            <div className="text-center space-y-1">
                <p
                    className="font-display uppercase"
                    style={{
                        fontSize:      'var(--text-title-sm)',
                        letterSpacing: 'var(--tracking-display)',
                        color:         'var(--color-danger)',
                    }}
                >
                    {t('unavailableTitle').toUpperCase()}
                </p>
                <p
                    className="font-sans"
                    style={{
                        fontSize: 'var(--text-body-sm)',
                        color:    'var(--color-muted)',
                    }}
                >
                    {t('unavailableDesc')}
                </p>
            </div>

            <Button
                variant="danger"
                size="sm"
                fullWidth
                onClick={() => window.open(instagramUrl, '_blank', 'noopener,noreferrer')}
            >
                {t('openOnInstagram').toUpperCase()}
            </Button>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// LoadingOverlay
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Overlay shown while the embed is loading.
 * Sits above the always-visible iframe via `position: absolute`.
 */
export function LoadingOverlay() {
    const t = useTranslations('reelImport')
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4"
            style={{ background: 'var(--color-surface)', zIndex: 2 }}
        >
            <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                style={{ fontSize: '3rem', lineHeight: 1 }}
                aria-hidden
            >
                🎬
            </motion.span>
            <span
                className="font-display uppercase"
                style={{
                    fontSize:      'var(--text-label-sm)',
                    letterSpacing: 'var(--tracking-loose)',
                    color:         'var(--color-muted)',
                }}
            >
                {t('loading').toUpperCase()}
            </span>
        </motion.div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// ErrorOverlay
// ─────────────────────────────────────────────────────────────────────────────

type ErrorOverlayProps = {
    instagramUrl: string
    onRetry:      () => void
}

/**
 * Overlay shown after a recoverable failure.
 * Offers a retry action and a direct link to Instagram as fallback.
 */
export function ErrorOverlay({ instagramUrl, onRetry }: ErrorOverlayProps) {
    const t = useTranslations('reelImport')
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4"
            style={{ background: 'var(--color-surface)', zIndex: 2 }}
        >
            <span style={{ fontSize: '3rem', lineHeight: 1 }} aria-hidden>⚠️</span>
            <p
                className="font-display uppercase"
                style={{
                    fontSize:      'var(--text-ui)',
                    letterSpacing: 'var(--tracking-display)',
                    color:         'var(--color-muted)',
                }}
            >
                {t('failedToLoad').toUpperCase()}
            </p>
            <Button variant="ghost" size="sm" onClick={onRetry}>
                {t('retry')}
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(instagramUrl, '_blank', 'noopener,noreferrer')}
            >
                {t('openOnInstagram')}
            </Button>
        </motion.div>
    )
}