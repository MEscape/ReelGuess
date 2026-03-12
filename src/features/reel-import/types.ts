/**
 * Reel Import — domain types.
 *
 * Single source of truth for all types used across the reel-import feature.
 * Re-exported by the feature barrel so consumers import from one place.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Local store
// ─────────────────────────────────────────────────────────────────────────────

/** A single locally-stored Instagram Reel URL. */
export type LocalReel = {
    /** Clean Instagram Reel URL — e.g. https://www.instagram.com/reel/ABC123/ */
    url:        string
    /** Unix timestamp (Date.now()) when this reel was imported. */
    importedAt: number
}

export type LocalReelStore = {
    reels:   LocalReel[]
    /** Schema version — increment when the shape changes. */
    version: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Import result
// ─────────────────────────────────────────────────────────────────────────────

/** Returned by `addReels()` to drive UI feedback. */
export type AddReelsResult = {
    reels:      LocalReel[]
    added:      number
    duplicates: number
    total:      number
}

// ─────────────────────────────────────────────────────────────────────────────
// DB / game layer (kept here so lobby/game features import from one place)
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