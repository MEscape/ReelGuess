import { z } from 'zod'

// ─────────────────────────────────────────────────────────────────────────────
// Action input schemas
// ─────────────────────────────────────────────────────────────────────────────

/** Validates input for `submitVoteAction`. */
export const SubmitVoteSchema = z.object({
    roundId:    z.string().uuid('roundId must be a UUID'),
    voterId:    z.string().uuid('voterId must be a UUID'),
    votedForId: z.string().uuid('votedForId must be a UUID'),
})

/** Validates input for `submitDoubleAction`. */
export const SubmitDoubleSchema = z.object({
    roundId: z.string().uuid('roundId must be a UUID'),
    voterId: z.string().uuid('voterId must be a UUID'),
})

/** Validates input for `checkExistingVoteAction`. */
export const CheckExistingVoteSchema = z.object({
    roundId:  z.string().uuid('roundId must be a UUID'),
    playerId: z.string().uuid('playerId must be a UUID'),
})

export type SubmitVoteInput       = z.infer<typeof SubmitVoteSchema>
export type SubmitDoubleInput     = z.infer<typeof SubmitDoubleSchema>
export type CheckExistingVoteInput = z.infer<typeof CheckExistingVoteSchema>

// ─────────────────────────────────────────────────────────────────────────────
// DB row schema — single source of truth for VoteRow
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Runtime validation schema for raw `votes` DB rows.
 *
 * This is the **only** definition of VoteRow in the feature.
 * `types.ts` no longer declares it — the domain type there is `Vote` only.
 *
 * `submitted_at` is present in the DB row but intentionally excluded from
 * the domain `Vote` type; it is preserved here for completeness so the
 * mapper does not reject rows that include it.
 *
 * Nullable fields are explicitly represented so the mapper can normalise
 * them to domain defaults.
 *
 * @internal — not exported from the public barrel. Consumers use {@link Vote}.
 */
export const VoteRowSchema = z.object({
    id:             z.string().uuid(),
    round_id:       z.string().uuid(),
    voter_id:       z.string().uuid(),
    voted_for_id:   z.string().uuid(),
    is_correct:     z.boolean(),
    submitted_at:   z.string().optional(),
    vote_time_ms:   z.number().int().nonnegative().nullable(),
    used_double:    z.boolean().nullable(),
    points_awarded: z.number().int().nullable(),
})

/**
 * Raw DB row from the `votes` table.
 *
 * Derived from {@link VoteRowSchema} so the static type and runtime
 * validation stay in sync. This replaces the hand-written `VoteRow` that
 * previously lived in `types.ts`.
 *
 * @internal — not exported from the public barrel.
 */
export type VoteRow = z.infer<typeof VoteRowSchema>