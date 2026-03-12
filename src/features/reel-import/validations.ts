import { z } from 'zod'

/**
 * Reel Import — validation constants.
 *
 * Two separate limits exist with different purposes:
 *
 * LOCAL_MAX_REELS — local pool (localStorage only)
 *   How many reels a user can store locally. Set high so a full Instagram
 *   liked_posts.json export can be saved without truncation. The local pool
 *   is never sent to the DB at import time — only at join/create time.
 *
 * MAX_REELS — DB / game session cap
 *   How many reels are submitted to the DB when a player joins or creates a
 *   lobby. Keeps the game balanced and DB costs low regardless of local pool size.
 */

/** Maximum reels stored in the local localStorage pool. No game-balance concern here. */
export const LOCAL_MAX_REELS = 500

/** Minimum reels in the local pool before a player can join / create a lobby. */
export const MIN_REELS = 3

/** Maximum reels submitted per player per game session (DB cap). */
export const MAX_REELS = 50

/**
 * Validates the payload for submitting a player's local reel pool on lobby join.
 *
 * `reelUrls` is the full local pool (no cap yet) — this action applies
 * `selectGameReels` to randomly pick and cap at MAX_REELS server-side,
 * preventing a client from cherry-picking which reels enter the game.
 */
export const SubmitReelsSchema = z.object({
    lobbyId: z.string().length(6),
    playerId: z.string().uuid(),
    reelUrls: z
        .array(z.string().url())
        .min(MIN_REELS, `You need at least ${MIN_REELS} reels to play`),
})

export type SubmitReelsInput = z.infer<typeof SubmitReelsSchema>

