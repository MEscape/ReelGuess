import { ResultAsync }          from 'neverthrow'
import { toAppError }          from '@/lib/errors/error-handler'
import { createClient }        from '@/lib/supabase/server'
import { mapReelRow }           from './mappers'
import type { Reel }            from './types'
import type { ReelImportError } from './errors'

/**
 * Bulk-inserts reel URLs for a player in a single DB round-trip.
 *
 * Raw Supabase data is passed directly to `mapReelRow` as `unknown`.
 * `mapReelRow` runs `ReelRowSchema.parse` internally — no `as unknown as`
 * cast is needed or safe here.
 *
 * @param lobbyId  - Target lobby.
 * @param playerId - Player who owns these reels.
 * @param reelUrls - Pre-validated, pre-shuffled Instagram Reel URLs.
 */
export function insertReels(
    lobbyId:  string,
    playerId: string,
    reelUrls: string[],
): ResultAsync<Reel[], ReelImportError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase = createClient()
            const rows = reelUrls.map((url) => ({
                lobby_id:      lobbyId,
                owner_id:      playerId,
                instagram_url: url,
                used:          false,
            }))

            const { data, error } = await supabase
                .from('reels')
                .insert(rows)
                .select('id, lobby_id, owner_id, instagram_url, used, created_at')

            if (error || !data) {
                throw {
                    type:    'REEL_DATABASE_ERROR',
                    message: error?.message ?? 'Failed to insert reels',
                } satisfies ReelImportError
            }

            // Pass each row as unknown — mapReelRow validates via ReelRowSchema.
            return (data ?? []).map((row) => mapReelRow(row))
        })(),
        (e) => toAppError<ReelImportError>(e, 'REEL_DATABASE_ERROR'),
    )
}

/**
 * Marks a single reel as used so it won't be picked again this game.
 * Called by the game service after selecting a reel for a round.
 *
 * @param reelId - The reel to mark as used.
 */
export function markReelUsed(reelId: string): ResultAsync<void, ReelImportError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase = createClient()
            const { error } = await supabase
                .from('reels')
                .update({ used: true })
                .eq('id', reelId)

            if (error) throw { type: 'REEL_DATABASE_ERROR', message: error.message } satisfies ReelImportError
        })(),
        (e) => toAppError<ReelImportError>(e, 'REEL_DATABASE_ERROR'),
    )
}

/**
 * Rolls back a reel mark (sets `used = false`).
 *
 * Called by the game service when `createRound` fails after `markReelUsed`
 * has already succeeded, preventing a reel from being permanently consumed
 * without an associated round (TOCTOU race rollback).
 *
 * @param reelId - The reel to restore to unused state.
 */
export function unmarkReelUsed(reelId: string): ResultAsync<void, ReelImportError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase = createClient()
            const { error } = await supabase
                .from('reels')
                .update({ used: false })
                .eq('id', reelId)

            if (error) throw { type: 'REEL_DATABASE_ERROR', message: error.message } satisfies ReelImportError
        })(),
        (e) => toAppError<ReelImportError>(e, 'REEL_DATABASE_ERROR'),
    )
}

/**
 * Copies all reels from an old lobby into a new lobby in a single bulk INSERT.
 *
 * Each reel is inserted with `used = false` so the new game starts fresh.
 * `owner_id` is remapped via `playerIdMap` (old UUID → new UUID) so FK
 * constraints are satisfied in the new lobby.
 *
 * Reels with no corresponding entry in `playerIdMap` are skipped (e.g. if a
 * player did not re-join).
 *
 * @param reels       - All reels from the old lobby.
 * @param newLobbyId  - Target lobby code.
 * @param playerIdMap - Map from old player UUID → new player UUID.
 */
export function copyReelsToNewLobby(
    reels:       Array<{ id: string; ownerId: string; instagramUrl: string }>,
    newLobbyId:  string,
    playerIdMap: Map<string, string>,
): ResultAsync<void, ReelImportError> {
    return ResultAsync.fromPromise(
        (async () => {
            if (reels.length === 0) return

            const supabase = createClient()

            const rows = reels
                .map((r) => {
                    const newOwnerId = playerIdMap.get(r.ownerId)
                    if (!newOwnerId) return null
                    return {
                        lobby_id:      newLobbyId,
                        owner_id:      newOwnerId,
                        instagram_url: r.instagramUrl,
                        used:          false,
                    }
                })
                .filter((r): r is NonNullable<typeof r> => r !== null)

            if (rows.length === 0) return

            const { error } = await supabase.from('reels').insert(rows)
            if (error) throw { type: 'REEL_DATABASE_ERROR', message: error.message } satisfies ReelImportError
        })(),
        (e) => toAppError<ReelImportError>(e, 'REEL_DATABASE_ERROR'),
    )
}

