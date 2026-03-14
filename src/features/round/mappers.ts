import { RoundRowSchema } from './validations'
import type { Round }     from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Mappers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates a raw `rounds` DB row and maps it to the {@link Round} domain type.
 *
 * ### Why `unknown` input
 * The caller has raw data from Supabase or a Realtime payload. Typing it as
 * `RoundRow` would require the caller to cast first, defeating validation.
 * `unknown` forces all field access through the Zod parse — the trust
 * boundary between the DB and the application.
 *
 * ### `countdown` normalisation
 * The DB check-constraint allows `status = 'countdown'` as a transient value.
 * `RoundRowSchema` maps it to `'voting'` via `.transform()` — this function
 * never sees or returns `'countdown'`.
 *
 * ### Why ZodError propagates
 * This function is called inside `ResultAsync.fromPromise` wrappers in
 * `queries.ts` and `mutations.ts`. A ZodError thrown here is caught and
 * surfaces as a `GAME_DATABASE_ERROR` with a descriptive message.
 *
 * Also exported `@dalonly` from the barrel for use by
 * `@/features/game-board/hooks/use-game-realtime` which maps Realtime payloads.
 *
 * @throws {ZodError} if `row` does not match {@link RoundRowSchema}.
 *
 * @internal — only exported from the public barrel as `@dalonly`.
 */
export function mapRoundRow(row: unknown): Round {
    const validated = RoundRowSchema.parse(row)

    return {
        id:              validated.id,
        lobbyId:         validated.lobby_id,
        roundNumber:     validated.round_number,
        reelId:          validated.reel_id,
        correctPlayerId: validated.correct_player_id,
        // status is already RoundStatus — the schema transform handles countdown→voting
        status:          validated.status,
        // started_at guaranteed to be valid ISO 8601 by z.string().datetime()
        startedAt:       new Date(validated.started_at),
        revealedAt:      validated.revealed_at ? new Date(validated.revealed_at) : null,
    }
}