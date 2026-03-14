import { z }                              from 'zod'
import type { RoundStatus }              from './types'

/**
 * Validates input for `startNextRoundAction`.
 *
 * `lobbyId` applies the same full validation as `LobbyCodeSchema` in the
 * lobby feature: exactly 6 chars, uppercase, alphanumeric only.
 * A lowercase or malformed code is rejected here before reaching the DB.
 */
export const StartNextRoundSchema = z.object({
    lobbyId:  z
        .string()
        .length(6)
        .toUpperCase()
        .regex(/^[A-Z0-9]{6}$/, 'Invalid lobby code format'),
    hostPlayerId: z.string().uuid('hostPlayerId must be a UUID'),
})

/** Validates input for `completeRoundAction`. */
export const CompleteRoundSchema = z.object({
    roundId: z.string().uuid('roundId must be a UUID'),
})

/** Validates input for `getCurrentRoundAction`. */
export const GetCurrentRoundSchema = z.object({
    lobbyId:  z
        .string()
        .length(6)
        .toUpperCase()
        .regex(/^[A-Z0-9]{6}$/, 'Invalid lobby code format'),
})

export type StartNextRoundInput  = z.infer<typeof StartNextRoundSchema>
export type CompleteRoundInput   = z.infer<typeof CompleteRoundSchema>
export type GetCurrentRoundInput = z.infer<typeof GetCurrentRoundSchema>

// ─────────────────────────────────────────────────────────────────────────────
// DB row schema and type
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Runtime validation schema for raw `rounds` DB rows.
 *
 * ### `countdown` mapping
 * The DB check-constraint permits `status = 'countdown'` as a transient
 * write-ahead value. Our application domain treats it identically to `voting`
 * — the Zod `.transform()` makes this mapping explicit and declarative,
 * replacing the previous ad-hoc `parseRoundStatus` function that used a
 * `ReadonlySet<string>` + `as RoundStatus` cast + silent fallback.
 *
 * ### datetime validation
 * `started_at` uses `.datetime()` so a null or malformed timestamp throws a
 * ZodError caught by the DAL's `ResultAsync` wrapper rather than silently
 * producing an invalid Date. `revealed_at` is nullable datetime.
 *
 * @internal — not exported from the public barrel. Consumers use {@link Round}.
 */
export const RoundRowSchema = z.object({
    id:                z.string().uuid(),
    lobby_id:          z.string(),
    round_number:      z.number().int().positive(),
    reel_id:           z.string().uuid(),
    correct_player_id: z.string().uuid().nullable(),
    /**
     * DB can send 'voting' | 'reveal' | 'complete' | 'countdown'.
     * 'countdown' is normalised to 'voting' — the two are identical from
     * the application's perspective.
     */
    status: z
        .enum(['voting', 'reveal', 'complete', 'countdown'])
        .transform((s): RoundStatus => s === 'countdown' ? 'voting' : s),
    started_at:  z.string().datetime({ offset: true }),
    revealed_at: z.string().datetime({ offset: true }).nullable(),
})

/**
 * Raw DB row from the `rounds` table.
 * Derived from {@link RoundRowSchema} so the type and validator stay in sync.
 *
 * Note: because the schema has a `.transform()`, this is the *output* type
 * (status is already `RoundStatus`). Input type would be
 * `z.input<typeof RoundRowSchema>`.
 *
 * @internal — not exported from the public barrel. Consumers use {@link Round}.
 */
export type RoundRow = z.infer<typeof RoundRowSchema>