import { ResultAsync }       from 'neverthrow'
import { createClient }      from '@/lib/supabase/server'
import { mapReelRow }        from './mappers'
import { toAppError }        from '@/lib/errors/error-handler'
import type { Reel }         from './types'
import type { ReelImportError } from './errors'
import {UnusedReelRowSchema} from "./validations";

// ─────────────────────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches all reels imported by a specific player in a lobby.
 *
 * Raw Supabase data is passed directly to `mapReelRow` as `unknown`.
 * `mapReelRow` runs `ReelRowSchema.parse` internally — no cast needed.
 */
export function getReelsByPlayer(
    lobbyId:  string,
    playerId: string,
): ResultAsync<Reel[], ReelImportError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('reels')
                .select('id, lobby_id, owner_id, instagram_url, used, created_at')
                .eq('lobby_id', lobbyId)
                .eq('owner_id', playerId)

            if (error) throw { type: 'REEL_DATABASE_ERROR', message: error.message } satisfies ReelImportError

            // Pass each row as unknown — mapReelRow validates via ReelRowSchema.
            return (data ?? []).map((row) => mapReelRow(row))
        })(),
        (e) => toAppError<ReelImportError>(e, 'REEL_DATABASE_ERROR'),
    )
}

/**
 * Returns the distinct set of player IDs who have already imported reels for
 * a lobby, filtered to the provided candidate list.
 *
 * Single `.in()` query — no N+1. Used by the lobby service to surface which
 * players are still missing their reels.
 */
export function getReelOwnersByLobby(
    lobbyId:   string,
    playerIds: string[],
): ResultAsync<Set<string>, ReelImportError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('reels')
                .select('owner_id')
                .eq('lobby_id', lobbyId)
                .in('owner_id', playerIds)

            if (error) throw { type: 'REEL_DATABASE_ERROR', message: error.message } satisfies ReelImportError
            return new Set((data ?? []).map((r) => r.owner_id as string))
        })(),
        (e) => toAppError<ReelImportError>(e, 'REEL_DATABASE_ERROR'),
    )
}

/**
 * Returns all unused reels for a lobby — only the columns needed to start a round.
 * Used by the game service to pick the next reel; keeps Supabase out of the service layer.
 *
 * Partial rows are validated via {@link UnusedReelRowSchema} — no `as string` casts.
 */
export function getUnusedReels(
    lobbyId: string,
): ResultAsync<Array<{ id: string; ownerId: string; instagramUrl: string }>, ReelImportError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('reels')
                .select('id, owner_id, instagram_url')
                .eq('lobby_id', lobbyId)
                .eq('used', false)

            if (error) throw { type: 'REEL_DATABASE_ERROR', message: error.message } satisfies ReelImportError

            return (data ?? []).map((r) => {
                const validated = UnusedReelRowSchema.parse(r)
                return {
                    id:           validated.id,
                    ownerId:      validated.owner_id,
                    instagramUrl: validated.instagram_url,
                }
            })
        })(),
        (e) => toAppError<ReelImportError>(e, 'REEL_DATABASE_ERROR'),
    )
}

/**
 * Returns only the UNUSED reels for a specific player in a lobby.
 *
 * Used as a server-side fallback when creating a rematch: if a returning
 * player's local reel pool is insufficient, these unused reels from the
 * previous game are seeded into the new lobby so the game can still start.
 *
 * Partial rows are validated via {@link UnusedReelRowSchema} — no `as string` casts.
 *
 * @param lobbyId  - Source lobby.
 * @param playerId - Player whose unused reels to fetch.
 */
export function getUnusedReelsByPlayer(
    lobbyId:  string,
    playerId: string,
): ResultAsync<Array<{ id: string; ownerId: string; instagramUrl: string }>, ReelImportError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('reels')
                .select('id, owner_id, instagram_url')
                .eq('lobby_id', lobbyId)
                .eq('owner_id', playerId)
                .eq('used', false)

            if (error) throw { type: 'REEL_DATABASE_ERROR', message: error.message } satisfies ReelImportError

            return (data ?? []).map((r) => {
                const validated = UnusedReelRowSchema.parse(r)
                return {
                    id:           validated.id,
                    ownerId:      validated.owner_id,
                    instagramUrl: validated.instagram_url,
                }
            })
        })(),
        (e) => toAppError<ReelImportError>(e, 'REEL_DATABASE_ERROR'),
    )
}

