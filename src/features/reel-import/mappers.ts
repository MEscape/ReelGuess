import { ReelRowSchema } from './validations'
import type { Reel }     from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Mappers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates a raw `reels` DB row and maps it to the {@link Reel} domain type.
 *
 * ### Why `unknown` input
 * The input is raw data from the database or a Supabase result set. Typing it
 * as `ReelRow` would require the caller to cast first, defeating the purpose
 * of validation. `unknown` forces all field access through the Zod parse,
 * which is the trust boundary between the DB and the application.
 *
 * ### Why ZodError propagates
 * This function is called inside `ResultAsync.fromPromise` wrappers in
 * `queries.ts` and `mutations.ts`. A ZodError thrown here is caught and
 * surfaces as a `REEL_DATABASE_ERROR` with a descriptive message. The caller
 * never receives a silently corrupted `Reel`.
 *
 * @throws {ZodError} if `row` does not match {@link ReelRowSchema}.
 *
 * @internal — not exported from the public barrel. Used only by DAL files.
 */
export function mapReelRow(row: unknown): Reel {
    const validated = ReelRowSchema.parse(row)

    return {
        id:           validated.id,
        lobbyId:      validated.lobby_id,
        ownerId:      validated.owner_id,
        instagramUrl: validated.instagram_url,
        used:         validated.used,
        // created_at is guaranteed to be a valid ISO 8601 string by the schema.
        createdAt:    new Date(validated.created_at),
    }
}