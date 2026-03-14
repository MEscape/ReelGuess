import { CreateLobbySection, JoinLobbySection, ManageReelsSection } from '@/features/home'

// ─────────────────────────────────────────────────────────────────────────────
// HomePage
// ─────────────────────────────────────────────────────────────────────────────

export default function HomePage() {
    return (
        <main className="min-h-dvh flex flex-col items-center justify-center px-4 py-12 pb-safe">

            {/* ── HERO ────────────────────────────────────────────────────── */}
            <header className="w-full max-w-sm text-center mb-10">

                {/* Emoji — bounces via brutal-bounce keyframe */}
                <div
                    className="text-8xl mb-4 leading-none"
                    aria-hidden
                    style={{ animation: 'brutal-bounce 1.4s var(--ease-spring) infinite alternate' }}
                >
                    🎬
                </div>

                {/* Title — Bebas Neue, massive, layered yellow glow
                    Using font-display class (not font-black — Bebas ignores weight).
                    clamp keeps it from overflowing 320px screens. */}
                <h1
                    className="font-display uppercase leading-none text-[var(--color-accent)]"
                    style={{
                        fontSize:      'clamp(3.5rem, 18vw, 5rem)',
                        letterSpacing: 'var(--tracking-display)',
                        textShadow: [
                            '0 0 15px rgba(245,200,0,0.55)',
                            '0 0 40px rgba(245,200,0,0.32)',
                            '0 0 90px rgba(245,200,0,0.15)',
                        ].join(', '),
                    }}
                >
                    ReelGuess
                </h1>

                {/* Tagline — body copy weight, not font-black
                    font-black on Inter for a tagline is too aggressive next to
                    the display headline. font-sans semibold at --text-body-sm
                    reads as a subtitle, not a competing heading. */}
                <p
                    className="font-sans font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)] mt-2 mb-8"
                    style={{ fontSize: 'var(--text-body-sm)' }}
                >
                    Guess which friend liked the Reel
                </p>

                {/* ── HOW TO PLAY strip ───────────────────────────────────── */}
                <div className="grid grid-cols-3 border-2 border-[var(--color-border-subtle)] shadow-brutal">
                    {HOW_TO_PLAY.map(({ step, emoji, label }, i) => (
                        <div
                            key={i}
                            className={[
                                'flex flex-col items-center gap-2 py-3.5 px-2',
                                i < HOW_TO_PLAY.length - 1
                                    ? 'border-r-2 border-[var(--color-border-subtle)]'
                                    : '',
                            ].join(' ')}
                        >
                            {/* Step number — accent, display font, small */}
                            <span
                                className="font-display text-[var(--color-accent)]"
                                style={{
                                    fontSize:      'var(--text-label-xs)',
                                    letterSpacing: '0.2em',
                                }}
                            >
                                {step}
                            </span>

                            {/* Emoji */}
                            <span className="text-xl leading-none">{emoji}</span>

                            {/* Label — display font, label size, muted
                                Was text-[0.6rem] (9.6px). Now --text-label-xs (10px) via
                                the token — consistent with other labels in the system. */}
                            <span
                                className="font-display uppercase text-[var(--color-muted)] leading-tight text-center"
                                style={{
                                    fontSize:      'var(--text-label-xs)',
                                    letterSpacing: 'var(--tracking-label)',
                                }}
                            >
                                {label}
                            </span>
                        </div>
                    ))}
                </div>

            </header>

            {/* ── ACTION PANEL ─────────────────────────────────────────────── */}
            <div className="w-full max-w-sm flex flex-col gap-0">
                <CreateLobbySection />
                <div className="divider py-3">or</div>
                <JoinLobbySection />
                <div className="divider py-3">my reels</div>
                <ManageReelsSection />
            </div>

            {/* ── FOOTER ───────────────────────────────────────────────────── */}
            <footer className="my-10 text-center">
                <p
                    className="font-display uppercase text-[var(--color-faint)]"
                    style={{
                        fontSize:      'var(--text-label-xs)',
                        letterSpacing: '0.25em',
                    }}
                >
                    Made with ❤️
                </p>
            </footer>

        </main>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────

const HOW_TO_PLAY = [
    { step: '01', emoji: '📥', label: 'Import Reels' },
    { step: '02', emoji: '🎮', label: 'Create Lobby' },
    { step: '03', emoji: '🏆', label: 'Guess & Win'  },
] as const