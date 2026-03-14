import { z }            from 'zod'

/**
 * Runtime shape validation for raw Supabase score rows.
 *
 * Replaces `as unknown as ScoreRow[]` which bypassed all type safety. If the
 * DB schema changes (e.g. a column is renamed), `z.array(ScoreRowSchema).parse`
 * throws a ZodError that is caught by ResultAsync and surfaces as a
 * GAME_DATABASE_ERROR with a descriptive message instead of a silent
 * `undefined` access at runtime.
 */
export const ScoreRowSchema = z.object({
    player_id: z.string(),
    points:    z.number(),
    streak:    z.number().default(0),
    players:   z.object({
        display_name: z.string().default(''),
        avatar_seed:  z.string().default(''),
    }).nullable(),
})

/** Validates a 6-character alphanumeric lobby code. */
export const LobbyCodeSchema = z
    .string()
    .length(6)
    .toUpperCase()
    .regex(/^[A-Z0-9]{6}$/, 'Invalid lobby code format')

export const ScoreRowsSchema = z.array(ScoreRowSchema)