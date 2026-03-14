import { ResultAsync }       from 'neverthrow'
import { createClient }      from '@/lib/supabase/server'
import { mapRoundRow }       from './mappers'
import { toAppError }        from '@/lib/errors/error-handler'
import type { Round }        from './types'
import type { ReelData }     from '@/features/reel-player'
import type { GameError }    from '@/features/game'

// ─────────────────────────────────────────────────────────────────────────────
// Rounds
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the most recent round for a lobby, or null if none has started.
 *
 * Uses a single indexed query ordered by `round_number DESC LIMIT 1`.
 */
export function getCurrentRound(lobbyId: string): ResultAsync<Round | null, GameError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('rounds')
                .select('*')
                .eq('lobby_id', lobbyId)
                .order('round_number', { ascending: false })
                .limit(1)
                .maybeSingle()

            if (error) throw { type: 'GAME_DATABASE_ERROR', message: error.message } satisfies GameError
            return data ? mapRoundRow(data) : null
        })(),
        (e) => toAppError<GameError>(e, 'GAME_DATABASE_ERROR'),
    )
}

/**
 * Returns a round by its UUID. Throws `ROUND_NOT_FOUND` if absent.
 */
export function getRoundById(roundId: string): ResultAsync<Round, GameError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('rounds')
                .select('*')
                .eq('id', roundId)
                .single()

            if (error || !data) throw { type: 'ROUND_NOT_FOUND', roundId } satisfies GameError
            return mapRoundRow(data)
        })(),
        (e) => toAppError<GameError>(e, 'GAME_DATABASE_ERROR'),
    )
}

/**
 * Returns the number of votes cast for a round via a HEAD query (no data transfer).
 * Used to seed vote count on page refresh so the progress bar is accurate.
 */
export function getVoteCountForRound(roundId: string): ResultAsync<number, GameError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase = createClient()
            const { count, error } = await supabase
                .from('votes')
                .select('id', { count: 'exact', head: true })
                .eq('round_id', roundId)

            if (error) throw { type: 'GAME_DATABASE_ERROR', message: error.message } satisfies GameError
            return count ?? 0
        })(),
        (e) => toAppError<GameError>(e, 'GAME_DATABASE_ERROR'),
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Reels
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches the Instagram URL for a reel by its ID.
 *
 * Only `instagram_url` is selected — a single indexed PK lookup.
 *
 * ### Usage
 * Called by `src/app/(game)/game/[code]` to resolve reel data for display.
 * Exported `@dalonly` from the barrel — do not import in components or hooks.
 *
 * Not used internally by `startNextRound` (which gets the URL via
 * `getUnusedReels` in a single query).
 */
export function getReelForRound(reelId: string): ResultAsync<ReelData, GameError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('reels')
                .select('instagram_url')
                .eq('id', reelId)
                .maybeSingle()

            if (error) throw { type: 'GAME_DATABASE_ERROR', message: error.message } satisfies GameError
            if (!data)  throw { type: 'ROUND_NOT_FOUND', roundId: reelId }          satisfies GameError
            return { instagramUrl: data.instagram_url as string }
        })(),
        (e) => toAppError<GameError>(e, 'GAME_DATABASE_ERROR'),
    )
}
