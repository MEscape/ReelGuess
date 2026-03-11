'use server'

/**
 * Reel Import Service Layer — pure business logic.
 *
 * Dependency direction:  actions.ts → service.ts → DAL (queries / insertReels)
 */

import { err, type Result }        from 'neverthrow'
import { getReelsByPlayer } from './queries'
import { insertReels }      from './mutations'
import type { ReelImportError }    from './errors'
import type { Reel }               from './types'

// ─────────────────────────────────────────────────────────────────────────────
// importReelsForPlayer
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Imports reels for a player, enforcing the "import once" rule.
 *
 * Business rules:
 * - A player may only import once (idempotency guard). Calling again returns
 *   `REELS_ALREADY_IMPORTED` — callers should treat this as a non-fatal warning.
 * - Delegates to {@link insertReels} for the actual DB write.
 *
 * @param lobbyId  - Target lobby.
 * @param playerId - Player importing the reels.
 * @param reelUrls - Shuffled, deduplicated Instagram Reel URLs (already validated).
 */
export async function importReelsForPlayer(
    lobbyId: string,
    playerId: string,
    reelUrls: string[],
): Promise<Result<Reel[], ReelImportError>> {
    const existing = await getReelsByPlayer(lobbyId, playerId)
    if (existing.isErr()) return err(existing.error)
    if (existing.value.length > 0) return err({ type: 'REELS_ALREADY_IMPORTED', playerId })

    return insertReels(lobbyId, playerId, reelUrls)
}
