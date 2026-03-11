'use client'

import { useState }   from 'react'
import { Copy, Check } from 'lucide-react'

/**
 * Displays the 6-char lobby code with a one-click copy button.
 * Shows a brief "Copied!" confirmation for 2 seconds after copying.
 */
export function ShareCode({ code }: { code: string }) {
    const [copied, setCopied] = useState(false)

    async function handleCopy() {
        await navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="flex flex-col items-center gap-1.5 w-full">
            <p className="text-xs font-black uppercase tracking-widest text-[var(--color-subtle)]">
                Lobby Code
            </p>
            <button
                onClick={handleCopy}
                aria-label="Copy lobby code"
                className="flex items-center gap-3 w-full justify-center card-accent px-6 py-4 rounded-[var(--radius-xl)] hover:translate-y-[2px] hover:shadow-brutal-sm active:translate-y-[4px] active:shadow-none transition-all duration-[var(--duration-base)] group"
            >
        <span className="text-4xl font-black tracking-[0.25em] text-[var(--color-accent)] font-mono">
          {code}
        </span>
                <span className="ml-1">
          {copied
              ? <Check className="w-5 h-5 text-[var(--color-success)]" />
              : <Copy  className="w-5 h-5 text-[var(--color-subtle)] group-hover:text-[var(--color-accent)] transition-colors duration-[var(--duration-base)]" />
          }
        </span>
            </button>
            <p className="text-xs text-[var(--color-faint)] h-4">
                {copied ? '✅ Copied to clipboard!' : 'Tap to copy'}
            </p>
        </div>
    )
}