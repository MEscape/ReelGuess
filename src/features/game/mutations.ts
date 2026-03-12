import { ResultAsync }                  from 'neverthrow'
import { createServiceClient }         from '@/lib/supabase/service'
import { mapRoundRow, mapVoteRow }     from './types'
import type { Round, RoundRow, Vote, VoteRow, RoundStatus } from './types'
import type { GameError }              from './errors'

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
 *
 * @param roundId    - The round being voted on.
 * @param voterId    - Player casting the vote.
 * @param votedForId - Player being voted for.
 * @param isCorrect  - Whether `votedForId === round.correctPlayerId`.
 */
export function insertVote(
    roundId:    string,
    voterId:    string,
    votedForId: string,
    isCorrect:  boolean,
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
 * regardless of player count.
 *
 * Algorithm:
 *  1. Load all existing scores for the relevant player IDs in one query.
 *  2. Compute new points / streak for each vote in memory.
 *  3. Write all results in one `upsert` call.
 *
 * Scoring rules:
 * - Correct vote: +100 pts, streak + 1, bonus +50 if streak was already ≥ 1.
 * - Wrong vote:   +0 pts, streak reset to 0.
 *
 * @param votes   - All votes from this round.
 * @param lobbyId - The lobby these scores belong to.
 */
export function batchUpsertScores(
    votes:    Array<{ voterId: string; isCorrect: boolean }>,
    lobbyId:  string,
): ResultAsync<void, GameError> {
    return ResultAsync.fromPromise(
        (async () => {
            if (votes.length === 0) return

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

            // 2. Compute new values in memory — zero extra DB calls
            const upserts = votes.map((vote) => {
                const prev = scoreMap.get(vote.voterId)
                if (vote.isCorrect) {
                    const currentStreak = prev?.streak ?? 0
                    const newStreak     = currentStreak + 1
                    const bonus         = currentStreak >= 1 ? 50 : 0
                    return {
                        player_id: vote.voterId,
                        lobby_id:  lobbyId,
                        points:    (prev?.points ?? 0) + 100 + bonus,
                        streak:    newStreak,
                    }
                }
                return {
                    player_id: vote.voterId,
                    lobby_id:  lobbyId,
                    points:    prev?.points ?? 0,
                    streak:    0,
                }
            })

            // 3. Single batch upsert
            const { error } = await supabase
                .from('scores')
                .upsert(upserts, { onConflict: 'player_id,lobby_id' })

            if (error) throw { type: 'GAME_DATABASE_ERROR', message: error.message } satisfies GameError
        })(),
        (e) => e as GameError,
    )
}