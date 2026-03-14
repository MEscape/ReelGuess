import { ResultAsync }  from 'neverthrow'
import { createClient } from '@/lib/supabase/server'
import { toAppError }   from '@/lib/errors/error-handler'
import type { ScoreEntry } from './types'
import type { GameError }  from '@/features/game'
import {ScoreRowsSchema} from "./validations";

// ─────────────────────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches all score rows for a lobby, ordered by points descending.
 *
 * Includes `players.display_name` and `players.avatar_seed` via a join so
 * the leaderboard has all display data in one query.
 */
export function getScoresForLobby(lobbyId: string): ResultAsync<ScoreEntry[], GameError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('scores')
                .select('player_id, points, streak, players(display_name, avatar_seed)')
                .eq('lobby_id', lobbyId)
                .order('points', { ascending: false })

            if (error) throw { type: 'GAME_DATABASE_ERROR', message: error.message } satisfies GameError

            // Validated parse — throws ZodError on schema mismatch, caught below.
            const rows = ScoreRowsSchema.parse(data)

            return rows.map((row) => ({
                playerId:    row.player_id,
                points:      row.points,
                streak:      row.streak,
                displayName: row.players?.display_name ?? '',
                avatarSeed:  row.players?.avatar_seed  ?? '',
            }))
        })(),
        (e) => toAppError<GameError>(e, 'GAME_DATABASE_ERROR'),
    )
}
