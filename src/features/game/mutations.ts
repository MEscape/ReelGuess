import { ResultAsync }                  from 'neverthrow'
import { createServiceClient }         from '@/lib/supabase/service'
import { mapRoundRow, mapVoteRow }     from './types'
import type { Round, RoundRow, Vote, VoteRow, RoundStatus } from './types'
import type { GameError }              from './errors'
import type { Achievement }            from '@/features/scoring/types'
import { calculateRoundScore }         from '@/features/scoring/service'

// ─────────────────────────────────────────────────────────────────────────────
// Rounds
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Inserts a new round row with status `voting`.
 *
 * @param lobbyId         - Lobby the round belongs to.
 * @param roundNumber     - 1-based sequence number within the lobby.
 * @param reelId          - The reel that will be shown this round.
 * @param correctPlayerId - The player who liked this reel (the answer).
 */
export function createRound(
    lobbyId:         string,
    roundNumber:     number,
    reelId:          string,
    correctPlayerId: string,
): ResultAsync<Round, GameError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase = createServiceClient()
            const { data, error } = await supabase
                .from('rounds')
                .insert({
                    lobby_id:          lobbyId,
                    round_number:      roundNumber,
                    reel_id:           reelId,
                    correct_player_id: correctPlayerId,
                    status:            'voting',
                })
                .select()
                .single()

            if (error || !data) {
                throw {
                    type:    'GAME_DATABASE_ERROR',
                    message: error?.message ?? 'Failed to create round',
                } satisfies GameError
            }
            return mapRoundRow(data as unknown as RoundRow)
        })(),
        (e) => e as GameError,
    )
}

/**
 * Updates the status of a round using a **predicated UPDATE** that only
 * succeeds when the current status allows the transition.
 *
 * - `voting   → reveal`   : only when status IS `voting`   (prevents double-reveal)
 * - `reveal   → complete` : only when status IS `reveal`
 * - Any other transition  : unconditional (e.g. emergency resets)
 *
 * If the predicate fails (row already transitioned by another caller) the
 * function returns `ok(void)` — the transition is treated as idempotent.
 *
 * @param roundId - Target round.
 * @param status  - New status to transition to.
 */
export function updateRoundStatus(
    roundId: string,
    status:  RoundStatus,
): ResultAsync<void, GameError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase = createServiceClient()
            const update: Record<string, unknown> = { status }
            if (status === 'reveal') update.revealed_at = new Date().toISOString()

            let query = supabase
                .from('rounds')
                .update(update)
                .eq('id', roundId)

            // Predicated transition — only one concurrent caller can win
            if (status === 'reveal')   query = query.eq('status', 'voting')
            if (status === 'complete') query = query.eq('status', 'reveal')

            const { error } = await query

            if (error) throw { type: 'GAME_DATABASE_ERROR', message: error.message } satisfies GameError
            // If no row was updated (predicate failed), a concurrent caller already
            // transitioned — treat as idempotent success.
        })(),
        (e) => e as GameError,
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Votes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Inserts a player's vote.
 *
 * `isCorrect` is passed explicitly — the DB trigger was removed and correctness
 * is now computed in the service layer.
 * `voteTimeMs` records how fast the player voted (ms since round start).
 *
 * @param roundId    - The round being voted on.
 * @param voterId    - Player casting the vote.
 * @param votedForId - Player being voted for.
 * @param isCorrect  - Whether `votedForId === round.correctPlayerId`.
 * @param voteTimeMs - Milliseconds from round start to vote submission.
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
            const supabase = createServiceClient()
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
            return mapVoteRow(data as unknown as VoteRow)
        })(),
        (e) => e as GameError,
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Scores — batch operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Batch-upserts scores for a set of votes in 2 DB round-trips total,
 * regardless of player count. Also writes back `points_awarded` on each vote.
 *
 * Algorithm:
 *  1. Load all existing scores for the relevant player IDs in one query.
 *  2. Compute new points / streak for each vote via {@link calculateRoundScore}.
 *  3. Write all score results in one `upsert` call.
 *  4. Batch-update `votes.points_awarded` so the reveal screen can show them.
 *  5. Return achievements earned this round (streaks, speed, double success).
 *
 * Scoring rules are defined in `src/features/scoring/service.ts`.
 *
 * @param votes   - All votes from this round with speed/double data.
 * @param lobbyId - The lobby these scores belong to.
 */
