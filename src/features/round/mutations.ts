import { ResultAsync }          from 'neverthrow'
import { toAppError }          from '@/lib/errors/error-handler'
import { createClient }        from '@/lib/supabase/server'
import { mapRoundRow }          from './mappers'
import type {Round, RoundStatus} from './types'
import type { GameError }     from '@/features/game'

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
            const supabase = createClient()
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

            // Pass data as unknown — mapRoundRow validates via RoundRowSchema.
            return mapRoundRow(data)
        })(),
        (e) => toAppError<GameError>(e, 'GAME_DATABASE_ERROR'),
    )
}

/**
 * Updates round status using a predicated UPDATE to prevent race conditions.
 *
 * - `voting → reveal`   — only when current status IS `voting` (prevents double-reveal)
 * - `reveal → complete` — only when current status IS `reveal`
 * - Other transitions   — unconditional (e.g. emergency resets)
 *
 * Returns `{ transitioned: true }` when the UPDATE affected a row (this caller
 * won the race), or `{ transitioned: false }` when the predicate failed
 * (another concurrent caller already transitioned — treated as idempotent).
 *
 * Sets `revealed_at` automatically when transitioning to `reveal`.
 */
export function updateRoundStatus(
    roundId: string,
    status:  RoundStatus,
): ResultAsync<{ transitioned: boolean }, GameError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase = createClient()
            const update: Record<string, unknown> = { status }
            if (status === 'reveal') update.revealed_at = new Date().toISOString()

            // Build the predicated UPDATE query.
            // Using .select() after .update() returns the affected rows —
            // an empty array means the predicate failed (concurrent caller already transitioned).
            let query = supabase
                .from('rounds')
                .update(update)
                .eq('id', roundId)

            if (status === 'reveal')   query = query.eq('status', 'voting')
            if (status === 'complete') query = query.eq('status', 'reveal')

            const { data, error } = await query.select('id')

            if (error) throw { type: 'GAME_DATABASE_ERROR', message: error.message } satisfies GameError

            // data is the array of updated rows. Empty = predicate failed = another caller won.
            return { transitioned: Array.isArray(data) && data.length > 0 }
        })(),
        (e) => toAppError<GameError>(e, 'GAME_DATABASE_ERROR'),
    )
}

