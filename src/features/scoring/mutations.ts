import { ResultAsync }         from 'neverthrow'
import { toAppError }          from '@/lib/errors/error-handler'
import { createClient }        from '@/lib/supabase/server'
import type { ScoreRow }       from './types'
import type { GameError }      from '@/features/game'

// ─────────────────────────────────────────────────────────────────────────────
// Scores
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Upserts score rows for a round in a single batch.
 *
 * `lobbyId` is the single source of truth for the lobby association — it is
 * merged into each row here at write time. `ScoreRow` intentionally does not
 * carry `lobby_id` to avoid a dual-source-of-truth bug where the row value
 * and the parameter could silently diverge.
 *
 * Uses `onConflict: 'player_id, lobby_id'` so that re-running reveal (e.g.
 * after a crash mid-reveal) is idempotent — the second call overwrites with
 * the same values rather than inserting duplicates.
 */
export function batchUpsertScores(
    lobbyId: string,
    scores:  ScoreRow[],
): ResultAsync<void, GameError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase = createClient()
            const { error } = await supabase
                .from('scores')
                .upsert(
                    scores.map((s) => ({ ...s, lobby_id: lobbyId })),
                    { onConflict: 'player_id, lobby_id' },
                )

            if (error) throw { type: 'GAME_DATABASE_ERROR', message: error.message } satisfies GameError
        })(),
        (e) => toAppError<GameError>(e, 'GAME_DATABASE_ERROR'),
    )
}


