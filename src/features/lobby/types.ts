import type { Player } from '@/features/player'

// ─────────────────────────────────────────────────────────────────────────────
// Lobby domain types
// ─────────────────────────────────────────────────────────────────────────────

export type LobbyStatus = 'waiting' | 'playing' | 'finished'

/** Configurable game settings stored as JSONB in the `lobbies` table. */
export type GameSettings = {
    /** Total number of rounds to play. */
    roundsCount:  number
    /** Seconds each player has to vote per round. */
    timerSeconds: number
    /**
     * Code of the rematch lobby created from this lobby.
     * Set atomically when a rematch is created; used to de-duplicate concurrent
     * rematch requests and to redirect all clients to the new lobby.
     */
    rematchId?: string
}

/** CamelCase representation of a `lobbies` table row, including joined players. */
export type Lobby = {
    id:        string
    hostId:    string
    status:    LobbyStatus
    settings:  GameSettings
    players:   Player[]
    createdAt: Date
}

export type LobbySettings = {
    roundsCount:  number
    timerSeconds: number
}
