'use client'

import { useState }    from 'react'
import { Copy, Check } from 'lucide-react'
import { cn }          from '@/lib/utils/cn'

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lobby code display + one-tap copy to clipboard.
 * Pure UI — no business logic.
 */
export function ShareCode({ code }: { code: string }) {
    const [copied, setCopied] = useState(false)

    async function handleCopy() {
        await navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2200)
    }

    return (
        <div className="flex flex-col items-center gap-2 w-full">

            <span
                className="input-label"
                style={{ color: 'var(--color-muted)', marginBottom: 0 }}
            >
                Lobby Code
            </span>

            <button
                onClick={handleCopy}
                aria-label={copied ? 'Code copied' : 'Copy lobby code'}
                className={cn(
                    'w-full flex items-center justify-between gap-4 px-6 py-4',
                    'border-[3px] transition-[border-color,box-shadow,transform,background-color]',
                    'duration-[var(--duration-base)]',
                    copied
                        ? 'border-[var(--color-success)] shadow-brutal-success bg-[var(--color-success-bg)]'
                        : [
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
                        copied ? 'text-[var(--color-success)]' : 'text-[var(--color-accent)]',
                    )}
                    style={{ fontSize: 'clamp(2rem, 10vw, 2.75rem)' }}
                >
                    {code}
                </span>

                <span className="shrink-0">
                    {copied
                        ? <Check className="w-6 h-6 text-[var(--color-success)]" />
                        : <Copy  className="w-6 h-6 text-[var(--color-subtle)]" />
                    }
                </span>
            </button>

            <p
                className={cn(
                    'font-display uppercase h-5 transition-colors duration-[var(--duration-base)]',
                    copied ? 'text-[var(--color-success)]' : 'text-[var(--color-faint)]',
                )}
                style={{
                    fontSize:      'var(--text-label-xs)',
                    letterSpacing: 'var(--tracking-label)',
                }}
            >
                {copied ? '✓ Copied to clipboard' : 'Tap to copy'}
            </p>

        </div>
    )
}
