import { ResultAsync }       from 'neverthrow'
import { createClient }      from '@/lib/supabase/server'
import { mapReelRow }        from './types'
import type { Reel, ReelRow } from './types'
import type { ReelImportError } from './errors'

/**
 * Fetches all reels imported by a specific player in a lobby.
 * Used by the game layer to enforce "no duplicate import" and to check status.
 */
export function getReelsByPlayer(
    lobbyId:  string,
    playerId: string,
): ResultAsync<Reel[], ReelImportError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase = await createClient()
            const { data, error } = await supabase
                .from('reels')
                .select('id, lobby_id, owner_id, instagram_url, used, created_at')
                .eq('lobby_id', lobbyId)
                .eq('owner_id', playerId)

            if (error) throw { type: 'REEL_DATABASE_ERROR', message: error.message } satisfies ReelImportError
            return (data as unknown as ReelRow[]).map(mapReelRow)
        })(),
        (e) => e as ReelImportError,
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
            const supabase = await createClient()
            const { data, error } = await supabase
                .from('reels')
                .select('owner_id')
                .eq('lobby_id', lobbyId)
                .in('owner_id', playerIds)

            if (error) throw { type: 'REEL_DATABASE_ERROR', message: error.message } satisfies ReelImportError
            return new Set((data ?? []).map((r) => r.owner_id as string))
        })(),
        (e) => e as ReelImportError,
    )
}

/**
 * Returns all unused reels for a lobby — only the columns needed to start a round.
 * Used by the game service to pick the next reel; keeps Supabase out of the service layer.
 */
export function getUnusedReels(
    lobbyId: string,
): ResultAsync<Array<{ id: string; ownerId: string; instagramUrl: string }>, ReelImportError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase = await createClient()
            const { data, error } = await supabase
                .from('reels')
                .select('id, owner_id, instagram_url')
                .eq('lobby_id', lobbyId)
                .eq('used', false)

            if (error) throw { type: 'REEL_DATABASE_ERROR', message: error.message } satisfies ReelImportError
            return (data ?? []).map((r) => ({
                id:           r.id           as string,
                ownerId:      r.owner_id     as string,
                instagramUrl: r.instagram_url as string,
            }))
        })(),
        (e) => e as ReelImportError,
    )
}