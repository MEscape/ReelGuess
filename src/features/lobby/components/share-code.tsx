'use client'

import { useState, useCallback } from 'react'
import { useTranslations }       from 'next-intl'
import { Copy, Check, AlertCircle } from 'lucide-react'
import { cn }                    from '@/lib/utils/cn'

export function ShareCode({ code }: { code: string }) {
    const [copied,     setCopied]     = useState(false)
    const [copyFailed, setCopyFailed] = useState(false)
    const t = useTranslations('lobby')
    const tAria = useTranslations('aria')

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(code)
            setCopied(true)
            setTimeout(() => setCopied(false), 2200)
        } catch {
            setCopyFailed(true)
            setTimeout(() => setCopyFailed(false), 2200)
        }
    }, [code])

    const isCopied = copied
    const isFailed = copyFailed && !copied

    return (
        <div className="flex flex-col items-center gap-2 w-full">

            <span className="input-label" style={{ color: 'var(--color-muted)', marginBottom: 0 }}>
                {t('code')}
            </span>

            <button
                onClick={handleCopy}
                aria-label={isCopied ? t('copied') : tAria('copyCode')}
                className={cn(
                    'w-full flex items-center justify-between gap-4 px-6 py-4',
                    'border-[3px] transition-[border-color,box-shadow,transform,background-color]',
                    'duration-[var(--duration-base)]',
                    isCopied && 'border-[var(--color-success)] shadow-brutal-success bg-[var(--color-success-bg)]',
                    isFailed && 'border-[var(--color-danger)] bg-[var(--color-surface)]',
                    !isCopied && !isFailed && [
                        'border-[var(--color-accent)] shadow-brutal-accent bg-[var(--color-surface)]',
                        'hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal-accent-lg',
                        'active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
                    ].join(' '),
                )}
            >
                <span
                    className={cn(
                        'font-display tracking-[0.3em] leading-none flex-1 text-center',
                        'transition-colors duration-[var(--duration-base)]',
                        isCopied ? 'text-[var(--color-success)]' : 'text-[var(--color-accent)]',
                    )}
                    style={{ fontSize: 'clamp(2rem, 10vw, 2.75rem)' }}
                >
                    {code}
                </span>

                <span className="shrink-0">
                    {isCopied
                        ? <Check       className="w-6 h-6 text-[var(--color-success)]" />
                        : isFailed
                            ? <AlertCircle className="w-6 h-6 text-[var(--color-danger)]" />
                            : <Copy        className="w-6 h-6 text-[var(--color-subtle)]" />
                    }
                </span>
            </button>

            <p
                className={cn(
                    'font-display uppercase h-5 transition-colors duration-[var(--duration-base)]',
                    isCopied ? 'text-[var(--color-success)]'  : '',
                    isFailed ? 'text-[var(--color-danger)]'   : '',
                    !isCopied && !isFailed ? 'text-[var(--color-faint)]' : '',
                )}
                style={{ fontSize: 'var(--text-label-xs)', letterSpacing: 'var(--tracking-label)' }}
            >
                {isCopied ? `✓ ${t('copied')}` : isFailed ? t('copyFailed') : t('tapToCopy')}
            </p>

        </div>
    )
}
