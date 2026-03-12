import Link from 'next/link'

/**
 * Global Not-Found page.
 *
 * Shows a friendly error instead of redirecting to `/` — a redirect caused a
 * race condition when navigating to /game before the server persisted status='playing'.
 *
 * Typography fixes vs old version:
 *  - Brand title uses font-display (Bebas Neue) not font-black (Inter bold).
 *    font-black on a sans-serif fights with the display font used everywhere else.
 *  - "Page Not Found" label stepped up from text-xs to --text-label-sm and
 *    uses the input-label class for consistency with the rest of the app.
 *  - Body copy uses --text-body (15px) not text-sm (14px) — easier to read.
 *  - Card padding is p-6 not py-8 px-6 — equal on all sides.
 *  - Error code "404" added as a display accent number — makes the page feel
 *    intentional rather than generic.
 */
export default function NotFoundPage() {
    return (
        <main className="min-h-dvh flex flex-col items-center justify-center px-4 py-12 pb-safe">

            {/* ── HERO ──────────────────────────────────────────────────── */}
            <header className="w-full max-w-sm text-center mb-8">

                {/* Error number — display font, large, muted so it doesn't fight title */}
                <p
                    className="font-display text-[var(--color-border-strong)] leading-none mb-2"
                    style={{
                        fontSize:      'var(--text-display-lg)',
                        letterSpacing: 'var(--tracking-display)',
                    }}
                    aria-hidden
                >
                    404
                </p>

                {/* Brand title */}
                <h1
                    className="font-display uppercase leading-none text-[var(--color-accent)]"
                    style={{
                        fontSize:      'clamp(3rem, 14vw, 4.5rem)',
                        letterSpacing: 'var(--tracking-display)',
                        textShadow: [
                            '0 0 15px rgba(245,200,0,0.45)',
                            '0 0 40px rgba(245,200,0,0.22)',
                        ].join(', '),
                    }}
                >
                    ReelGuess
                </h1>

                {/* Subtitle — uses input-label class for consistent label styling */}
                <p
                    className="input-label mt-3"
                    style={{ color: 'var(--color-muted)' }}
                >
                    Page Not Found
                </p>

            </header>

            {/* ── PANEL ─────────────────────────────────────────────────── */}
            <div className="w-full max-w-sm">

                <div className="card-brutal p-6 flex flex-col gap-5">

                    {/* Body copy — --text-body size, normal weight, muted */}
                    <p
                        className="font-sans text-[var(--color-muted)] leading-relaxed text-center"
                        style={{ fontSize: 'var(--text-body)' }}
                    >
                        This lobby or game{' '}
                        <span className="font-bold text-[var(--color-foreground)]">
                            doesn&#39;t exist
                        </span>{' '}
                        anymore. It may have expired or the code was wrong.
                    </p>

                    <Link href="/" className="btn btn-primary btn-lg w-full">
                        ← Go Home
                    </Link>

                </div>

            </div>

        </main>
    )
}