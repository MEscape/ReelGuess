import { ResultAsync }   from 'neverthrow'
import { createClient }  from '@/lib/supabase/server'
import { mapReactionRow } from './types'
import type { Reaction, ReactionRow } from './types'
import type { ReactionError } from './mutations'

// ─────────────────────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches recent reactions for a lobby (up to 5 minutes old).
 *
 * Used to hydrate joining clients who may have missed earlier reactions.
 *
 * @param lobbyId - Target lobby.
 */
export function getRecentReactions(lobbyId: string): ResultAsync<Reaction[], ReactionError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase = await createClient()
            const since    = new Date(Date.now() - 5 * 60 * 1000).toISOString()

            const { data, error } = await supabase
                .from('reactions')
                .select('*')
                .eq('lobby_id', lobbyId)
                .gte('created_at', since)
                .order('created_at', { ascending: true })

            if (error) {
                throw {
                    type:    'REACTION_DATABASE_ERROR',
                    message: error.message,
                } satisfies ReactionError
            }
            return (data ?? []).map((row) => mapReactionRow(row as unknown as ReactionRow))
        })(),
        (e) => e as ReactionError,
    )
}
