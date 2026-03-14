import { z } from 'zod'
import { NAME_MIN_LENGTH, NAME_MAX_LENGTH } from '@/features/player'
import { SETTINGS_CONFIG } from './constants'

// ─────────────────────────────────────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Player ID schema (UUID v4).
 *
 * Used by server actions and services to validate player identifiers before
 * they reach the database.
 */
export const PlayerIdSchema = z.string().uuid()

/** Validates a 6-character alphanumeric lobby code. */
export const LobbyCodeSchema = z
    .string()
    .length(6)
    .toUpperCase()
    .regex(/^[A-Z0-9]{6}$/, 'Invalid lobby code format')

/**
 * Validates the player name field used in both create and join flows.
 *
 * `NAME_MIN_LENGTH` and `NAME_MAX_LENGTH` are imported from `@/features/player`
 * — the single source of truth for name constraints. Changing either constant
 * there automatically updates these validation messages.
 */
const PlayerNameSchema = z
    .string()
    .min(NAME_MIN_LENGTH, `Name must be at least ${NAME_MIN_LENGTH} characters`)
    .max(NAME_MAX_LENGTH, `Name must be at most ${NAME_MAX_LENGTH} characters`)
    .trim()

/** Input for {@link createLobbyAction}. */
export const CreateLobbySchema = z.object({
    playerName: PlayerNameSchema,
})

/** Input for {@link joinLobbyAction}. */
export const JoinLobbySchema = z.object({
    code: LobbyCodeSchema,
    playerName: PlayerNameSchema,
})

export type CreateLobbyInput = z.infer<typeof CreateLobbySchema>
export type JoinLobbyInput = z.infer<typeof JoinLobbySchema>

// ─────────────────────────────────────────────────────────────────────────────
// DB row schema and type
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Runtime validation schema for raw `lobbies` DB rows.
 *
 * Used by `mapLobbyRow` in `mappers.ts` as the trust boundary between the
 * database and the application. If any field is missing or the wrong type,
 * the parse throws a ZodError caught by the DAL's ResultAsync wrapper.
 *
 * `players` is `z.array(z.unknown()).optional()` — each element is validated
 * separately by `PlayerRowSchema` inside `mapLobbyRow`. This avoids a circular
 * schema dependency and keeps each schema at the boundary it owns.
 *
 * `status` uses `z.enum` so an unexpected DB value surfaces as a ZodError
 * rather than silently casting to an invalid `LobbyStatus`.
 *
 * @internal — not exported from the public barrel.
 */
export const LobbyRowSchema = z.object({
    id: z.string(),
    host_id: z.string().uuid(),
    status: z.enum(['waiting', 'playing', 'finished']),
    settings: z.object({
        rounds_count:  z.number().int().positive(),
        timer_seconds: z.number().int().positive(),
        rematch_id:    z.string().optional().nullable(),
    }).passthrough(),
    created_at: z.string().datetime({ offset: true }),

    // Each element validated individually by PlayerRowSchema in mappers.ts.
    players: z.array(z.unknown()).optional(),
})

/**
 * Raw DB row from the `lobbies` table.
 * Derived from {@link LobbyRowSchema} so the type and validator stay in sync.
 *
 * @internal — not exported from the public barrel. Consumers use {@link Lobby}.
 */
export type LobbyRow = z.infer<typeof LobbyRowSchema>

// ─────────────────────────────────────────────────────────────────────────────
// Settings schema — derived from SETTINGS_CONFIG so bounds stay in sync.
// ─────────────────────────────────────────────────────────────────────────────

/** Derive bounds from the config so validations and UI never drift apart. */
const roundsCfg    = SETTINGS_CONFIG.find((c) => c.key === 'roundsCount')!
const timerCfg     = SETTINGS_CONFIG.find((c) => c.key === 'timerSeconds')!

/**
 * Validates the host-editable lobby settings payload.
 *
 * Bounds are pulled directly from `SETTINGS_CONFIG` — updating the config
 * automatically tightens or loosens server-side validation.
 */
export const LobbySettingsSchema = z.object({
    roundsCount:  z
        .number()
        .int()
        .min(roundsCfg.min,  `Rounds must be at least ${roundsCfg.min}`)
        .max(roundsCfg.max,  `Rounds must be at most ${roundsCfg.max}`),
    timerSeconds: z
        .number()
        .int()
        .min(timerCfg.min,   `Timer must be at least ${timerCfg.min}s`)
        .max(timerCfg.max,   `Timer must be at most ${timerCfg.max}s`),
})

export type UpdateLobbySettingsInput = z.infer<typeof LobbySettingsSchema>

