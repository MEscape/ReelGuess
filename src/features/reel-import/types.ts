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
// DB / game layer
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
