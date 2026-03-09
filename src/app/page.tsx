import { CreateLobbySection } from "./CreateLobbySection";
import { JoinLobbySection } from "./JoinLobbySection";

export default function HomePage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-12 max-w-lg">
        <div className="text-8xl mb-4">🎬</div>
        <h1 className="text-6xl sm:text-7xl font-black uppercase tracking-tight text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.3)]">
          ReelGuess
        </h1>
        <p className="text-xl text-zinc-300 mt-3 font-bold">
          Guess which friend liked the Reel! 🤔
        </p>
        <div className="mt-6 flex flex-col gap-2 text-sm text-zinc-400">
          <p>
            🎮{" "}
            <span className="text-zinc-200 font-semibold">Create a lobby</span>{" "}
            and invite your friends
          </p>
          <p>
            📱{" "}
            <span className="text-zinc-200 font-semibold">Import liked Reels</span>{" "}
            from Instagram
          </p>
          <p>
            🏆{" "}
            <span className="text-zinc-200 font-semibold">Guess & score points</span>{" "}
            to win!
          </p>
        </div>
      </div>

      {/* CTAs */}
      <div className="w-full max-w-sm space-y-4">
        <CreateLobbySection />

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-zinc-600 text-sm font-bold uppercase">or</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        <JoinLobbySection />
      </div>

      {/* Footer */}
      <footer className="mt-16 text-center text-xs text-zinc-700">
        <p>Made with ❤️ and memes</p>
      </footer>
    </main>
  );
}
