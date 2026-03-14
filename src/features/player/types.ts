// ─────────────────────────────────────────────────────────────────────────────
// Player domain type
// ─────────────────────────────────────────────────────────────────────────────

/** CamelCase representation of a `players` table row. */
export type Player = {
    id:          string
    lobbyId:     string
    displayName: string
    avatarSeed:  string
    isHost:      boolean
    /** Parsed from ISO 8601 — always a valid Date after mapping. */
    joinedAt:    Date
}
