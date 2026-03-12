import { SkeletonBlock } from '@/components/ui'

// ─────────────────────────────────────────────────────────────────────────────
// GameLoading
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Next.js loading.tsx for the game route — brutalist redesign.
 *
 * Mirrors the voting phase layout:
 *   1. Sticky round header bar (round label + timer ring)
 *   2. Reel frame (tall, bordered, no radius)
 *   3. Voting grid — 2×2 player buttons
 *
 * No border-radius anywhere — matches brutalist system.
 */
export default function GameLoading() {
    return (
        <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto px-4 py-4">

            {/* ── Round header bar ──────────────────────────────────── */}
            <div
                className="w-full flex items-center justify-between px-4 py-2.5"
                style={{
                    border:          '2px solid var(--color-border-subtle)',
                    borderLeft:      '4px solid var(--color-border-strong)',
                    boxShadow:       'var(--shadow-brutal-xs)',
                }}
            >
                <SkeletonBlock className="h-7 w-28" />
                {/* Timer ring placeholder */}
                <SkeletonBlock className="w-[72px] h-[72px]" style={{ borderRadius: '50%' }} />
            </div>

            {/* ── Reel frame — mirrors ReelDisplay outer wrapper ────── */}
            <div
                className="w-full max-w-sm mx-auto"
                style={{
                    border:    '3px solid var(--color-border-strong)',
                    borderTop: '4px solid var(--color-accent)',
                    boxShadow: 'var(--shadow-brutal)',
                }}
            >
                <SkeletonBlock style={{ height: '560px' }} />
            </div>

            {/* ── WHO LIKED THIS REEL divider ──────────────────────── */}
            <div className="w-full flex items-center gap-3">
                <SkeletonBlock className="flex-1 h-[2px]" />
                <SkeletonBlock className="h-4 w-40" />
                <SkeletonBlock className="flex-1 h-[2px]" />
            </div>

            {/* ── Voting grid — 2×2, matches vote-btn minHeight ─────── */}
            <div className="grid grid-cols-2 gap-2.5 w-full pb-4">
                {[0, 1, 2, 3].map((i) => (
                    <SkeletonBlock
                        key={i}
                        style={{ height: '7rem' }}
                    />
                ))}
            </div>
        </div>
    )
}
