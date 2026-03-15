import React from "react";

/**
 * Game route group layout.
 *
 * All game/lobby pages are full-screen immersive experiences.
 * The global site footer is hidden via the `game-layout` class so it doesn't
 * overlap content or eat bottom space.
 * Pages add their own `pb-safe` padding where needed.
 */
export default function GameLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="game-layout">
            {children}
        </div>
    )
}