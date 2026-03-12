'use server'

/**
 * Reel Import — service layer.
 *
 * Dependency direction: actions.ts (lobby-join) → service.ts → DAL
 *
 * This service is called by the lobby feature when a player joins — it selects
 * reels from their local pool and writes them to the DB for the game session.
 * The client-side import flow (file parsing → localStorage) is fully separate
 * and does not touch this layer at all.
 */

import { err, type Result } from 'neverthrow'
import { getReelsByPlayer } from './queries'
import { insertReels }      from './mutations'
import type { ReelImportError } from './errors'
import type { Reel }            from './types'

/**
 * Persists a player's reel selection for a game session.
 *
 * Business rules:
 * - Idempotency guard: if the player has already submitted reels for this
 *   lobby, return the existing set rather than inserting duplicates.
 * - `reelUrls` must already be shuffled and capped at MAX_REELS by the caller
 *   (the lobby-join action does this via `selectGameReels`).
 *
 * @param lobbyId  - Target lobby.
 * @param playerId - Player submitting their reels.
 * @param reelUrls - Shuffled, capped Instagram Reel URLs from the local pool.
 */
export async function importReelsForPlayer(
    lobbyId:  string,
    playerId: string,
    reelUrls: string[],
): Promise<Result<Reel[], ReelImportError>> {
    const existing = await getReelsByPlayer(lobbyId, playerId)
    if (existing.isErr()) return err(existing.error)

    // Idempotent — return what's already there instead of inserting duplicates
    if (existing.value.length > 0) return existing as Result<Reel[], ReelImportError>

    return insertReels(lobbyId, playerId, reelUrls)
}