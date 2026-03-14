import { ResultAsync }         from 'neverthrow'
import { createClient }        from '@/lib/supabase/server'
import { mapVoteRow }          from './mappers'
import { toAppError }          from '@/lib/errors/error-handler'
import type { Vote }           from './types'
import type { GameError }      from '@/features/game'

// ─────────────────────────────────────────────────────────────────────────────
// Mutation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Inserts a player's vote for a round and returns the created {@link Vote}.
 *
 * `isCorrect` is computed in the service layer (not via a DB trigger) so the
 * business rule stays testable without a live database.
 *
 * `voteTimeMs` records milliseconds elapsed from round start to submission
 * and is used by the scoring engine at reveal time.
 *
 * The error mapper uses `e instanceof Error ? e.message : String(e)` rather
 * than `e as GameError` to ensure a `ZodError` from {@link mapVoteRow} surfaces
 * with a readable message and a valid `GAME_DATABASE_ERROR` discriminant.
 */
export function insertVote(
    roundId:    string,
    voterId:    string,
    votedForId: string,
    isCorrect:  boolean,
    voteTimeMs: number,
): ResultAsync<Vote, GameError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('votes')
                .insert({
                    round_id:     roundId,
                    voter_id:     voterId,
                    voted_for_id: votedForId,
                    is_correct:   isCorrect,
                    vote_time_ms: voteTimeMs,
                })
                .select()
                .single()

            if (error || !data) {
                throw {
                    type:    'GAME_DATABASE_ERROR',
                    message: error?.message ?? 'Failed to insert vote',
                } satisfies GameError
            }

            // Pass `data` as `unknown` directly — mapVoteRow accepts unknown
            // and runs Zod validation internally, so no pre-cast is needed.
            return mapVoteRow(data as unknown)
        })(),
        (e): GameError => toAppError<GameError>(e, 'GAME_DATABASE_ERROR'),
    )
}

/**
 * Sets `used_double = true` on a player's existing vote for a round.
 *
 * The predicate `.eq('used_double', false)` makes this idempotent —
 * activating Double-or-Nothing twice in quick succession is safe.
 */
export function updateVoteDouble(
    roundId: string,
    voterId: string,
): ResultAsync<void, GameError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase = createClient()
            const { error } = await supabase
                .from('votes')
                .update({ used_double: true })
                .eq('round_id', roundId)
                .eq('voter_id', voterId)
                .eq('used_double', false)

            if (error) throw { type: 'GAME_DATABASE_ERROR', message: error.message } satisfies GameError
        })(),
        (e): GameError => toAppError<GameError>(e, 'GAME_DATABASE_ERROR'),
    )
}

/**
 * Persists the `points_awarded` value for each vote after scoring.
 *
 * Called by `revealRound` after `calculateRoundScores` so that every
 * subsequent read of the votes table — including the non-winner concurrent
 * caller path — sees the final `points_awarded` value rather than `null`.
 *
 * Runs all updates in parallel. Non-fatal per-vote errors are collected and
 * surfaced as a single aggregated error if any fail.
 */
export function batchUpdateVotePoints(
    votes: Array<{ id: string; pointsAwarded: number | null }>,
): ResultAsync<void, GameError> {
    return ResultAsync.fromPromise(
        (async () => {
            if (votes.length === 0) return
            const supabase = createClient()
            const updates = votes
                .filter((v) => v.pointsAwarded !== null)
                .map((v) =>
                    supabase
                        .from('votes')
                        .update({ points_awarded: v.pointsAwarded })
                        .eq('id', v.id),
                )
            const results = await Promise.all(updates)
            const failed  = results.filter((r) => r.error)
            if (failed.length > 0) {
                throw {
                    type:    'GAME_DATABASE_ERROR',
                    message: `Failed to update points_awarded for ${failed.length} vote(s): ${failed[0]!.error!.message}`,
                } satisfies GameError
            }
        })(),
        (e): GameError => toAppError<GameError>(e, 'GAME_DATABASE_ERROR'),
    )
}
