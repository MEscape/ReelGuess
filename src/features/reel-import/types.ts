// ─────────────────────────────────────────────────────────────────────────────
// Reel domain types
// ─────────────────────────────────────────────────────────────────────────────

/** CamelCase representation of a `reels` table row. */
export type Reel = {
    id:           string
    lobbyId:      string
    ownerId:      string
    instagramUrl: string
    used:         boolean
    createdAt:    Date
}

/** @internal Raw DB row from the `reels` table (only columns we actually read). */
export type ReelRow = {
    id:            string
    lobby_id:      string
    owner_id:      string
    instagram_url: string
    used:          boolean
    created_at:    string
}

/** Converts a raw `reels` DB row to the typed {@link Reel} shape. */
export function mapReelRow(row: ReelRow): Reel {
    return {
        id:           row.id,
        lobbyId:      row.lobby_id,
        ownerId:      row.owner_id,
        instagramUrl: row.instagram_url,
        used:         row.used,
        createdAt:    new Date(row.created_at),
    }
}
