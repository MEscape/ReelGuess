import { SkeletonBlock } from '@/components/ui'

// ─────────────────────────────────────────────────────────────────────────────
// LobbyLoading
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Next.js loading.tsx for the lobby route — brutalist redesign.
 *
 * Mirrors LobbyRoom's visual structure:
 *   1. Header — lobby title + code badge
 *   2. Share code block — large accent code display
 *   3. Settings strip — 2-column stat boxes
 *   4. Player list rows — 3 placeholder rows
 *   5. Start button — full-width CTA
 *
 * No border-radius anywhere — matches brutalist system.
 */
export default function LobbyLoading() {
    return (
        <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto px-4 py-8">

            {/* ── Lobby status strip ────────────────────────────────── */}
            <div
                className="w-full flex items-center justify-between px-4 py-3"
                style={{
                    border:     '2px solid var(--color-border-subtle)',
                    borderLeft: '4px solid var(--color-border-strong)',
                }}
            >
                <div className="flex items-center gap-3">
                    <SkeletonBlock className="h-4 w-14" />
                    <SkeletonBlock className="h-7 w-24" />
                </div>
                <SkeletonBlock className="h-6 w-28" />
            </div>

            {/* ── Share code card ───────────────────────────────────── */}
            <div
                className="w-full flex flex-col items-center gap-3 py-6 px-4"
                style={{
                    border:    '2px solid var(--color-border-subtle)',
                    borderTop: '4px solid var(--color-border-strong)',
                }}
            >
                <SkeletonBlock className="h-4 w-32" />
                {/* Code — matches the large display font height */}
                <SkeletonBlock className="h-16 w-48" />
                <SkeletonBlock className="h-3 w-40" />
            </div>

            {/* ── Settings 2-col grid ───────────────────────────────── */}
            <div className="grid grid-cols-2 gap-2 w-full">
                {[0, 1].map((i) => (
                    <div
                        key={i}
                        className="flex flex-col items-center justify-center gap-2 py-3"
                        style={{ border: '2px solid var(--color-border-subtle)' }}
                    >
                        <SkeletonBlock className="h-3 w-14" />
                        <SkeletonBlock className="h-8 w-10" />
                    </div>
                ))}
            </div>

            {/* ── Section label + player rows ───────────────────────── */}
            <div className="w-full">
                {/* Section header */}
                <div
                    className="px-4 py-2.5"
                    style={{ border: '2px solid var(--color-border-subtle)', borderBottom: '2px solid var(--color-border)' }}
                >
                    <SkeletonBlock className="h-4 w-24" />
                </div>

                {/* Player rows */}
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className="flex items-center gap-3 px-4 py-3"
                        style={{
                            border:       '2px solid var(--color-border-subtle)',
                            borderTop:    'none',
                        }}
                    >
                        {/* Rank */}
                        <SkeletonBlock className="h-4 w-4 shrink-0" />
                        {/* Avatar */}
                        <SkeletonBlock className="h-9 w-9 shrink-0" style={{ borderRadius: '50%' }} />
                        {/* Name */}
                        <SkeletonBlock className="h-5 flex-1" style={{ maxWidth: '8rem' }} />
                        {/* Badge */}
                        <SkeletonBlock className="h-5 w-12 ml-auto shrink-0" />
                    </div>
                ))}
            </div>

            {/* ── Start button ──────────────────────────────────────── */}
            <SkeletonBlock className="w-full h-[3.75rem]" />
        </div>
    )
}