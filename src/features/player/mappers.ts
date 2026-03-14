import { PlayerRowSchema } from './validations'
import type { Player }     from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Mappers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates a raw `players` DB row and maps it to the {@link Player} domain type.
 *
 * ### Why `unknown` input
 * The input is raw data from the database. Typing it as `PlayerRow` would
 * require the caller to cast first, defeating the purpose of validation.
 * `unknown` forces all field access through the Zod parse, which is the
 * trust boundary between the DB and the application.
 *
 * ### Why ZodError propagates
 * This function is called inside a `ResultAsync` wrapper in `queries.ts`.
 * Throwing on invalid data lets `ResultAsync.fromPromise` catch the ZodError
 * and surface it as a `PLAYER_DATABASE_ERROR` with a descriptive message.
 * The caller never receives a silently corrupted `Player`.
 *
 * @throws {ZodError} if `row` does not match {@link PlayerRowSchema}.
 *
 * @internal — not exported from the public barrel. Used only by DAL queries.
 */
export function mapPlayerRow(row: unknown): Player {
    const validated = PlayerRowSchema.parse(row)

    return {
        id:          validated.id,
        lobbyId:     validated.lobby_id,
        displayName: validated.display_name,
        avatarSeed:  validated.avatar_seed,
        isHost:      validated.is_host,
        // joined_at is guaranteed to be a valid ISO 8601 string by the schema.
        joinedAt:    new Date(validated.joined_at),
    }
}