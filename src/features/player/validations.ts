import { z } from 'zod'

// ─────────────────────────────────────────────────────────────────────────────
// DB row schema and type
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Runtime validation schema for raw `players` DB rows.
 *
 * Used by `mapPlayerRow` in `mappers.ts` as the trust boundary between the
 * database and the application. If any field is missing, the wrong type, or
 * `joined_at` is not a valid ISO 8601 datetime, the parse throws a ZodError
 * that is caught by the DAL's ResultAsync wrapper.
 *
 * `joined_at` uses `.datetime()` so a null or Unix integer from the DB
 * produces a descriptive ZodError instead of silently becoming `Date(0)`
 * (which was the previous behaviour with `new Date(null)`).
 *
 * @internal — not exported from the public barrel.
 */
export const PlayerRowSchema = z.object({
    id: z.string().uuid(),
    lobby_id:  z
        .string()
        .length(6)
        .toUpperCase()
        .regex(/^[A-Z0-9]{6}$/, 'Invalid lobby code format'),    display_name: z.string(),
    avatar_seed: z.string(),
    is_host: z.boolean(),

    /** ISO 8601 timestamp string — enforced at parse time. */
    joined_at: z.string().datetime({ offset: true }),
})

/**
 * Raw DB row from the `players` table.
 * Derived from {@link PlayerRowSchema} so the type and validator stay in sync.
 *
 * @internal — not exported from the public barrel. Consumers use {@link Player}.
 */
export type PlayerRow = z.infer<typeof PlayerRowSchema>