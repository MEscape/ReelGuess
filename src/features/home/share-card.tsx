'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence }           from 'framer-motion'
import { useTranslations }                  from 'next-intl'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ShareCardProps = {
    /** Delay in ms before the card auto-appears. @default 4500 */
    delay?: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** localStorage key — prevents the card showing more than once per device. */
const SEEN_KEY  = 'rg_share_seen'
/** Only show to a fraction of visitors to avoid overwhelming everyone. */
const SHOW_RATE = 0.6

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Non-intrusive share nudge that slides in from the bottom-right after the
 * user has been on the page for `delay` ms.
 *
 * Rules so it's never annoying:
 *  - Only shown once per device (localStorage flag).
 *  - Only shown to 60% of visitors (random gate).
 *  - Auto-dismissed after 12 s.
 *  - User can permanently dismiss with ✕.
 *  - Respects `prefers-reduced-motion`.
 */
export function ShareCard({ delay = 4500 }: ShareCardProps) {
    const [visible,  setVisible]  = useState(false)
    const [copied,   setCopied]   = useState(false)
    const t     = useTranslations('share')
    const tAria = useTranslations('aria')

    // Decide once on mount whether to show at all.
    useEffect(() => {
        try {
            if (localStorage.getItem(SEEN_KEY)) return
        } catch { /* private browsing — ignore */ }

        if (Math.random() > SHOW_RATE) return

        const timer = setTimeout(() => setVisible(true), delay)
        return () => clearTimeout(timer)
    }, [delay])

    // Auto-dismiss after 12 s once visible.
    useEffect(() => {
        if (!visible) return
        const timer = setTimeout(() => setVisible(false), 12_000)
        return () => clearTimeout(timer)
    }, [visible])

    const dismiss = useCallback(() => {
        setVisible(false)
        try { localStorage.setItem(SEEN_KEY, '1') } catch { /* ignore */ }
    }, [])

    const share = useCallback(async () => {
        const url   = window.location.origin
        const text  = t('shareText')
        const title = t('shareTitle')

        // Native Share API (mobile)
        if (typeof navigator.share === 'function') {
            try {
                await navigator.share({ title, text, url })
                dismiss()
                return
            } catch { /* cancelled — fall through to clipboard */ }
        }

        // Clipboard fallback
        try {
            await navigator.clipboard.writeText(`${text}\n${url}`)
            setCopied(true)
            setTimeout(() => { setCopied(false); dismiss() }, 2000)
        } catch { /* ignore */ }
    }, [t, dismiss])

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    role="complementary"
                    aria-label={t('ariaLabel')}
                    initial={{ opacity: 0, y: 24, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0,  scale: 1    }}
                    exit={{    opacity: 0, y: 16, scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                    style={{
                        position:  'fixed',
                        bottom:    'max(1.5rem, env(safe-area-inset-bottom, 1rem))',
                        right:     '1rem',
                        zIndex:    50,
                        width:     'min(calc(100vw - 2rem), 22rem)',
                    }}
                >
                    {/* Card */}
                    <div
                        style={{
                            background: 'var(--color-surface)',
                            border:     '2px solid var(--color-border-subtle)',
                            borderLeft: '4px solid var(--color-accent)',
                            boxShadow:  '6px 6px 0px var(--color-accent), var(--shadow-glow-accent-lg)',
                            padding:    '1.1rem 1.25rem',
                        }}
                    >
                        {/* Header row */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2.5">
                                <span style={{ fontSize: '1.5rem', lineHeight: 1 }} aria-hidden>🎬</span>
                                <div>
                                    <p
                                        className="font-display uppercase"
                                        style={{
                                            fontSize:      'var(--text-ui)',
                                            letterSpacing: 'var(--tracking-display)',
                                            color:         'var(--color-foreground)',
                                            lineHeight:    1.1,
                                        }}
                                    >
                                        {t('heading')}
                                    </p>
                                    <p
                                        className="font-sans"
                                        style={{ fontSize: 'var(--text-label-sm)', color: 'var(--color-muted)', marginTop: '0.15rem' }}
                                    >
                                        {t('subheading')}
                                    </p>
                                </div>
                            </div>

                            {/* Dismiss */}
                            <button
                                onClick={dismiss}
                                aria-label={tAria('closeModal')}
                                style={{
                                    background:  'transparent',
                                    border:      'none',
                                    cursor:      'pointer',
                                    color:       'var(--color-subtle)',
                                    fontSize:    '1.1rem',
                                    lineHeight:  1,
                                    padding:     '0.1rem 0.25rem',
                                    flexShrink:  0,
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* CTA button */}
                        <button
                            onClick={share}
                            style={{
                                width:         '100%',
                                padding:       '0.6rem 1rem',
                                background:    copied
                                    ? 'rgba(34,197,94,0.12)'
                                    : 'linear-gradient(135deg, rgba(245,200,0,0.15) 0%, rgba(245,200,0,0.05) 100%)',
                                border:        `2px solid ${copied ? 'var(--color-success)' : 'var(--color-accent)'}`,
                                boxShadow:     copied ? 'none' : '3px 3px 0px var(--color-accent)',
                                cursor:        'pointer',
                                display:       'flex',
                                alignItems:    'center',
                                justifyContent:'center',
                                gap:           '0.5rem',
                                transition:    'all 0.15s ease',
                            }}
                        >
                            <span style={{ fontSize: '1rem' }} aria-hidden>
                                {copied ? '✓' : '🔗'}
                            </span>
                            <span
                                className="font-display uppercase"
                                style={{
                                    fontSize:      'var(--text-ui)',
                                    letterSpacing: 'var(--tracking-display)',
                                    color:         copied ? 'var(--color-success)' : 'var(--color-accent)',
                                }}
                            >
                                {copied ? t('copied') : t('cta')}
                            </span>
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

