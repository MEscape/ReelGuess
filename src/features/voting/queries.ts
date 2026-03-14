import { ResultAsync }    from 'neverthrow'
import { createClient }   from '@/lib/supabase/server'
import { mapVoteRow }     from './mappers'
import { toAppError }     from '@/lib/errors/error-handler'
import type { Vote }      from './types'
import type { GameError } from '@/features/game'

// ─────────────────────────────────────────────────────────────────────────────
// Query
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns all votes cast for a given round.
 *
 * Used by the service layer to check for duplicate votes and to determine
 * whether all players have voted (auto-reveal trigger).
 *
 * The error mapper uses `String(e)` rather than `e as GameError` so that
 * a `ZodError` thrown by {@link mapVoteRow} surfaces with a readable message
 * rather than a broken discriminant (the `type` field would be `undefined`
 * on a raw `ZodError`).
 */
export function getVotesForRound(roundId: string): ResultAsync<Vote[], GameError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('votes')
                .select('id, round_id, voter_id, voted_for_id, is_correct, submitted_at, vote_time_ms, used_double, points_awarded')
                .eq('round_id', roundId)

            if (error) throw { type: 'GAME_DATABASE_ERROR', message: error.message } satisfies GameError
            return (data as unknown[]).map(mapVoteRow)
        })(),
        (e): GameError => toAppError<GameError>(e, 'GAME_DATABASE_ERROR'),
    )
}

/**
 * Returns `true` if the given player has cast a vote in the given round.
 *
 * Uses `SELECT id ... LIMIT 1` (via `.maybeSingle()`) rather than loading
 * and mapping the full `Vote[]` result set. This avoids the over-fetch that
 * occurred when `checkExistingVoteAction` previously delegated to
 * `getVotesForRound` and called `.some()` on the result.
 */
export function checkPlayerVoted(
    roundId:  string,
    playerId: string,
): ResultAsync<boolean, GameError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('votes')
                .select('id')
                .eq('round_id', roundId)
                .eq('voter_id', playerId)
                .maybeSingle()

            if (error) throw { type: 'GAME_DATABASE_ERROR', message: error.message } satisfies GameError
            return data !== null
        })(),
        (e): GameError => toAppError<GameError>(e, 'GAME_DATABASE_ERROR'),
    )
}
