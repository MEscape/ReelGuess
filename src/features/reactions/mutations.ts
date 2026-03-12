import { ResultAsync }        from 'neverthrow'
import { createServiceClient } from '@/lib/supabase/service'
import { mapReactionRow }      from './types'
import type { Reaction, ReactionRow, ReactionEmoji } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Error type
// ─────────────────────────────────────────────────────────────────────────────

export type ReactionError = { type: 'REACTION_DATABASE_ERROR'; message: string }

// ─────────────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Inserts an emoji reaction into the `reactions` table.
 *
 * The service-role client is used so this can run server-side (API route)
 * while respecting the write-only RLS policy.
 *
 * @param lobbyId  - Lobby the reaction belongs to.
 * @param playerId - Player who reacted.
 * @param emoji    - One of the fixed {@link REACTION_EMOJIS}.
 */
export function insertReaction(
    lobbyId:  string,
    playerId: string,
    emoji:    ReactionEmoji,
): ResultAsync<Reaction, ReactionError> {
    return ResultAsync.fromPromise(
        (async () => {
            const supabase = createServiceClient()
            const { data, error } = await supabase
                .from('reactions')
                .insert({ lobby_id: lobbyId, player_id: playerId, emoji })
                .select()
                .single()

            if (error || !data) {
                throw {
                    type:    'REACTION_DATABASE_ERROR',
                    message: error?.message ?? 'Failed to insert reaction',
                } satisfies ReactionError
            }
            return mapReactionRow(data as unknown as ReactionRow)
        })(),
        (e) => e as ReactionError,
    )
}