export function batchUpsertScores(
    votes:   Array<{ voteId: string; voterId: string; isCorrect: boolean; voteTimeMs: number | null; usedDouble: boolean }>,
    lobbyId: string,
): ResultAsync<Achievement[], GameError> {
    return ResultAsync.fromPromise(
        (async () => {
            if (votes.length === 0) return []

            const supabase = createServiceClient()
            const voterIds = votes.map((v) => v.voterId)

            // 1. Fetch all current scores in one query
            const { data: existing } = await supabase
                .from('scores')
                .select('player_id, points, streak')
                .eq('lobby_id', lobbyId)
                .in('player_id', voterIds)

            const scoreMap = new Map(
                (existing ?? []).map((s) => [
                    s.player_id,
                    s as { player_id: string; points: number; streak: number },
                ]),
            )

            // 2. Compute new values in memory using calculateRoundScore
            const results = votes.map((vote) => {
                const prev   = scoreMap.get(vote.voterId)
                const output = calculateRoundScore({
                    isCorrect:  vote.isCorrect,
                    voteTimeMs: vote.voteTimeMs,
                    streak:     prev?.streak ?? 0,
                    usedDouble: vote.usedDouble,
                })
                return {
                    voteId:       vote.voteId,
                    voterId:      vote.voterId,
                    prevPoints:   prev?.points ?? 0,
                    pointsEarned: output.pointsEarned,
                    newStreak:    output.newStreak,
                    speedMult:    output.speedMultiplier,
                    usedDouble:   vote.usedDouble,
                    isCorrect:    vote.isCorrect,
                    voteTimeMs:   vote.voteTimeMs,
                }
            })

            // 3. Single batch upsert of scores
            const upserts = results.map((r) => ({
                player_id: r.voterId,
                lobby_id:  lobbyId,
                points:    r.prevPoints + r.pointsEarned,
                streak:    r.newStreak,
            }))

            const { error: scoreErr } = await supabase
                .from('scores')
                .upsert(upserts, { onConflict: 'player_id,lobby_id' })

            if (scoreErr) throw { type: 'GAME_DATABASE_ERROR', message: scoreErr.message } satisfies GameError

            // 4. Batch-update points_awarded on each vote row
            //    Use a series of individual updates (Supabase doesn't support
            //    multi-row UPDATE with different values per row in one call).
            await Promise.all(
                results.map(({ voteId, pointsEarned }) =>
                    supabase
                        .from('votes')
                        .update({ points_awarded: pointsEarned })
                        .eq('id', voteId),
                ),
            )

            // 5. Collect achievements (player names are NOT available here — resolved
            //    in the service layer by looking up the lobby player list)
            const achievements: Achievement[] = []

            // Determine fastest correct voter
            const correctResults = results.filter((r) => r.isCorrect && r.voteTimeMs !== null)
            if (correctResults.length > 0) {
                const fastest = correctResults.reduce((a, b) =>
                    (a.voteTimeMs ?? Infinity) < (b.voteTimeMs ?? Infinity) ? a : b,
                )
                if (fastest.voteTimeMs !== null) {
                    achievements.push({
                        type:       'FASTEST_VOTE',
                        playerId:   fastest.voterId,
                        playerName: '',   // resolved in service
                        voteTimeMs: fastest.voteTimeMs,
                    })
                }
            }

            for (const r of results) {
                if (r.newStreak === 5) {
                    achievements.push({ type: 'STREAK_5', playerId: r.voterId, playerName: '', streak: r.newStreak })
                }
                if (r.newStreak === 10) {
                    achievements.push({ type: 'STREAK_10', playerId: r.voterId, playerName: '', streak: r.newStreak })
                }
                if (r.isCorrect && r.usedDouble) {
                    achievements.push({ type: 'DOUBLE_SUCCESS', playerId: r.voterId, playerName: '', pointsEarned: r.pointsEarned })
                }
                // Big points: earned ≥ 200 (double base) and not already covered by DOUBLE_SUCCESS
                if (r.pointsEarned >= 200 && !(r.isCorrect && r.usedDouble)) {
                    achievements.push({ type: 'BIG_POINTS', playerId: r.voterId, playerName: '', pointsEarned: r.pointsEarned })
                }
            }

            return achievements
        })(),
        (e) => e as GameError,
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Double-or-Nothing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sets `used_double = true` on a player's vote for the current round.
 *
 * Only allowed while the round is still in `voting` status.
 * This is enforced in the service layer before calling this function.
 *
 * @param roundId - The active round.
 * @param voterId - The player activating double-or-nothing.
 */
export function updateVoteDouble(
    roundId: string,
    voterId: string,
): ResultAsync<void, GameError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase = createServiceClient()
            const { error } = await supabase
                .from('votes')
                .update({ used_double: true })
                .eq('round_id', roundId)
                .eq('voter_id', voterId)
                // Only allow if not already doubled (idempotent guard)
                .eq('used_double', false)

            if (error) throw { type: 'GAME_DATABASE_ERROR', message: error.message } satisfies GameError
        })(),
        (e) => e as GameError,
    )
}