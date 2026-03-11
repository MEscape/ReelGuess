import type { Player } from '@/features/player/types'
import { mapPlayerRow, type PlayerRow } from '@/features/player/types'

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

// ─────────────────────────────────────────────────────────────────────────────
// Raw DB row
// ─────────────────────────────────────────────────────────────────────────────

/** @internal */
export type LobbyRow = {
    id:         string
    host_id:    string
    status:     string
    settings:   { rounds_count: number; timer_seconds: number }
    created_at: string
    players?:   PlayerRow[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Mapper
// ─────────────────────────────────────────────────────────────────────────────

/** Converts a raw `lobbies` DB row (with joined players) to a {@link Lobby}. */
export function mapLobbyRow(row: LobbyRow): Lobby {
    return {
        id:        row.id,
        hostId:    row.host_id,
        status:    row.status as LobbyStatus,
        settings: {
            roundsCount:  row.settings.rounds_count,
            timerSeconds: row.settings.timer_seconds,
        },
        players:   (row.players ?? []).map(mapPlayerRow),
        createdAt: new Date(row.created_at),
    }
}