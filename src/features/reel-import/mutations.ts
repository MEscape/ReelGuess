import { ResultAsync } from 'neverthrow'
import { createClient } from '@/lib/supabase/server'
import type { Reel, ReelRow } from './types'
import { mapReelRow } from './types'
import type { ReelImportError } from './errors'

/**
 * Bulk-inserts reel URLs for a player in a single DB round-trip.
 *
 * @param lobbyId   - Target lobby.
 * @param playerId  - Player who owns these reels.
 * @param reelUrls  - Array of Instagram Reel URLs (already validated and shuffled).
 */
export function insertReels(
    lobbyId: string,
    playerId: string,
    reelUrls: string[],
): ResultAsync<Reel[], ReelImportError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase = await createClient()
            // Only insert the columns we actually use — embed_html / thumbnail_url / caption
            // are always null and we no longer track them.
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
                throw { type: 'REEL_DATABASE_ERROR', message: error?.message ?? 'Failed to insert reels' } satisfies ReelImportError
            }
            return (data as unknown as ReelRow[]).map(mapReelRow)
        })(),
        (e) => e as ReelImportError,
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
            const supabase = await createClient()
            const { error } = await supabase
                .from('reels')
                .update({ used: true })
                .eq('id', reelId)

            if (error) throw { type: 'REEL_DATABASE_ERROR', message: error.message } satisfies ReelImportError
        })(),
        (e) => e as ReelImportError,
    )
}
