import { CreateLobbySection } from './HomeClient'
import { JoinLobbySection }   from './HomeClient'

export default function HomePage() {
    return (
        <main className="min-h-dvh flex flex-col items-center justify-center px-4 py-10 pb-safe">
            {/* Hero */}
            <div className="text-center mb-12 max-w-lg">
                <div className="text-8xl mb-4">🎬</div>
                <h1 className="text-6xl sm:text-7xl font-black uppercase tracking-tight text-[var(--color-accent)] drop-shadow-[0_0_15px_rgba(250,204,21,0.3)]">
                    ReelGuess
                </h1>
                <p className="text-base text-[var(--color-muted)] mt-2 font-bold">
                    Guess which friend liked the Reel!
                </p>
                <div className="mt-5 flex flex-col gap-1.5 text-sm text-[var(--color-subtle)]">
                    <p>🎮 <span className="text-[var(--color-muted)] font-semibold">Create a lobby</span> and invite friends</p>
                    <p>📱 <span className="text-[var(--color-muted)] font-semibold">Import liked Reels</span> from Instagram</p>
                    <p>🏆 <span className="text-[var(--color-muted)] font-semibold">Guess &amp; score</span> to win!</p>
                </div>
            </div>

            {/* CTAs */}
            <div className="w-full max-w-sm flex flex-col gap-3">
                <CreateLobbySection />
                <div className="divider">
                    <span className="text-[var(--color-faint)] text-xs font-black uppercase">or</span>
                </div>
                <JoinLobbySection />
            </div>

            <footer className="mt-12 text-center text-xs text-[var(--color-faint)]">
                <p>Made with ❤️ and memes</p>
            </footer>
        </main>
    )
}
