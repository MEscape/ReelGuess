'use client'

// ─────────────────────────────────────────────────────────────────────────────
// AdBlockWall — fullscreen lock shown when an ad blocker is detected.
//
// Design rationale:
//  • Non-aggressive: explains why ads matter, doesn't shame the user.
//  • Offers a direct "Retry" so users who whitelisted can proceed immediately.
//  • Uses the existing brutalist design system (no external deps).
//  • Accessible: role="dialog", focus management, keyboard Retry.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useEffect, useCallback, useState } from 'react'
import { useTranslations } from 'next-intl'

type Props = {
    /** Called when the user clicks "Retry" and the probe succeeds. */
    onUnblocked?: () => void
}

export function AdBlockWall({ onUnblocked }: Props) {
    const t        = useTranslations('adBlock')
    const retryRef = useRef<HTMLButtonElement>(null)
    const [retrying, setRetrying] = useState(false)
    const [retryFailed, setRetryFailed] = useState(false)

    // Move focus to the Retry button on mount for keyboard users
    useEffect(() => {
        retryRef.current?.focus()
    }, [])

    const handleRetry = useCallback(async () => {
        setRetrying(true)
        setRetryFailed(false)
        try {
            const res = await fetch(
                `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_ID}`,
                { method: 'HEAD', cache: 'no-store' }
            )
            if (res.ok) {
                onUnblocked?.()
                window.location.reload()
            } else {
                setRetryFailed(true)
            }
        } catch {
            setRetryFailed(true)
        } finally {
            setRetrying(false)
        }
    }, [onUnblocked])

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={t('title')}
            style={{
                position:        'fixed',
                inset:           0,
                zIndex:          10000,
                background:      'var(--color-background)',
                display:         'flex',
                flexDirection:   'column',
                alignItems:      'center',
                justifyContent:  'center',
                padding:         '1.5rem',
                gap:             '1.5rem',
            }}
        >
            {/* Card */}
            <div
                style={{
                    width:       '100%',
                    maxWidth:    '28rem',
                    background:  'var(--color-surface)',
                    border:      '3px solid var(--color-border-strong)',
                    boxShadow:   'var(--shadow-brutal-lg)',
                    overflow:    'hidden',
                }}
            >
                {/* Accent stripe */}
                <div style={{ height: 4, background: 'var(--color-warning)' }} aria-hidden />

                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h1
                        className="font-display uppercase"
                        style={{
                            fontSize:      'var(--text-title)',
                            letterSpacing: 'var(--tracking-display)',
                            color:         'var(--color-foreground)',
                            lineHeight:    1.1,
                        }}
                    >
                        {t('title')}
                    </h1>

                    <p className="font-sans" style={{ fontSize: 'var(--text-body)', color: 'var(--color-muted)', lineHeight: 1.7 }}>
                        {t('body')}
                    </p>

                    {/* Steps */}
                    <div
                        style={{
                            display:         'flex',
                            flexDirection:   'column',
                            gap:             '0.5rem',
                            padding:         '0.75rem',
                            background:      'var(--color-surface-raised)',
                            border:          '1px solid var(--color-border)',
                        }}
                    >
                        {(['step1', 'step2', 'step3'] as const).map((key, i) => (
                            <div key={key} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                <span
                                    className="font-display"
                                    style={{
                                        fontSize:      'var(--text-label-xs)',
                                        letterSpacing: 'var(--tracking-label)',
                                        color:         'var(--color-accent)',
                                        flexShrink:    0,
                                        marginTop:     '0.1rem',
                                    }}
                                >
                                    {String(i + 1).padStart(2, '0')}
                                </span>
                                <span className="font-sans" style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-muted)' }}>
                                    {t(key)}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Retry failed hint */}
                    {retryFailed && (
                        <p
                            className="font-sans"
                            role="alert"
                            style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-warning)' }}
                        >
                            {t('retryFailed')}
                        </p>
                    )}

                    {/* Retry button */}
                    <button
                        ref={retryRef}
                        onClick={handleRetry}
                        disabled={retrying}
                        className="btn btn-primary btn-md"
                        style={{ width: '100%', justifyContent: 'center' }}
                    >
                        {retrying ? t('retrying') : t('retry')}
                    </button>
                </div>
            </div>

            {/* Fine print */}
            <p
                className="font-sans text-center"
                style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-subtle)', maxWidth: '22rem' }}
            >
                {t('footnote')}
            </p>
        </div>
    )
}

