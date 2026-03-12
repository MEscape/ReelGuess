import { z } from 'zod'

/**
 * Reel Import — validation constants.
 *
 * The ImportReelsSchema (server action) has been removed — reel import is now
 * fully client-side (localStorage). These constants are still used by the
 * game layer when selecting reels on lobby join.
 */

/** Minimum reels in the local pool before a player can join / create a lobby. */
export const MIN_REELS = 3

/** Maximum reels submitted per player per game session. */
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