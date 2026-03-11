import { z } from 'zod'

// ─────────────────────────────────────────────────────────────────────────────
// Validations
// ─────────────────────────────────────────────────────────────────────────────

/** Minimum number of reels required before a player can submit. */
export const MIN_REELS = 3

/** Maximum reels imported per player — prevents abuse and keeps games balanced. */
export const MAX_REELS = 50

/**
 * Validates the payload sent to {@link importReelsAction}.
 * Enforces min/max reel count and URL format.
 */
export const ImportReelsSchema = z.object({
    lobbyId:  z.string().length(6),
    playerId: z.string().uuid(),
    reelUrls: z
        .array(z.string().url())
        .min(MIN_REELS, `Import at least ${MIN_REELS} reels`)
        .max(MAX_REELS, `Maximum ${MAX_REELS} reels per player`),
})

export type ImportReelsInput = z.infer<typeof ImportReelsSchema>