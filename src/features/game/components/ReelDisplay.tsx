'use client'

import { useMemo }    from 'react'
import { Button }     from '@/components/ui'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ReelDisplayProps = {
    instagramUrl: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extracts the shortcode from an Instagram Reel URL.
 * e.g. `https://www.instagram.com/reel/ABC123/` → `ABC123`
 */
function extractShortcode(url: string): string | null {
    const match = url.match(/instagram\.com\/reel\/([A-Za-z0-9_-]+)/)
    return match?.[1] ?? null
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Renders an Instagram Reel iframe, or a fallback "Watch on Instagram" link.
 *
 * embed_html / thumbnail_url / caption have been removed — the DB columns
 * are always null, so there is no fallback HTML to render.
 */
export function ReelDisplay({ instagramUrl }: ReelDisplayProps) {
    const shortcode = useMemo(() => extractShortcode(instagramUrl), [instagramUrl])

    if (shortcode) {
        return (
            <div className="w-full max-w-sm mx-auto rounded-[var(--radius-xl)] overflow-hidden border border-[var(--color-border-subtle)] bg-black shadow-[0_0_24px_rgba(0,0,0,0.6)]">
                <iframe
                    src={`https://www.instagram.com/reel/${shortcode}/embed/captioned/`}
                    className="w-full"
                    style={{ height: 560, border: 'none', display: 'block' }}
                    allowFullScreen
                    scrolling="no"
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    title="Instagram Reel"
                />
            </div>
        )
    }

    // Fallback: URL is malformed or shortcode can't be extracted
    return (
        <div className="w-full max-w-sm mx-auto card p-6 text-center">
            <div className="text-6xl mb-4">🎬</div>
            <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open(instagramUrl, '_blank', 'noopener,noreferrer')}
            >
                📺 Watch on Instagram
            </Button>
        </div>
    )
}
