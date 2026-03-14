import { VoteRowSchema } from './validations'
import type { Vote }     from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Mappers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates a raw `votes` DB row and maps it to the {@link Vote} domain type.
 *
 * ### Why `unknown` input
 * The caller receives untrusted data from Supabase queries or Realtime
 * payloads. Typing it as `VoteRow` would require the caller to cast first,
 * defeating runtime validation. Using `unknown` ensures all field access
 * happens only after Zod validation.
 *
 * ### Normalisation
 * Some DB columns are nullable but the domain prefers explicit defaults:
 *
 * - `vote_time_ms`   → `null`
 * - `used_double`    → `false`
 * - `points_awarded` → `null`
 *
 * These conversions keep the domain model predictable for reducers,
 * UI logic, and scoring calculations.
 *
 * ### Error propagation
 * Any `ZodError` thrown here propagates up through the `ResultAsync` wrapper
 * in the calling DAL function. Because `ZodError` is not a `GameError`, the
 * DAL wraps it via `(e) => ({ type: 'GAME_DATABASE_ERROR', message: String(e) })`
 * — callers must use that cast form, not `e as GameError`, to avoid a broken
 * discriminant (see queries and mutations for the correct pattern).
 *
 * Also exported `@dalonly` for Realtime mapping in game hooks.
 *
 * @throws {ZodError} if the row does not match {@link VoteRowSchema}.
 *
 * @internal — only exported from the public barrel as `@dalonly`.
 */
export function mapVoteRow(row: unknown): Vote {
    const validated = VoteRowSchema.parse(row)

    return {
        id:            validated.id,
        roundId:       validated.round_id,
        voterId:       validated.voter_id,
        votedForId:    validated.voted_for_id,
        isCorrect:     validated.is_correct,
        voteTimeMs:    validated.vote_time_ms    ?? null,
        usedDouble:    validated.used_double     ?? false,
        pointsAwarded: validated.points_awarded  ?? null,
    }
}